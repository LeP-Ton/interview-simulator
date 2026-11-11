import { ACTION_COSTS, BACKGROUNDS, BALANCE } from "./config";
import { COMPANIES } from "./companies";
import { generateInterviewer, interviewerImpression } from "./interviewer";
import { clamp, hashSeed, nextRandom, randomSource } from "./random";
import type {
  Action,
  Application,
  BackgroundId,
  CareerModule,
  Evaluation,
  GameState,
  InterviewReport,
  Job,
  Mode,
  Offer,
  Resume,
} from "./types";

export class GameRuleError extends Error {}
function requireRule(ok: unknown, message: string): asserts ok {
  if (!ok) throw new GameRuleError(message);
}

export function objectiveAbility(state: GameState): number {
  const values = Object.values(state.careers[state.careerId].skills);
  return clamp(values.reduce((a, b) => a + b, 0) / values.length);
}
export function jobMatch(state: GameState, job: Job): number {
  const focus =
    job.focusSkill && state.careers[state.careerId].skills[job.focusSkill];
  const ability =
    typeof focus === "number"
      ? objectiveAbility(state) * 0.6 + focus * 0.4
      : objectiveAbility(state);
  const years = state.player.years - job.minYears;
  const salaryGap = Math.max(
    0,
    (state.player.expectedSalary - job.maxSalary) / state.player.expectedSalary,
  );
  return clamp(
    68 +
      Math.min(16, (ability - job.requiredSkill) * 0.9) +
      Math.max(-25, Math.min(12, years * 4)) +
      (state.resume.strength - 50) * 0.18 +
      (job.focusSkill && state.resume.emphasis === job.focusSkill ? 6 : 0) -
      salaryGap * 30 -
      Math.min(30, Math.max(0, years - 4) * 3),
  );
}
export function resumeStrength(resume: Omit<Resume, "strength">): number {
  const content = `${resume.summary} ${resume.project}`;
  const evidence = /\d+\s*(%|％|ms|秒|万|人|个|倍)/i.test(content);
  const structure = /(负责|实现|优化|设计|主导|独立|项目|结果)/.test(content);
  return clamp(
    20 +
      Math.min(28, resume.summary.trim().length / 5) +
      Math.min(27, resume.project.trim().length / 5) +
      (evidence ? 15 : 0) +
      (structure ? 10 : 0),
  );
}

