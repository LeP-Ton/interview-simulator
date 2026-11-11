import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  createGame,
  jobMatch,
  objectiveAbility,
  resumeStrength,
  runSummary,
  transition,
} from "./engine";
import { BACKGROUNDS } from "./config";
import { hashSeed, nextRandom } from "./random";
import { createCareerRegistry } from "./registry";
import { loadGame, parseSave, readRecords, recordRun, saveGame } from "./save";
import { programmer } from "../careers/programmer/manifest";
import { generateInterviewer, interviewerImpression } from "./interviewer";
import type { CareerModule, Challenge, GameState } from "./types";

const input = {
  name: "测试同学",
  background: "experienced" as const,
  seed: "TEST-MARKET",
  mode: "free" as const,
};
const fresh = () => createGame(input, programmer);
const step = (s: GameState, a: Parameters<typeof transition>[1]) =>
  transition(s, a, programmer);
const time = 1_800_000_000_000;
export function strongAnswer(challenge: Challenge): unknown {
  if (challenge.kind === "technical")
    return {
      text: "在协作项目中我负责性能优化，先使用 Performance 和监控日志测量首屏耗时、网络请求和渲染开销。用 React memo 降低重复渲染，结合懒加载分包、缓存和 CDN，将耗时从3秒降低35%。针对高并发缓存与数据库一致性，更新后删除缓存，使用事务和队列进行重试，设置TTL过期。",
      strategy: "evidence",
      asked: true,
      followup:
        "我会先澄清业务约束，通过监控与追踪日志验证性能指标，对缓存失效和队列积压设置告警。通过100个请求的对照实验，检查数据一致性与响应时间。必要时降级，分步上线，保留回滚方案，并向团队说明结果和成本。",
      probe: "进一步说明",
    };
  if (challenge.kind === "algorithm")
    return {
      code: "function solve(nums, target) { const seen = new Map(); for (let i = 0; i < nums.length; i++) { const need = target - nums[i]; if (seen.has(need)) return [seen.get(need), i]; seen.set(nums[i], i); } return []; }",
      explanation:
        "使用哈希表记录已出现的数和下标，先查找补数，再保存当前数，避免同一元素重复使用。单次遍历支持10000个元素，时间O(n)，空间O(n)。",
      complexity: "O(n)",
    };
  if (challenge.kind === "debug")
    return {
      code: "function total(items) { let sum = 0; for (let i = 0; i < items.length; i++) { sum += items[i].price * items[i].quantity; } return Number(sum.toFixed(2)); }",
      explanation:
        "循环越界导致空数组和最后一次迭代读取undefined；金额需乘以数量；toFixed返回字符串，需要显式Number转换。验证0个商品、1个商品、数量大于1及小数金额。",
    };
  return {
    components: ["gateway", "database", "queue", "limiter", "monitor"],
    replicas: 2,
    notes:
      "网关鉴权和限流后先把通知与投递状态持久化，提交消息队列异步削峰。消费者保证幂等，失败指数退避重试，超过次数进入死信队列，监控积压和延迟。两个实例容灾；用10000QPS压力验证容量，并提供降级和告警。",
  };
}
function withOffer() {
  let state = fresh();
  const job = state.jobs.find((j) => j.minYears === 0)!;
  state = step(state, { type: "APPLY", jobId: job.id });
  state = step(state, { type: "NEXT_DAY" });
  let app = state.applications[0];
  state = step(state, {
    type: "SCHEDULE",
    applicationId: app.id,
    day: state.day,
    slot: 0,
  });
  state = step(state, {
    type: "START_INTERVIEW",
    applicationId: app.id,
    now: time,
  });
  while (state.activeInterview)
    state = step(state, {
      type: "SUBMIT_CHALLENGE",
      answer: strongAnswer(
        state.activeInterview.challenges[state.activeInterview.step],
      ),
      now: time + 1000,
    });
  app = state.applications[0];
  state = step(state, {
    type: "SCHEDULE",
    applicationId: app.id,
    day: state.day + 1,
    slot: 0,
  });
  state = step(state, { type: "NEXT_DAY" });
  state = step(state, {
    type: "START_INTERVIEW",
    applicationId: app.id,
    now: time + 2000,
  });
  while (state.activeInterview)
    state = step(state, {
      type: "SUBMIT_CHALLENGE",
      answer: strongAnswer(
        state.activeInterview.challenges[state.activeInterview.step],
      ),
      now: time + 3000,
    });
  return state;
}

