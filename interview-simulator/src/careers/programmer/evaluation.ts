import { clamp } from "../../core/random";
import type {
  Challenge,
  ChallengeContext,
  Evaluation,
  Personality,
} from "../../core/types";
import { ARCHITECTURE_COMPONENTS } from "./content";

export interface TechnicalAnswer {
  text: string;
  strategy: string;
  followup: string;
  asked: boolean;
  probe: string;
}
export interface CodeAnswer {
  code: string;
  explanation: string;
  complexity?: string;
  hint?: boolean;
}
export interface SystemAnswer {
  components: string[];
  replicas: number;
  notes: string;
}
const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown) =>
  typeof value === "string" ? value.slice(0, 12000) : "";
const hasEvidence = (value: string) =>
  /\d+\s*(%|％|ms|秒|万|人|个|倍|QPS)/i.test(value);

export function analyzeTechnical(
  challenge: Challenge,
  answer: string,
  personality: Personality,
  followupTendency = 50,
): { state: "clarify" | "verify" | "deeper" | "remedy"; question: string } {
  const concepts = challenge.data.concepts as string[];
  const hits = concepts.filter((pattern) =>
    new RegExp(pattern, "i").test(answer),
  ).length;
  if (/不会|不熟|没用过|没有经验|不了解/.test(answer))
    return { state: "remedy", question: String(challenge.data.remedy) };
  if (/完全没有|从不出错|所有技术|100%|百分之百/.test(answer))
    return {
      state: "verify",
      question:
        "你给出了很强的结论。请描述一个反例或失败案例，以及你如何验证这个结论。",
    };
  if (hits < (followupTendency > 80 ? 3 : 2) || answer.trim().length < 45)
    return { state: "clarify", question: String(challenge.data.clarification) };
  if (personality === "founder")
    return {
      state: "deeper",
      question: "假如团队只有一周时间，你先做哪一步？为什么它对业务最有价值？",
    };
  if (personality === "gentle")
    return {
      state: "deeper",
      question: "推动这个方案时，你如何与团队协作，又如何说明取舍？",
    };
  if (personality === "pressure")
    return {
      state: "deeper",
      question: `我想挑战一下你的方案：${challenge.data.deeper}请说明失败时的退路。`,
    };
  return { state: "deeper", question: String(challenge.data.deeper) };
}