export function createGame(
  input: { name: string; background: BackgroundId; seed: string; mode: Mode },
  career: CareerModule,
): GameState {
  const background = BACKGROUNDS.find((b) => b.id === input.background);
  if (!background) throw new GameRuleError("请选择有效的求职背景");
  const seed = input.seed.trim().slice(0, 64) || "NEXT-CHAPTER";
  const random = randomSource(seed);
  const companies = [...COMPANIES];
  for (let i = companies.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [companies[i], companies[j]] = [companies[j], companies[i]];
  }
  const levels = [0, 1, 2, 0, 1, 2, 3, 1, 2, 3];
  const jobs: Job[] = companies.map((company, i) => {
    const role = career.jobs[levels[i] % career.jobs.length];
    const shift = Math.round((random.next() - 0.5) * 4) * 1000;
    const minSalary = Math.max(7000, role.minSalary + shift);
    const maxSalary = Math.max(minSalary + 4000, role.maxSalary + shift);
    const personality = (
      ["gentle", "technical", "pressure", "founder"] as const
    )[Math.floor(random.next() * 4)];
    return {
      ...company,
      role: role.title,
      level: role.level,
      careerId: career.id,
      minSalary,
      maxSalary,
      budget:
        Math.round((maxSalary * (0.9 + random.next() * 0.15)) / 500) * 500,
      requiredSkill: role.skill,
      focusSkill: role.focusSkill,
      minYears: role.minYears,
      openings: 2 + Math.floor(random.next() * 3),
      competition: 28 + Math.floor(random.next() * 64),
      risk: Math.floor(random.next() * 80),
      research: 0,
      discovered: i < 8,
      closed: false,
      personality,
      interviewer: generateInterviewer(personality, random.next),
      skillTags: role.tags,
      competitors: Array.from(
        { length: 2 + Math.floor(random.next() * 3) },
        (_, n) => ({
          id: `${company.id}-${n}`,
          name: ["沈同学", "李工程师", "何同学", "王工程师"][n],
          years: Math.max(0, role.minYears + Math.floor(random.next() * 4) - 1),
          ability: clamp(role.skill - 12 + random.next() * 25),
          progress: Math.floor(random.next() * 28),
          expectedSalary:
            Math.round(
              (minSalary + random.next() * (maxSalary - minSalary)) / 1000,
            ) * 1000,
          pedigree: [
            "成长型团队",
            "知名互联网企业",
            "开源项目贡献者",
            "跨行业转型",
          ][Math.floor(random.next() * 4)],
          state: "active" as const,
        }),
      ),
    };
  });
  const defaultResume = {
    title: career.jobs[1]?.title ?? career.name,
    summary: `拥有${background.years}年相关经验，关注用户体验与工程质量。希望在开放协作的团队中持续成长。`,
    project:
      "负责团队核心项目的方案落地，通过梳理问题、验证假设和改进流程，将交付效率提升 35%，并记录可复用的实践。",
    emphasis: career.abilityModel[0].id,
    strength: 0,
  };
  const resume = {
    ...(career.createResume?.(background) ?? defaultResume),
    strength: 0,
  };
  resume.strength = resumeStrength(resume);
  return {
    version: 1,
    seed,
    rng: random.state(),
    careerId: career.id,
    mode: input.mode,
    day: 1,
    slots: BALANCE.slots,
    ended: false,
    player: {
      name: input.name.trim().slice(0, 16) || "林小满",
      background: background.id,
      years: background.years,
      money: background.money,
      energy: 100,
      communication: background.communication,
      experience: 0,
      expectedSalary: background.expected,
    },
    resume,
    careers: {
      [career.id]: {
        skills: career.initialSkills(background),
        practiceCount: 0,
      },
    },
    jobs,
    applications: [],
    offers: [],
    activeInterview: null,
    lastPractice: null,
    stats: {
      studied: 0,
      researched: 0,
      rested: 0,
      applications: 0,
      interviews: 0,
      offers: 0,
      spent: 0,
    },
    events: [
      {
        id: 1,
        day: 1,
        kind: "success",
        title: "新旅程，已准备就绪",
        text: `本期发现 ${jobs.filter((j) => j.discovered).length} 个机会。先完善简历，或调查一家感兴趣的企业。`,
      },
      {
        id: 2,
        day: 1,
        kind: "info",
        title: "招聘市场早报",
        text: `${jobs[0].name}正在扩充${jobs[0].industry}团队，技术与真实项目经验将成为加分项。`,
      },
    ],
  };
}

function event(
  state: GameState,
  title: string,
  text: string,
  kind: "info" | "success" | "warning" = "info",
) {
  state.events.unshift({
    id: (state.events[0]?.id ?? 0) + 1,
    day: state.day,
    kind,
    title,
    text,
  });
  state.events = state.events.slice(0, 120);
}
function spend(
  state: GameState,
  cost: { slots: number; energy: number; money: number },
) {
  const { slots, energy, money } = cost;
  requireRule(
    state.slots >= slots,
    "今天的行动时段不足，进入下一天后再安排吧。",
  );
  requireRule(state.player.energy >= energy, "精力不足，先休息恢复一下。");
  requireRule(
    state.player.money >= money,
    "资金不足，可以先选择免费的求职行动。",
  );
  state.slots -= slots;
  state.player.energy -= energy;
  state.player.money -= money;
  state.stats.spent += money;
}
function findJob(state: GameState, id: string): Job {
  const job = state.jobs.find((j) => j.id === id);
  requireRule(job, "没有找到这个岗位");
  return job;
}
function findApplication(state: GameState, id: string): Application {
  const application = state.applications.find((a) => a.id === id);
  requireRule(application, "没有找到这份投递");
  return application;
}
function findOffer(state: GameState, id: string): Offer {
  const offer = state.offers.find((o) => o.id === id);
  requireRule(offer, "没有找到这份 Offer");
  requireRule(offer.status === "pending", "这份 Offer 已结束，无法继续操作。");
  return offer;
}
function random(state: GameState) {
  const result = nextRandom(state.rng);
  state.rng = result.state;
  return result.value;
}