describe("随机种子与职业边界", () => {
  it("相同种子生成完全一致的市场、隐藏需求、面试官和竞争者", () => {
    expect(fresh()).toEqual(fresh());
    expect(
      createGame({ ...input, seed: "OTHER" }, programmer).jobs,
    ).not.toEqual(fresh().jobs);
  });
  it("随机数状态可保存并继续，且零种子也有效", () => {
    expect(hashSeed("A")).toBe(hashSeed("A"));
    const first = nextRandom(0);
    expect(nextRandom(first.state)).toEqual(nextRandom(first.state));
    expect(first.value).toBeGreaterThanOrEqual(0);
    expect(first.value).toBeLessThan(1);
  });
  it("六种背景都有独立资源和能力，初始至少有两个初级岗位", () => {
    const games = BACKGROUNDS.map((b) =>
      createGame({ ...input, background: b.id }, programmer),
    );
    expect(new Set(games.map((g) => g.player.money)).size).toBe(6);
    expect(
      games[0].jobs.filter((j) => j.minYears === 0).length,
    ).toBeGreaterThanOrEqual(2);
    expect(objectiveAbility(games[4])).toBeGreaterThan(
      objectiveAbility(games[0]),
    );
  });
  it("职业注册拒绝重复 ID 与无能力模型的模块", () => {
    expect(() => createCareerRegistry([programmer, programmer])).toThrow(
      "重复",
    );
    expect(() =>
      createCareerRegistry([{ ...programmer, abilityModel: [] }]),
    ).toThrow("能力模型");
  });
  it("无需修改公共基座即可注册具有独立维度的第二个测试职业", () => {
    const analyst: CareerModule = {
      id: "test-analyst",
      name: "测试分析师",
      description: "只用于协议验证，不作为已完成职业展示",
      icon: "report",
      interviewRounds: 1,
      abilityModel: [
        { id: "inference", label: "推断能力", description: "独立专业维度" },
      ],
      practiceChallenges: [
        {
          kind: "analysis",
          name: "实验设计",
          icon: "report",
          description: "测试挑战",
        },
      ],
      jobs: [
        {
          title: "分析师",
          level: "A1",
          minYears: 0,
          skill: 40,
          minSalary: 10000,
          maxSalary: 15000,
          tags: ["实验"],
        },
      ],
      initialSkills: (b) => ({ inference: b.skill }),
      createInterview: () => [
        {
          id: "a",
          kind: "analysis",
          title: "实验设计",
          brief: "分析",
          timeLimit: 60,
          data: {},
        },
      ],
      createPractice: () => ({
        id: "a",
        kind: "analysis",
        title: "实验设计",
        brief: "分析",
        timeLimit: 60,
        data: {},
      }),
      ChallengePanel: () => null,
      evaluateChallenge: () => ({
        professional: 90,
        expression: 80,
        logic: 95,
        evidence: 90,
        integrity: 100,
        specialized: { 因果推断: 95 },
        feedback: ["测试反馈"],
      }),
      review: () => ["测试复盘"],
    };
    const registry = createCareerRegistry([programmer, analyst]);
    const game = createGame(input, registry.get(analyst.id));
    expect(game.careers[analyst.id].skills).toEqual({ inference: 64 });
    expect(game.careers.programmer).toBeUndefined();
    const practiced = transition(
      game,
      { type: "START_PRACTICE", kind: "analysis", now: time },
      analyst,
    );
    const finished = transition(
      practiced,
      { type: "SUBMIT_CHALLENGE", answer: {}, now: time + 1 },
      analyst,
    );
    expect(finished.lastPractice?.specialized).toEqual({ 因果推断: 95 });
    const advance = (s: GameState, a: Parameters<typeof transition>[1]) =>
      transition(s, a, analyst);
    let lifecycle = advance(game, { type: "APPLY", jobId: game.jobs[0].id });
    lifecycle = advance(lifecycle, { type: "NEXT_DAY" });
    lifecycle = advance(lifecycle, {
      type: "SCHEDULE",
      applicationId: lifecycle.applications[0].id,
      day: 2,
      slot: 0,
    });
    lifecycle = advance(lifecycle, {
      type: "START_INTERVIEW",
      applicationId: lifecycle.applications[0].id,
      now: time,
    });
    lifecycle = advance(lifecycle, {
      type: "SUBMIT_CHALLENGE",
      answer: {},
      now: time + 1,
    });
    expect(lifecycle.offers).toHaveLength(1);
  });
  it("core 的生产代码不导入具体职业模块", () => {
    const walk = (path: string): string[] =>
      readdirSync(path, { withFileTypes: true }).flatMap((f) =>
        f.isDirectory()
          ? walk(join(path, f.name))
          : f.name.endsWith(".ts") && !f.name.endsWith(".test.ts")
            ? [join(path, f.name)]
            : [],
      );
    for (const path of walk("src/core"))
      expect(readFileSync(path, "utf8")).not.toMatch(
        /from\s+['"][^'"]*careers\//,
      );
  });
});
describe("资源与日常行动", () => {
  it("专业侧重与薪资期望实际影响岗位匹配，资深履历并非对所有岗位满分", () => {
    const state = fresh();
    const job = state.jobs.find((j) => j.minYears === 2)!;
    const different = structuredClone(state);
    different.resume.emphasis = "algorithm";
    expect(jobMatch(state, job)).toBeGreaterThan(jobMatch(different, job));
    const senior = createGame({ ...input, background: "senior" }, programmer);
    expect(
      jobMatch(senior, senior.jobs.find((j) => j.minYears === 0)!),
    ).toBeLessThan(100);
  });
  it("面试官隐藏属性受种子控制，印象权重归一化", () => {
    const profile = generateInterviewer("technical", () => 0.5);
    expect(profile.professionalPreference).toBeGreaterThan(
      profile.collaborationPreference,
    );
    const equal = {
      professional: 60,
      expression: 60,
      logic: 60,
      evidence: 60,
      integrity: 60,
      specialized: {},
      feedback: [],
    };
    expect(interviewerImpression(equal, "technical", profile)).toBe(60);
    expect(interviewerImpression(equal, "gentle")).toBe(60);
    expect(fresh().jobs[0].interviewer).toEqual(fresh().jobs[0].interviewer);
  });
  it("状态转换为纯函数，不修改旧存档", () => {
    const state = fresh();
    const snapshot = JSON.stringify(state);
    const next = step(state, { type: "STUDY", skill: "algorithm" });
    expect(JSON.stringify(state)).toBe(snapshot);
    expect(next.player.money).toBe(state.player.money - 80);
    expect(next.slots).toBe(3);
    expect(next.careers.programmer.skills.algorithm).toBeGreaterThan(
      state.careers.programmer.skills.algorithm,
    );
  });
  it("精力、资金、时段不足时阻止行动，资源不产生负值", () => {
    const state = fresh();
    state.slots = 0;
    expect(() => step(state, { type: "SEARCH" })).toThrow("时段不足");
    state.slots = 4;
    state.player.energy = 0;
    expect(() => step(state, { type: "STUDY", skill: "debug" })).toThrow(
      "精力不足",
    );
    state.player.energy = 100;
    state.player.money = 0;
    expect(() => step(state, { type: "STUDY", skill: "debug" })).toThrow(
      "资金不足",
    );
  });
  it("学习潜力因背景而异，休息恢复精力且不超上限", () => {
    const graduate = createGame(
      { ...input, background: "graduate" },
      programmer,
    );
    const learned = step(graduate, { type: "STUDY", skill: "knowledge" });
    expect(
      learned.careers.programmer.skills.knowledge -
        graduate.careers.programmer.skills.knowledge,
    ).toBe(8);
    const rested = step(learned, { type: "REST" });
    expect(rested.player.energy).toBe(100);
  });
  it("隔夜扣生活费并恢复精力，缺钱进入节俭机制", () => {
    const state = fresh();
    state.player.energy = 30;
    state.player.money = 20;
    const next = step(state, { type: "NEXT_DAY" });
    expect(next.player.money).toBe(0);
    expect(next.player.energy).toBe(46);
    expect(next.events[0].title).toBe("生活费不足");
  });
  it("调查逐层揭示真实信息，招聘会和新机会搜索有效", () => {
    let state = fresh();
    const job = state.jobs[0];
    state = step(state, { type: "RESEARCH", jobId: job.id });
    expect(state.jobs[0].research).toBe(1);
    expect(state.events[0].text).toBe(job.problem);
    state = step(state, { type: "FAIR" });
    expect(state.player.communication).toBe(64);
    const count = state.jobs.filter((j) => j.discovered).length;
    state = step(state, { type: "SEARCH" });
    expect(state.jobs.filter((j) => j.discovered).length).toBe(count + 1);
  });
  it("同样行动驱动相同的企业变动和 NPC 进度", () => {
    let a = fresh();
    let b = fresh();
    const initial = a.jobs[0].competitors[0].progress;
    for (let n = 0; n < 12; n++) {
      a = step(a, { type: "NEXT_DAY" });
      b = step(b, { type: "NEXT_DAY" });
    }
    expect(a).toEqual(b);
    expect(a.jobs[0].competitors[0].progress).toBeGreaterThan(initial);
    expect(a.events.some((e) => e.title.includes("市场变动"))).toBe(true);
  });
});
describe("简历、投递与多轮面试", () => {
  it("具体职责和量化成果改善简历评分", () => {
    expect(
      resumeStrength({
        title: "开发",
        summary: "我很厉害",
        project: "负责项目",
        emphasis: "knowledge",
      }),
    ).toBeLessThan(fresh().resume.strength);
    expect(() =>
      step(fresh(), {
        type: "RESUME",
        resume: { title: "", summary: "", project: "", emphasis: "knowledge" },
      }),
    ).toThrow("求职意向");
  });
  it("投递次日得到邀请，重复投递被阻止", () => {
    const state = fresh();
    const job = state.jobs.find((j) => j.minYears === 0)!;
    const applied = step(state, { type: "APPLY", jobId: job.id });
    expect(applied.applications[0].status).toBe("submitted");
    expect(() => step(applied, { type: "APPLY", jobId: job.id })).toThrow(
      "已经投递",
    );
    const next = step(applied, { type: "NEXT_DAY" });
    expect(next.applications[0].status).toBe("scheduling");
  });
  it("预约校验日期、时段冲突，并对缺席提供可解释反馈", () => {
    let state = fresh();
    for (const job of state.jobs.filter((j) => j.minYears === 0).slice(0, 2))
      state = step(state, { type: "APPLY", jobId: job.id });
    state = step(state, { type: "NEXT_DAY" });
    const [a, b] = state.applications;
    expect(() =>
      step(state, { type: "SCHEDULE", applicationId: a.id, day: 1, slot: 0 }),
    ).toThrow("有效日期");
    state = step(state, {
      type: "SCHEDULE",
      applicationId: a.id,
      day: 2,
      slot: 0,
    });
    expect(() =>
      step(state, { type: "SCHEDULE", applicationId: b.id, day: 2, slot: 0 }),
    ).toThrow("已经有");
    state = step(state, { type: "NEXT_DAY" });
    expect(state.applications[0].status).toBe("rejected");
    expect(state.applications[0].feedback).toContain("未在约定日期");
  });
  it("四类挑战覆盖两轮面试，优质作答可以获得真实 Offer", () => {
    const state = withOffer();
    expect(state.offers).toHaveLength(1);
    expect(state.applications[0].reports).toHaveLength(2);
    const report = state.applications[0].reports[1];
    expect(report.passed).toBe(true);
    expect(report.specialized["Debug 能力"]).toBeGreaterThan(80);
    expect(report.specialized["系统设计"]).toBeGreaterThan(80);
    expect(state.offers[0].salary).toBeLessThanOrEqual(
      state.jobs.find((j) => j.id === state.offers[0].jobId)!.budget,
    );
    expect(state.stats.interviews).toBe(2);
  });
  it("面试进行中不能通过其他行动绕过时间与精力消耗", () => {
    const state = step(fresh(), {
      type: "START_PRACTICE",
      kind: "debug",
      now: time,
    });
    expect(() => step(state, { type: "NEXT_DAY" })).toThrow("先完成");
    expect(() => step(state, { type: "STUDY", skill: "debug" })).toThrow(
      "先完成",
    );
  });
  it("挑战超时按已声明规则限分", () => {
    let state = step(fresh(), {
      type: "START_PRACTICE",
      kind: "algorithm",
      now: time,
    });
    const c = state.activeInterview!.challenges[0];
    state = step(state, {
      type: "SUBMIT_CHALLENGE",
      answer: strongAnswer(c),
      now: time + c.timeLimit * 1000 + 1,
    });
    expect(state.lastPractice!.professional).toBe(35);
    expect(state.lastPractice!.feedback.join("")).toContain("超过本题时限");
  });
  it("不合格专业表现不能仅靠初始能力通过面试", () => {
    let state = fresh();
    const job = state.jobs.find((j) => j.minYears === 0)!;
    state = step(state, { type: "APPLY", jobId: job.id });
    state = step(state, { type: "NEXT_DAY" });
    state = step(state, {
      type: "SCHEDULE",
      applicationId: state.applications[0].id,
      day: 2,
      slot: 0,
    });
    state = step(state, {
      type: "START_INTERVIEW",
      applicationId: state.applications[0].id,
      now: time,
    });
    while (state.activeInterview)
      state = step(state, {
        type: "SUBMIT_CHALLENGE",
        answer: {},
        now: time + 1,
      });
    expect(state.applications[0].status).toBe("rejected");
    expect(state.applications[0].reports[0].reason).toContain("专业挑战");
  });
});
describe("Offer 谈判与结算", () => {
  it("不同挑战模式采用各自目标，极速求职要求面试时匹配度至少60", () => {
    const state = withOffer();
    state.mode = "salary";
    expect(runSummary(state).score).toBe(
      state.offers[0].salary * (12 + state.offers[0].bonus),
    );
    state.mode = "collector";
    expect(runSummary(state).score).toBe(100);
    state.mode = "fit";
    expect(runSummary(state).score).toBe(runSummary(state).bestMatch * 100);
    state.mode = "speed";
    expect(runSummary(state).score).toBe(
      (31 - state.offers[0].createdDay) * 100,
    );
    state.applications[0].reports.at(-1)!.match = 30;
    expect(runSummary(state).score).toBe(0);
  });
  it("预算内谈判可加薪，福利和入职日期可以实际协商", () => {
    let state = withOffer();
    const offer = state.offers[0];
    const previous = offer.salary;
    state = step(state, {
      type: "NEGOTIATE",
      offerId: offer.id,
      salary: previous + 100,
    });
    expect(state.offers[0].salary).toBeGreaterThan(previous);
    state = step(state, {
      type: "OFFER_ACTION",
      offerId: offer.id,
      action: "benefits",
    });
    expect(state.offers[0].benefitsAsked).toBe(true);
    state = step(state, {
      type: "OFFER_ACTION",
      offerId: offer.id,
      action: "date",
      startIn: 30,
    });
    expect(state.offers[0].startIn).toBe(30);
  });
  it("持续提出远超预算的要求会让企业撤回 Offer", () => {
    let state = withOffer();
    const offer = state.offers[0];
    state = step(state, { type: "NEXT_DAY" });
    for (let i = 0; i < 3; i++)
      state = step(state, {
        type: "NEGOTIATE",
        offerId: offer.id,
        salary: 900000,
      });
    expect(state.offers[0].status).toBe("withdrawn");
    expect(state.offers[0].negotiations).toBe(3);
  });
  it("主动拒绝不算失败，接受的 Offer 受状态保护", () => {
    let state = withOffer();
    const declined = step(state, {
      type: "OFFER_ACTION",
      offerId: state.offers[0].id,
      action: "reject",
    });
    expect(declined.ended).toBe(false);
    expect(declined.offers[0].status).toBe("rejected");
    state = step(state, {
      type: "OFFER_ACTION",
      offerId: state.offers[0].id,
      action: "accept",
    });
    expect(state.offers[0].status).toBe("accepted");
    expect(() =>
      step(state, {
        type: "NEGOTIATE",
        offerId: state.offers[0].id,
        salary: 90000,
      }),
    ).toThrow("已结束");
  });
  it("未回复 Offer 会过期，并从有效薪资统计中移除", () => {
    let state = withOffer();
    const expiry = state.offers[0].expiresDay;
    while (state.day <= expiry) state = step(state, { type: "NEXT_DAY" });
    expect(state.offers[0].status).toBe("expired");
    expect(runSummary(state).maxSalary).toBe(0);
    expect(state.stats.offers).toBe(1);
  });
  it("第30天结束才结算，结束后不能继续消耗行动", () => {
    let state = fresh();
    for (let i = 0; i < 29; i++) state = step(state, { type: "NEXT_DAY" });
    expect(state.day).toBe(30);
    expect(state.ended).toBe(false);
    state = step(state, { type: "NEXT_DAY" });
    expect(state.ended).toBe(true);
    expect(state.day).toBe(30);
    expect(() => step(state, { type: "SEARCH" })).toThrow("已结束");
  });
});
describe("存档恢复与损坏保护", () => {
  const memory = () => {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
  };
  it("自动与手动存档隔离，保存和恢复不丢失随机数状态", () => {
    const storage = memory();
    const initial = fresh();
    saveGame(storage, initial, "manual");
    const next = step(initial, { type: "NEXT_DAY" });
    saveGame(storage, next);
    expect(loadGame(storage)).toEqual(next);
    expect(loadGame(storage, "manual")).toEqual(initial);
  });
  it("面试草稿、剩余截止时间与独立职业空间可以恢复", () => {
    let state = step(fresh(), {
      type: "START_PRACTICE",
      kind: "system",
      now: time,
    });
    state = step(state, {
      type: "DRAFT",
      draft: { components: ["gateway"], replicas: 2, notes: "尚未提交" },
    });
    expect(parseSave(JSON.stringify(state))).toEqual(state);
  });
  it("拒绝无效JSON、未知版本、损坏嵌套数据和无效日期", () => {
    expect(() => parseSave("bad")).toThrow("JSON");
    expect(() => parseSave('{"version":99}')).toThrow("版本");
    const data = fresh();
    expect(() => parseSave(JSON.stringify({ ...data, day: -2 }))).toThrow(
      "时间",
    );
    expect(() => parseSave(JSON.stringify({ ...data, player: null }))).toThrow(
      "求职者",
    );
    expect(() =>
      parseSave(
        JSON.stringify({
          ...data,
          jobs: [{ ...data.jobs[0], competitors: null }],
        }),
      ),
    ).toThrow("招聘市场");
  });
  it("结算后才写入本地纪录，并保留更高成绩", () => {
    const storage = memory();
    let state = fresh();
    recordRun(storage, state);
    expect(readRecords(storage)).toEqual([]);
    while (!state.ended) state = step(state, { type: "NEXT_DAY" });
    recordRun(storage, state);
    expect(readRecords(storage)).toHaveLength(1);
    expect(jobMatch(state, state.jobs[0])).toBeGreaterThanOrEqual(0);
    recordRun(storage, state);
    expect(readRecords(storage)).toHaveLength(1);
  });
});
