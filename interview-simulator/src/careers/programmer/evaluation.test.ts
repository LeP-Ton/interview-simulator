import { describe, expect, it } from "vitest";
import { createChallenge } from "./content";
import {
  algorithmChecks,
  analyzeTechnical,
  debugChecks,
  evaluateChallenge,
  systemChecks,
} from "./evaluation";
import { createGame } from "../../core/engine";
import { programmer } from "./manifest";
import { validateProgrammerSession } from "./validation";
import { transition } from "../../core/engine";

const game = createGame(
  { name: "测试", seed: "EVALUATION", background: "experienced", mode: "free" },
  programmer,
);
const context = {
  job: game.jobs[0],
  player: game.player,
  skills: game.careers.programmer.skills,
  round: 0,
};
describe("程序员独立玩法与评价", () => {
  it("导入存档会验证职业挑战内容与草稿，拒绝损坏组件数据", () => {
    const state = transition(
      game,
      { type: "START_PRACTICE", kind: "system", now: 1000 },
      programmer,
    );
    const session = state.activeInterview!;
    expect(validateProgrammerSession(session)).toBe(true);
    session.draft = { components: "not-an-array", notes: "", replicas: 2 };
    expect(validateProgrammerSession(session)).toBe(false);
    session.draft = null;
    session.challenges[0].data.question = null;
    expect(validateProgrammerSession(session)).toBe(false);
  });
  it("四类挑战有独立的交互标识、内容和专业评价维度", () => {
    const results = ["technical", "algorithm", "debug", "system"].map((kind) =>
      evaluateChallenge(createChallenge(kind, "S"), {}, context),
    );
    expect(
      new Set(results.flatMap((r) => Object.keys(r.specialized))).size,
    ).toBeGreaterThanOrEqual(5);
  });
  it("问答状态机区分模糊、夸大、承认不足和深入回答", () => {
    const c = createChallenge("technical", "S");
    expect(analyzeTechnical(c, "我会优化一下", "technical").state).toBe(
      "clarify",
    );
    expect(
      analyzeTechnical(c, "我保证100%完全没有问题", "technical").state,
    ).toBe("verify");
    expect(
      analyzeTechnical(c, "我不了解，目前还没有经验", "gentle").state,
    ).toBe("remedy");
    const detailed =
      "我会先监控日志和指标，分析缓存与数据库一致性，通过事务锁和消息队列重试，设置TTL过期，并比较渲染和网络耗时。";
    expect(analyzeTechnical(c, detailed, "technical").state).toBe("deeper");
    expect(analyzeTechnical(c, detailed, "founder").question).not.toBe(
      analyzeTechnical(c, detailed, "gentle").question,
    );
  });
  it("不同人格偏好不同策略，专业能力保持独立", () => {
    const c = createChallenge("technical", "S");
    const answer = {
      text: "我负责项目性能优化，监控网络渲染和缓存，懒加载与分包让页面耗时减少35%，并处理高并发一致性、日志、锁、队列和TTL。",
      followup:
        "通过测量监控验证结果，先澄清约束，保留回滚方案，并与团队确认用户指标与性能收益。",
      asked: true,
    };
    const gentle = {
      ...context,
      job: { ...context.job, personality: "gentle" as const },
    };
    const technical = {
      ...context,
      job: { ...context.job, personality: "technical" as const },
    };
    expect(
      evaluateChallenge(c, { ...answer, strategy: "star" }, gentle)
        .professional,
    ).toBeGreaterThan(
      evaluateChallenge(c, { ...answer, strategy: "evidence" }, gentle)
        .professional,
    );
    expect(
      evaluateChallenge(c, { ...answer, strategy: "evidence" }, technical)
        .professional,
    ).toBeGreaterThan(
      evaluateChallenge(c, { ...answer, strategy: "star" }, technical)
        .professional,
    );
  });
  it("算法缺少查找逻辑不能通过，不能靠注释伪造结构", () => {
    const c = createChallenge("algorithm", "S");
    expect(algorithmChecks(String(c.data.starter)).some((c) => c.passed)).toBe(
      false,
    );
    expect(
      algorithmChecks(
        "// seen.has(need); return [seen.get(need), i]; seen.set(nums[i], i);",
      ).some((c) => c.passed),
    ).toBe(false);
  });
  it("Debug 检查三种独立根因，初始代码全部未通过", () => {
    const checks = debugChecks(
      String(createChallenge("debug", "S").data.starter),
    );
    expect(checks).toHaveLength(3);
    expect(checks.every((c) => !c.passed)).toBe(true);
    expect(
      debugChecks(
        "for (let i=0; i<items.length; i++) { sum += items[i].price * items[i].quantity; } return Number(sum.toFixed(2));",
      ).every((c) => c.passed),
    ).toBe(true);
  });
  it("系统设计对可靠性与预算分别检查，堆组件会超支", () => {
    const valid = systemChecks({
      components: ["gateway", "database", "queue", "limiter", "monitor"],
      replicas: 2,
      notes: "",
    });
    expect(valid.checks.every((c) => c.passed)).toBe(true);
    const excessive = systemChecks({
      components: [
        "gateway",
        "database",
        "queue",
        "limiter",
        "monitor",
        "search",
        "cdn",
      ],
      replicas: 5,
      notes: "",
    });
    expect(excessive.cost).toBeGreaterThan(24);
    expect(excessive.checks.find((c) => c.name === "成本可控")?.passed).toBe(
      false,
    );
  });
});