export function combineEvaluations(results: Evaluation[]): Evaluation {
  const average = (
    key: "professional" | "expression" | "logic" | "evidence" | "integrity",
  ) =>
    clamp(
      results.reduce((sum, r) => sum + r[key], 0) / Math.max(1, results.length),
    );
  const specialized: Record<string, number> = {};
  for (const key of new Set(
    results.flatMap((r) => Object.keys(r.specialized)),
  )) {
    const scores = results
      .filter((r) => key in r.specialized)
      .map((r) => r.specialized[key]);
    specialized[key] = clamp(scores.reduce((a, b) => a + b, 0) / scores.length);
  }
  return {
    professional: average("professional"),
    expression: average("expression"),
    logic: average("logic"),
    evidence: average("evidence"),
    integrity: average("integrity"),
    specialized,
    feedback: results.flatMap((r) => r.feedback),
  };
}

function finishInterview(state: GameState, career: CareerModule) {
  const session = state.activeInterview!;
  const evaluation = combineEvaluations(session.evaluations);
  if (session.practice) {
    state.lastPractice = evaluation;
    state.player.experience = clamp(state.player.experience + 3);
    state.careers[state.careerId].practiceCount++;
    event(
      state,
      "模拟训练完成",
      career.review(session.evaluations).join(" "),
      "success",
    );
    state.activeInterview = null;
    return;
  }
  const application = findApplication(state, session.applicationId!);
  const job = findJob(state, session.jobId);
  const ability = objectiveAbility(state);
  const match = jobMatch(state, job);
  const competitorScore = clamp(
    Math.max(
      ...job.competitors
        .filter((c) => c.state === "active")
        .map((c) => c.ability * 0.85 + c.progress * 0.1),
      35,
    ),
  );
  const impression = interviewerImpression(
    evaluation,
    job.personality,
    job.interviewer,
  );
  const willingness = clamp(
    evaluation.professional * 0.42 +
      evaluation.expression * 0.13 +
      evaluation.logic * 0.1 +
      match * 0.2 +
      impression * 0.15 -
      Math.max(0, competitorScore - evaluation.professional) * 0.15,
  );
  const threshold = 48 + Math.max(0, job.requiredSkill - 50) * 0.16;
  const passed =
    !job.closed &&
    job.openings > 0 &&
    willingness >= threshold &&
    evaluation.professional >= 40 &&
    evaluation.integrity >= 40;
  const reason =
    job.closed || job.openings === 0
      ? "企业招聘计划调整，本岗位暂停录用。已保留你的面试报告，这不代表你的能力不足。"
      : passed
        ? `专业表现满足岗位要求，录用意愿 ${willingness}，高于本岗位门槛 ${Math.round(threshold)}。`
        : evaluation.professional < 40
          ? "本轮专业挑战仍有明显缺口，建议根据报告补齐后挑战其他岗位。"
          : evaluation.integrity < 40
            ? "项目证据与回答存在可信度问题，建议诚实说明职责和能力边界。"
            : `综合录用意愿 ${willingness}，本岗位门槛 ${Math.round(threshold)}；候选人竞争参考 ${competitorScore}。可从匹配度与表达两方面改进。`;
  const report: InterviewReport = {
    ...evaluation,
    day: state.day,
    round: session.round,
    objectiveAbility: ability,
    match,
    impression,
    willingness,
    competitorScore,
    passed,
    reason,
  };
  application.reports.push(report);
  application.scheduledDay = null;
  application.feedback = reason;
  state.stats.interviews++;
  state.player.experience = clamp(state.player.experience + 5);
  if (!passed) {
    application.status = "rejected";
    event(state, `${job.name} · 本轮未通过`, reason, "warning");
  } else if (application.round + 1 < career.interviewRounds) {
    application.round++;
    application.status = "scheduling";
    event(
      state,
      `${job.name} · 第 ${application.round} 轮通过`,
      `恭喜！请在求职日历预约第 ${application.round + 1} 轮，继续职业专业挑战。`,
      "success",
    );
  } else {
    application.status = "offer";
    state.stats.offers++;
    // 初始报价为谈判留出空间，预算上限仍由企业经营约束决定。
    const salary =
      Math.round(
        Math.min(
          job.budget * 0.9,
          job.minSalary +
            (job.maxSalary - job.minSalary) * (0.35 + willingness / 200),
        ) / 500,
      ) * 500;
    state.offers.push({
      id: `offer-${application.id}`,
      applicationId: application.id,
      jobId: job.id,
      salary,
      bonus: job.size.includes("1,000") ? 4 : 2,
      probation: 3,
      benefits: job.benefit,
      startIn: 14,
      level: job.level,
      expiresDay: Math.min(30, state.day + BALANCE.offerDays),
      createdDay: state.day,
      status: "pending",
      negotiations: 0,
      patience: 3,
      benefitsAsked: false,
      messages: [
        `我们很认可你的表现，期待你加入${job.name}。初始报价 ¥${salary.toLocaleString("zh-CN")}/月，欢迎沟通。`,
      ],
    });
    event(
      state,
      "一份新的 Offer！",
      `${job.name}邀请你加入，月薪 ¥${salary.toLocaleString("zh-CN")}。前往 Offer 收件箱查看并谈判。`,
      "success",
    );
  }
  state.activeInterview = null;
}

