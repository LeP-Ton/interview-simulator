import type { CareerModule } from "../../core/types";
import { clamp } from "../../core/random";
import { createChallenge } from "./content";
import { evaluateChallenge } from "./evaluation";
import { ProgrammerChallengePanel } from "./ChallengePanel";
import { validateProgrammerSession } from "./validation";

export const programmer: CareerModule = {
  id: "programmer",
  name: "程序员",
  description: "用代码解决问题，让每一次思考变成更好的产品。",
  icon: "code",
  interviewRounds: 2,
  createResume: (background) => ({
    title:
      background.years >= 4
        ? "高级全栈工程师"
        : background.years === 0
          ? "初级开发工程师"
          : "前端开发工程师",
    summary: `拥有${background.years}年相关经验，关注用户体验与工程质量。希望在开放协作的团队中持续成长。`,
    project:
      "负责协作平台核心模块的设计与开发，优化加载流程，将页面响应时间降低 35%，并为关键路径补充自动化验证。",
    emphasis: "knowledge",
  }),
  abilityModel: [
    {
      id: "knowledge",
      label: "技术知识",
      description: "语言、框架、计算机基础",
    },
    {
      id: "algorithm",
      label: "算法能力",
      description: "数据结构、复杂度与边界",
    },
    {
      id: "debug",
      label: "Debug 能力",
      description: "定位根因、修复与回归验证",
    },
    {
      id: "design",
      label: "系统设计",
      description: "约束、架构、容量与可靠性",
    },
  ],
  practiceChallenges: [
    {
      kind: "technical",
      name: "技术问答",
      description: "组织真实经历，练习应对连续追问。",
      icon: "chat",
    },
    {
      kind: "algorithm",
      name: "算法挑战",
      description: "在代码编辑器中完善解法与复杂度。",
      icon: "code",
    },
    {
      kind: "debug",
      name: "Debug 挑战",
      description: "分析故障、修复代码并验证边界。",
      icon: "debug",
    },
    {
      kind: "system",
      name: "系统设计",
      description: "组装架构，在约束中做出取舍。",
      icon: "system",
    },
  ],
  jobs: [
    {
      title: "初级开发工程师",
      level: "P4",
      minYears: 0,
      skill: 40,
      focusSkill: "knowledge",
      minSalary: 10000,
      maxSalary: 16000,
      tags: ["JavaScript", "React", "成长空间"],
    },
    {
      title: "前端开发工程师",
      level: "P5",
      minYears: 2,
      skill: 58,
      focusSkill: "knowledge",
      minSalary: 18000,
      maxSalary: 28000,
      tags: ["TypeScript", "React", "工程化"],
    },
    {
      title: "高级全栈工程师",
      level: "P6",
      minYears: 4,
      skill: 72,
      focusSkill: "debug",
      minSalary: 26000,
      maxSalary: 38000,
      tags: ["Node.js", "系统设计", "技术深度"],
    },
    {
      title: "资深技术工程师",
      level: "P7",
      minYears: 7,
      skill: 82,
      focusSkill: "design",
      minSalary: 35000,
      maxSalary: 50000,
      tags: ["架构设计", "技术领导力", "高并发"],
    },
  ],
  initialSkills: (background) => ({
    knowledge: clamp(background.skill + 3),
    algorithm: clamp(background.skill - 5),
    debug: clamp(background.skill + (background.years > 2 ? 4 : -3)),
    design: clamp(background.skill + (background.years > 4 ? 7 : -8)),
  }),
  createInterview: (job, round, seed) =>
    (round === 0 ? ["technical", "algorithm"] : ["debug", "system"]).map(
      (kind) => createChallenge(kind, `${seed}:${job.id}:${round}`),
    ),
  createPractice: createChallenge,
  ChallengePanel: ProgrammerChallengePanel,
  validateSession: validateProgrammerSession,
  evaluateChallenge,
  review: (evaluations) => evaluations.flatMap((e) => e.feedback).slice(0, 4),
};