export function algorithmChecks(
  code: string,
): { name: string; passed: boolean; detail: string }[] {
  const clean = code.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "");
  const hasLoop = /for\s*\([^)]*(?:<\s*nums\.length|<\s*\w+\.length)/.test(
    clean,
  );
  const usesMap = /new\s+Map\s*\(/.test(clean);
  const computesNeed =
    /(?:const|let)\s+(\w+)\s*=\s*target\s*-\s*nums\s*\[\s*i\s*\]/.exec(clean);
  const need = computesNeed?.[1];
  const mapCheck = need
    ? new RegExp(`\\.has\\(\\s*${need}\\s*\\)`).test(clean)
    : /\.has\(\s*target\s*-\s*nums\[i\]\s*\)/.test(clean);
  const returnMap = /return\s*\[\s*\w+\.get\([^)]*\)\s*,\s*i\s*\]/.test(clean);
  const setMap = /\.set\(\s*nums\s*\[\s*i\s*\]\s*,\s*i\s*\)/.test(clean);
  const order =
    clean.indexOf(".has(") >= 0 &&
    clean.indexOf(".has(") < clean.indexOf(".set(");
  const mapCorrect =
    hasLoop && usesMap && mapCheck && returnMap && setMap && order;
  const brute =
    /for\s*\([^)]*j\s*=\s*i\s*\+\s*1/.test(clean) &&
    /nums\[i\]\s*\+\s*nums\[j\]\s*={2,3}\s*target/.test(clean) &&
    /return\s*\[\s*i\s*,\s*j\s*\]/.test(clean) &&
    hasLoop;
  const solved = mapCorrect || brute;
  return [
    {
      name: "标准输入 [2, 7, 11, 15] → [0, 1]",
      passed: solved,
      detail: solved ? "算法结构符合已支持的解法" : "需要完整的查找与返回结构",
    },
    {
      name: "重复值 [3, 3] → [0, 1]",
      passed: solved && (!usesMap || order),
      detail: "先查找再记录，避免重复使用自身",
    },
    {
      name: "负数 [-3, 4, 3, 90] → [0, 2]",
      passed: solved,
      detail: "不依赖元素必须为正数",
    },
    {
      name: "边界循环与不同下标",
      passed: solved && !/<=\s*nums\.length/.test(clean),
      detail: "循环上界严格小于数组长度",
    },
    {
      name: "10⁴ 元素的时间复杂度",
      passed: mapCorrect,
      detail: mapCorrect
        ? "哈希表单次遍历：O(n)"
        : brute
          ? "双循环 O(n²)，正确但不满足规模要求"
          : "尚未识别完整解法",
    },
  ];
}
export function debugChecks(
  code: string,
): { name: string; passed: boolean; detail: string }[] {
  const clean = code.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "");
  const boundary =
    /i\s*<\s*items\.length/.test(clean) &&
    !/i\s*<=\s*items\.length/.test(clean);
  const quantity =
    /items\[i\]\.price\s*\*\s*items\[i\]\.quantity|items\[i\]\.quantity\s*\*\s*items\[i\]\.price/.test(
      clean,
    );
  const numeric =
    /return\s+(?:Number|parseFloat)\s*\(\s*sum\.toFixed\(2\)\s*\)|return\s+Math\.round\(sum\s*\*\s*100\)\s*\/\s*100/.test(
      clean,
    );
  return [
    {
      name: "空数组不抛异常",
      passed: boundary,
      detail: "修正循环上界：i < items.length",
    },
    {
      name: "数量参与金额计算",
      passed: quantity,
      detail: "单项金额 = price × quantity",
    },
    {
      name: "保留两位小数并返回 number",
      passed: numeric,
      detail: "toFixed 返回字符串，需要显式转为数值",
    },
  ];
}
export function systemChecks(answer: SystemAnswer) {
  const selected = new Set(answer.components);
  const cost =
    ARCHITECTURE_COMPONENTS.filter((c) => selected.has(c.id)).reduce(
      (a, b) => a + b.cost,
      0,
    ) +
    answer.replicas * 2;
  return {
    cost,
    checks: [
      {
        name: "接入与流量保护",
        passed: selected.has("gateway") && selected.has("limiter"),
        detail: "网关统一入口，限流防止突发流量击穿系统",
      },
      {
        name: "持久化与可靠投递",
        passed: selected.has("database") && selected.has("queue"),
        detail: "数据库保存状态，队列保证异步重试",
      },
      {
        name: "异步削峰",
        passed: selected.has("queue"),
        detail: "队列吸收高峰，接口无需等待下游发送完成",
      },
      {
        name: "多实例容灾",
        passed: answer.replicas >= 2 && selected.has("gateway"),
        detail: "至少两个服务实例，由网关分发流量",
      },
      {
        name: "成本可控",
        passed: cost <= 24 && cost > 4,
        detail: `当前 ${cost}/24 计算单位，避免无收益的组件`,
      },
      {
        name: "可观测性",
        passed: selected.has("monitor"),
        detail: "监控积压、失败率、延迟，并配置告警",
      },
    ],
  };
}
function result(
  score: number,
  specialized: Record<string, number>,
  explanation: string,
  feedback: string[],
  integrity = 90,
): Evaluation {
  return {
    professional: clamp(score),
    expression: clamp(
      35 +
        Math.min(45, explanation.length / 3) +
        (hasEvidence(explanation) ? 15 : 0),
    ),
    logic: clamp(score * 0.7 + Math.min(25, explanation.length / 4)),
    evidence: clamp(
      25 +
        (hasEvidence(explanation) ? 35 : 0) +
        Math.min(30, explanation.length / 4),
    ),
    integrity,
    specialized,
    feedback,
  };
}
export function evaluateChallenge(
  challenge: Challenge,
  raw: unknown,
  context: ChallengeContext,
): Evaluation {
  const answer = asRecord(raw);
  if (challenge.kind === "technical") {
    const main = text(answer.text);
    const followup = text(answer.followup);
    const whole = `${main} ${followup}`;
    const concepts = (challenge.data.concepts as string[]).filter((pattern) =>
      new RegExp(pattern, "i").test(whole),
    ).length;
    const evidence = hasEvidence(whole);
    const strategy = text(answer.strategy);
    const preferred = {
      gentle: "star",
      technical: "evidence",
      pressure: "clarify",
      founder: "outcome",
    }[context.job.personality];
    const bonus =
      strategy === preferred
        ? 8
        : strategy === "reverse" && main.length < 60
          ? -8
          : strategy === "honest"
            ? 3
            : 0;
    const score = clamp(
      8 +
        concepts * 12 +
        Math.min(10, main.length / 15) +
        (evidence ? 10 : 0) +
        (answer.asked && followup.length >= 30 ? 12 : 0) +
        bonus,
    );
    const feedback = [
      concepts >= 3
        ? "技术概念覆盖较完整；下一步练习说明方案在什么情况下会失效。"
        : "需要更具体的技术细节：先描述可测量的问题，再给出排查步骤和取舍。",
      evidence
        ? "量化成果有助于沟通，记得同时交代基线、测量方式和个人职责。"
        : "建议用真实指标和具体验证方法支撑结论，避免只有“明显提升”。",
      strategy === preferred
        ? "这次沟通策略与面试官风格比较契合。"
        : "同一种策略并非处处有效，留意面试官是在问技术细节、协作还是业务成果。",
    ];
    return result(
      score,
      { 技术知识深度: score },
      whole,
      feedback,
      /精通所有|从不出错|完全没有问题|100%/.test(main) && followup.length < 30
        ? 30
        : 90,
    );
  }
  if (challenge.kind === "algorithm") {
    const code = text(answer.code);
    const explanation = text(answer.explanation);
    const checks = algorithmChecks(code);
    const passed = checks.filter((c) => c.passed).length;
    const score = clamp(
      passed * 16 +
        (answer.complexity === "O(n)" && checks[4].passed ? 10 : 0) +
        Math.min(10, explanation.length / 5) -
        (answer.hint ? 8 : 0),
    );
    return result(
      score,
      {
        算法能力: clamp(passed * 20),
        代码质量: clamp(
          (checks[3].passed ? 55 : 15) + Math.min(35, explanation.length / 3),
        ),
      },
      explanation,
      [
        `${passed}/5 项受限结构检查通过。${passed === 5 ? "单次遍历和先查后存避免了重复下标。" : "注意补数查找、先查后存和返回两个下标。"}`,
        "这里使用确定性规则识别支持的解法，不执行任意代码；与真实编程评测存在差异。",
      ],
    );
  }
  if (challenge.kind === "debug") {
    const explanation = text(answer.explanation);
    const checks = debugChecks(text(answer.code));
    const fixed = checks.filter((c) => c.passed).length;
    const score = clamp(fixed * 28 + Math.min(16, explanation.length / 4));
    return result(
      score,
      {
        "Debug 能力": score,
        代码质量: clamp(fixed * 30 + (explanation.length > 40 ? 10 : 0)),
      },
      explanation,
      [
        `修复 ${fixed}/3 个独立问题。${checks
          .filter((c) => !c.passed)
          .map((c) => c.detail)
          .join("；")}`,
        "定位线上问题时，先记录复现条件；修复后检查空值、边界、数据类型和回归影响。",
      ],
    );
  }
  if (challenge.kind === "system") {
    const components = Array.isArray(answer.components)
      ? answer.components.filter((c): c is string => typeof c === "string")
      : [];
    const replicas =
      typeof answer.replicas === "number" && Number.isInteger(answer.replicas)
        ? clamp(answer.replicas, 1, 5)
        : 1;
    const notes = text(answer.notes);
    const evaluated = systemChecks({ components, replicas, notes });
    const passed = evaluated.checks.filter((c) => c.passed).length;
    const score = clamp(
      passed * 13 +
        Math.min(16, notes.length / 5) +
        (/幂等|重试|降级|死信/.test(notes) ? 6 : 0) -
        (evaluated.cost > 24 ? 15 : 0),
    );
    return result(
      score,
      {
        系统设计: score,
        容量规划: clamp((evaluated.cost <= 24 ? 50 : 10) + passed * 7),
      },
      notes,
      [
        `满足 ${passed}/6 项架构约束，成本 ${evaluated.cost}/24。`,
        ...evaluated.checks.filter((c) => !c.passed).map((c) => c.detail),
        "方案的价值在于满足约束；解释幂等、重试、降级和失败边界，比单纯堆组件更有说服力。",
      ],
    );
  }
  throw new Error(`不支持的专业挑战：${challenge.kind}`);
}