function nextDay(state: GameState) {
  if (state.day === BALANCE.days) {
    state.ended = true;
    event(
      state,
      "30 天挑战结束",
      "这一路的准备、选择和成长，都已写进你的求职报告。",
      "success",
    );
    return;
  }
  state.day++;
  state.slots = BALANCE.slots;
  const paid = Math.min(BALANCE.dailyCost, state.player.money);
  state.player.money -= paid;
  state.stats.spent += paid;
  state.player.energy = clamp(
    state.player.energy +
      BALANCE.energyRecovery -
      (paid < BALANCE.dailyCost ? 12 : 0),
  );
  if (paid < BALANCE.dailyCost)
    event(
      state,
      "生活费不足",
      "已启用节俭模式：今晚精力恢复减少 12 点。免费投递与休息仍可使用。",
      "warning",
    );
  for (const application of state.applications) {
    const job = findJob(state, application.jobId);
    if (
      application.status === "submitted" &&
      application.responseDay <= state.day
    ) {
      if (
        job.closed ||
        state.player.years + 2 < job.minYears ||
        jobMatch(state, job) < 36 ||
        state.resume.strength < 30
      ) {
        application.status = "rejected";
        application.feedback = job.closed
          ? "岗位招聘已暂停。"
          : "简历与岗位要求暂不匹配，建议改善项目证据或选择更合适的职级。";
        event(state, `${job.name} · 简历反馈`, application.feedback, "warning");
      } else {
        application.status = "scheduling";
        application.feedback = "简历筛选通过，请预约首轮面试。";
        event(
          state,
          `${job.name}发来面试邀请`,
          "你的简历通过筛选了。前往求职日历选择面试时间。",
          "success",
        );
      }
    }
    if (
      application.status === "scheduled" &&
      application.scheduledDay! < state.day
    ) {
      application.status = "rejected";
      application.feedback = "未在约定日期参加面试，企业已结束本次流程。";
      event(
        state,
        `${job.name} · 错过面试`,
        "安排下一次面试时，记得给自己留出 2 个行动时段和 22 点精力。",
        "warning",
      );
    }
  }
  for (const offer of state.offers)
    if (offer.status === "pending" && offer.expiresDay < state.day) {
      offer.status = "expired";
      event(
        state,
        "Offer 已过期",
        `${findJob(state, offer.jobId).name}的回复期限已过。`,
        "warning",
      );
    }
  for (const job of state.jobs) {
    if (job.closed) continue;
    for (const competitor of job.competitors) {
      if (competitor.state !== "active") continue;
      const growth = 1 + Math.floor(random(state) * 5);
      competitor.progress = clamp(competitor.progress + growth);
      if (competitor.progress === 100) {
        if (
          competitor.ability >= job.requiredSkill &&
          competitor.expectedSalary <= job.budget &&
          job.openings > 1
        ) {
          competitor.state = "hired";
          job.openings--;
        } else competitor.state = "left";
      }
    }
    job.competition = clamp(
      job.competition + Math.floor(random(state) * 7) - 3,
      10,
      98,
    );
  }
  if (state.day % 5 === 0) {
    const candidates = state.jobs.filter((j) => !j.closed);
    if (candidates.length) {
      const job = candidates[Math.floor(random(state) * candidates.length)];
      if (job.risk > 65 && state.day >= 10) {
        job.closed = true;
        event(
          state,
          "市场变动 · 招聘冻结",
          `${job.name}因经营预算调整暂停招聘。风险线索可通过企业调查提前了解。`,
          "warning",
        );
      } else {
        job.budget = Math.round((job.budget * 1.05) / 500) * 500;
        job.maxSalary = Math.max(job.maxSalary, job.budget);
        job.openings++;
        event(
          state,
          "市场变动 · 团队扩招",
          `${job.name}增加 1 个名额，招聘预算上调约 5%。`,
        );
      }
    }
  }
}

export function transition(
  previous: GameState,
  action: Action,
  career: CareerModule,
): GameState {
  requireRule(career.id === previous.careerId, "当前职业模块与存档不一致");
  requireRule(
    !previous.ended,
    "本次 30 天挑战已结束，可以查看报告或开启新旅程。",
  );
  requireRule(
    !previous.activeInterview ||
      ["DRAFT", "SUBMIT_CHALLENGE", "ABANDON_INTERVIEW"].includes(action.type),
    "请先完成或退出当前面试。",
  );
  const state = structuredClone(previous);
  switch (action.type) {
    case "NEXT_DAY":
      nextDay(state);
      break;
    case "SEARCH": {
      spend(state, ACTION_COSTS.search);
      const job = state.jobs.find((j) => !j.discovered && !j.closed);
      if (job) {
        job.discovered = true;
        event(
          state,
          "发现新的机会",
          `${job.name} · ${job.role}，已添加到招聘市场。`,
          "success",
        );
      } else
        event(
          state,
          "招聘市场已刷新",
          "已查看全部可用岗位。竞争动态每日更新，关注已投递的企业。",
        );
      break;
    }
    case "RESEARCH": {
      const job = findJob(state, action.jobId);
      requireRule(job.research < 3, "这家企业的信息已调查完毕。");
      spend(state, ACTION_COSTS.research);
      job.research++;
      state.stats.researched++;
      const intel = [
        job.problem,
        `实际月薪预算上限 ¥${job.budget.toLocaleString("zh-CN")}；${job.intensity}。`,
        `经营风险 ${job.risk}/100；更重视${job.preference}。`,
      ][job.research - 1];
      event(state, `${job.name} · 新情报`, intel, "success");
      break;
    }
    case "RESUME": {
      requireRule(
        action.resume.title.trim().length > 0 &&
          action.resume.summary.trim().length >= 10,
        "请填写求职意向，并至少写 10 字个人简介。",
      );
      requireRule(
        career.abilityModel.some((s) => s.id === action.resume.emphasis),
        "请选择有效的专业侧重",
      );
      spend(state, ACTION_COSTS.resume);
      state.resume = {
        title: action.resume.title.slice(0, 60),
        summary: action.resume.summary.slice(0, 2000),
        project: action.resume.project.slice(0, 4000),
        emphasis: action.resume.emphasis,
        strength: resumeStrength(action.resume),
      };
      event(
        state,
        "简历已更新",
        `完整度 ${state.resume.strength}。具体职责、技术细节和量化成果有助于通过筛选。`,
        "success",
      );
      break;
    }
    case "APPLY": {
      const job = findJob(state, action.jobId);
      requireRule(
        job.discovered && !job.closed && job.openings > 0,
        "岗位暂时不接受投递。",
      );
      requireRule(
        state.player.years + 2 >= job.minYears,
        "这个职级需要更多工作经验，先从适合的岗位开始。",
      );
      requireRule(
        !state.applications.some((a) => a.jobId === job.id),
        "你已经投递过这个岗位。",
      );
      spend(state, ACTION_COSTS.apply);
      state.stats.applications++;
      state.applications.push({
        id: `app-${job.id}`,
        jobId: job.id,
        status: "submitted",
        appliedDay: state.day,
        responseDay: state.day + 1,
        round: 0,
        scheduledDay: null,
        slot: 0,
        reports: [],
        feedback: "简历已送达，预计明天收到反馈。",
      });
      event(
        state,
        "简历投递成功",
        `${job.name}已收到你的简历，记得关注明天的反馈。`,
        "success",
      );
      break;
    }
    case "STUDY": {
      requireRule(
        action.skill in state.careers[state.careerId].skills,
        "请选择有效的能力方向。",
      );
      const skills = state.careers[state.careerId].skills;
      requireRule(
        skills[action.skill] < 100,
        "这项能力已达到满值，可以提升其他能力。",
      );
      spend(state, ACTION_COSTS.study);
      const learning = BACKGROUNDS.find(
        (b) => b.id === state.player.background,
      )!.learning;
      skills[action.skill] = clamp(skills[action.skill] + 5 * learning);
      state.stats.studied++;
      event(
        state,
        "又向前迈了一小步",
        `${career.abilityModel.find((s) => s.id === action.skill)?.label}提升至 ${skills[action.skill]}。`,
        "success",
      );
      break;
    }
    case "MOCK":
      spend(state, ACTION_COSTS.mock);
      state.player.communication = clamp(state.player.communication + 4);
      state.player.experience = clamp(state.player.experience + 2);
      event(
        state,
        "表达练习完成",
        "练习了 STAR 叙事：情境、任务、行动、结果。沟通 +4，面试经验 +2。",
        "success",
      );
      break;
    case "FAIR": {
      spend(state, ACTION_COSTS.fair);
      state.player.communication = clamp(state.player.communication + 3);
      const job = state.jobs.find((j) => !j.closed && j.research === 0);
      if (job) {
        job.research = 1;
        job.discovered = true;
      }
      event(
        state,
        "招聘会上的新收获",
        `沟通能力 +3。${job ? `你认识了${job.name}的团队，了解到：${job.problem}` : "与行业伙伴交流，完善了求职方向。"}`,
        "success",
      );
      break;
    }
    case "REST":
      requireRule(
        state.player.energy < 100,
        "精力已经充满，去探索新的机会吧。",
      );
      spend(state, ACTION_COSTS.rest);
      state.player.energy = clamp(state.player.energy + 30);
      state.stats.rested++;
      event(
        state,
        "暂停一下，也是前进",
        "离开屏幕散了散步，精力恢复 30 点。",
        "success",
      );
      break;
    case "SCHEDULE": {
      const application = findApplication(state, action.applicationId);
      const job = findJob(state, application.jobId);
      requireRule(
        application.status === "scheduling" ||
          application.status === "scheduled",
        "当前投递还不能预约。",
      );
      requireRule(!job.closed, "企业已经暂停招聘。");
      requireRule(
        Number.isInteger(action.day) &&
          action.day >= state.day &&
          action.day <= Math.min(30, state.day + 5),
        "请选择未来 5 天内的有效日期。",
      );
      requireRule(action.slot === 0 || action.slot === 1, "请选择上午或下午。");
      requireRule(
        !state.applications.some(
          (a) =>
            a.id !== application.id &&
            a.status === "scheduled" &&
            a.scheduledDay === action.day &&
            a.slot === action.slot,
        ),
        "这个时间已经有一场面试，请换个时段。",
      );
      spend(state, ACTION_COSTS.schedule);
      application.status = "scheduled";
      application.scheduledDay = action.day;
      application.slot = action.slot;
      event(
        state,
        "面试已预约",
        `${job.name} · 第 ${action.day} 天${action.slot === 0 ? "上午" : "下午"}，第 ${application.round + 1} 轮面试。`,
      );
      break;
    }
    case "START_INTERVIEW": {
      const application = findApplication(state, action.applicationId);
      const job = findJob(state, application.jobId);
      requireRule(
        application.status === "scheduled" &&
          application.scheduledDay === state.day,
        "请在预约当天参加面试。",
      );
      requireRule(!job.closed, "企业已暂停招聘，这场面试无法开始。");
      spend(state, ACTION_COSTS.interview);
      const challenges = career.createInterview(
        job,
        application.round,
        state.seed,
      );
      requireRule(challenges.length > 0, "职业模块尚未提供面试内容。");
      state.activeInterview = {
        applicationId: application.id,
        jobId: job.id,
        practice: false,
        round: application.round,
        challenges,
        step: 0,
        draft: null,
        evaluations: [],
        expiresAt: action.now + challenges[0].timeLimit * 1000,
      };
      break;
    }
    case "START_PRACTICE": {
      spend(state, ACTION_COSTS.practice);
      const challenge = career.createPractice(action.kind, state.seed);
      state.lastPractice = null;
      state.activeInterview = {
        applicationId: null,
        jobId: state.jobs[0].id,
        practice: true,
        round: 0,
        challenges: [challenge],
        step: 0,
        draft: null,
        evaluations: [],
        expiresAt: action.now + challenge.timeLimit * 1000,
      };
      break;
    }
    case "DRAFT":
      requireRule(state.activeInterview, "当前没有进行中的面试。");
      state.activeInterview.draft = action.draft;
      break;
    case "SUBMIT_CHALLENGE": {
      const session = state.activeInterview;
      requireRule(session, "当前没有进行中的面试。");
      const challenge = session.challenges[session.step];
      const result = career.evaluateChallenge(challenge, action.answer, {
        job: findJob(state, session.jobId),
        player: state.player,
        skills: state.careers[state.careerId].skills,
        round: session.round,
      });
      if (action.now > session.expiresAt) {
        result.professional = Math.min(35, result.professional);
        result.feedback.push(
          "超过本题时限，专业得分上限为 35。提前提交方案也比留白更有价值。",
        );
      }
      session.evaluations.push(result);
      session.step++;
      session.draft = null;
      if (session.step >= session.challenges.length)
        finishInterview(state, career);
      else
        session.expiresAt =
          action.now + session.challenges[session.step].timeLimit * 1000;
      break;
    }
    case "ABANDON_INTERVIEW": {
      const session = state.activeInterview;
      requireRule(session, "当前没有进行中的面试。");
      if (session.applicationId) {
        const application = findApplication(state, session.applicationId);
        application.status = "withdrawn";
        application.feedback =
          "你主动结束了本次流程。把精力留给更适合的机会，也是有效策略。";
      }
      state.activeInterview = null;
      event(
        state,
        "已结束本次面试",
        "已消耗的准备时段不会退还，可以根据自己的节奏继续。",
      );
      break;
    }
    case "NEGOTIATE": {
      const offer = findOffer(state, action.offerId);
      const job = findJob(state, offer.jobId);
      requireRule(
        offer.negotiations < BALANCE.maxNegotiations,
        "薪资已沟通三轮，企业希望你做出最终决定。",
      );
      requireRule(
        Number.isFinite(action.salary) &&
          action.salary > offer.salary &&
          action.salary < 1000000,
        "期望月薪应高于当前报价，且小于一百万元。",
      );
      spend(state, ACTION_COSTS.negotiate);
      offer.negotiations++;
      const competing = state.offers.filter(
        (o) =>
          o.id !== offer.id &&
          (o.status === "pending" || o.status === "accepted"),
      ).length;
      const performance =
        findApplication(state, offer.applicationId).reports.at(-1)
          ?.willingness ?? 50;
      const ceiling =
        Math.round(
          (job.budget *
            Math.min(
              1,
              0.94 -
                (job.interviewer?.salarySensitivity ?? 50) / 2500 +
                performance / 2000 +
                competing * 0.02,
            )) /
            500,
        ) * 500;
      if (action.salary <= ceiling) {
        offer.salary = Math.round(action.salary / 100) * 100;
        offer.messages.push(
          `你提出 ¥${action.salary.toLocaleString("zh-CN")}/月。结合你的表现${competing ? "及其他 Offer" : ""}，我们同意这个薪资。`,
        );
        event(
          state,
          "谈薪成功",
          `${job.name}已将月薪调整为 ¥${offer.salary.toLocaleString("zh-CN")}。`,
          "success",
        );
      } else {
        offer.patience--;
        const counter = Math.max(offer.salary, ceiling);
        offer.salary = counter;
        offer.messages.push(
          `你提出 ¥${action.salary.toLocaleString("zh-CN")}/月，超出了本轮可批预算。我们能给到 ¥${counter.toLocaleString("zh-CN")}/月。${offer.patience === 0 ? "多次未能达成一致，我们只能撤回录用。" : `剩余沟通耐心 ${offer.patience}/3。`}`,
        );
        if (offer.patience <= 0) {
          offer.status = "withdrawn";
          findApplication(state, offer.applicationId).status = "withdrawn";
        }
        event(
          state,
          offer.patience > 0 ? "企业提出了还价" : "企业撤回 Offer",
          offer.messages.at(-1)!,
          "warning",
        );
      }
      break;
    }
    case "OFFER_ACTION": {
      const offer = findOffer(state, action.offerId);
      const job = findJob(state, offer.jobId);
      if (action.action === "accept") {
        requireRule(
          !state.offers.some((o) => o.status === "accepted"),
          "你已经接受了一份 Offer。请珍惜承诺，其他机会可以拒绝或保留至到期。",
        );
        offer.status = "accepted";
        job.openings = Math.max(0, job.openings - 1);
        findApplication(state, offer.applicationId).status = "accepted";
        event(
          state,
          "下一站，理想工作",
          `你接受了${job.name}的 Offer，约定 ${offer.startIn} 天后入职。可以继续完成本局或等待 30 天报告。`,
          "success",
        );
      } else if (action.action === "reject") {
        offer.status = "rejected";
        findApplication(state, offer.applicationId).status = "withdrawn";
        event(
          state,
          "已婉拒 Offer",
          `你选择不加入${job.name}。清楚自己的边界，也是一次有价值的决定。`,
        );
      } else if (action.action === "benefits") {
        requireRule(!offer.benefitsAsked, "福利信息已完整记录。");
        offer.benefitsAsked = true;
        offer.messages.push(
          `福利说明：${offer.benefits}。试用期 ${offer.probation} 个月，试用期薪资 100%。年终奖 ${offer.bonus} 个月为目标奖金，取决于绩效和经营情况。`,
        );
      } else {
        requireRule(
          [7, 14, 30].includes(action.startIn ?? 0),
          "入职时间支持 7、14 或 30 天后。",
        );
        requireRule(offer.startIn !== action.startIn, "当前已是这个入职时间。");
        spend(state, ACTION_COSTS.startDate);
        offer.startIn = action.startIn!;
        offer.messages.push(
          `已为你协调：接受 Offer 后 ${offer.startIn} 天入职。`,
        );
      }
      break;
    }
    case "WITHDRAW": {
      const application = findApplication(state, action.applicationId);
      requireRule(
        ["submitted", "scheduling", "scheduled"].includes(application.status),
        "当前流程已经结束。",
      );
      application.status = "withdrawn";
      application.feedback = "你主动放弃了这个机会，愿下一站更适合。";
      break;
    }
  }
  return state;
}

export function runSummary(state: GameState) {
  const valid = state.offers.filter(
    (o) => o.status === "pending" || o.status === "accepted",
  );
  const maxSalary = Math.max(0, ...valid.map((o) => o.salary * (12 + o.bonus)));
  const bestMatch = Math.max(
    0,
    ...valid.map((o) => jobMatch(state, findJob(state, o.jobId))),
  );
  const firstDay = state.offers.length
    ? Math.min(...state.offers.map((o) => o.createdDay))
    : null;
  const suitableOffers = state.offers.filter(
    (o) =>
      (state.applications.find((a) => a.id === o.applicationId)?.reports.at(-1)
        ?.match ?? jobMatch(state, findJob(state, o.jobId))) >= 60,
  );
  const suitableDay = suitableOffers.length
    ? Math.min(...suitableOffers.map((o) => o.createdDay))
    : null;
  const score =
    state.mode === "speed"
      ? suitableDay
        ? (31 - suitableDay) * 100
        : 0
      : state.mode === "salary"
        ? maxSalary
        : state.mode === "collector"
          ? valid.length * 100
          : state.mode === "fit"
            ? bestMatch * 100
            : Math.round(
                state.stats.offers * 250 +
                  state.stats.studied * 15 +
                  state.stats.interviews * 25 +
                  bestMatch * 5,
              );
  return {
    valid,
    maxSalary,
    bestMatch,
    firstDay,
    score,
    fingerprint: hashSeed(
      `${state.seed}:${state.player.name}:${state.player.background}:${state.mode}`,
    ),
  };
}
