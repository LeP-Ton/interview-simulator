import type { ComponentType } from "react";

export type Mode = "free" | "speed" | "salary" | "collector" | "fit";
export type BackgroundId =
  | "graduate"
  | "experienced"
  | "bigtech"
  | "switcher"
  | "senior"
  | "unemployed";
export type Personality = "gentle" | "technical" | "pressure" | "founder";
export interface Background {
  id: BackgroundId;
  name: string;
  description: string;
  years: number;
  money: number;
  skill: number;
  communication: number;
  learning: number;
  expected: number;
  badge: string;
}
export interface Player {
  name: string;
  background: BackgroundId;
  years: number;
  money: number;
  energy: number;
  communication: number;
  experience: number;
  expectedSalary: number;
}
export interface Resume {
  title: string;
  summary: string;
  project: string;
  emphasis: string;
  strength: number;
}
export interface Competitor {
  id: string;
  name: string;
  years: number;
  ability: number;
  progress: number;
  expectedSalary: number;
  pedigree: string;
  state: "active" | "hired" | "left";
}
export interface CompanyTemplate {
  id: string;
  name: string;
  english: string;
  mark: string;
  color: string;
  industry: string;
  size: string;
  culture: string;
  intensity: string;
  benefit: string;
  problem: string;
  preference: string;
}
export interface Job extends CompanyTemplate {
  role: string;
  level: string;
  careerId: string;
  minSalary: number;
  maxSalary: number;
  budget: number;
  requiredSkill: number;
  focusSkill?: string;
  minYears: number;
  openings: number;
  competition: number;
  risk: number;
  research: number;
  discovered: boolean;
  closed: boolean;
  personality: Personality;
  interviewer?: InterviewerTraits;
  competitors: Competitor[];
  skillTags: string[];
}
export interface InterviewerTraits {
  professionalPreference: number;
  collaborationPreference: number;
  stabilityPreference: number;
  pressurePreference: number;
  salarySensitivity: number;
  followupTendency: number;
}
export interface JobDefinition {
  title: string;
  level: string;
  minYears: number;
  skill: number;
  focusSkill?: string;
  minSalary: number;
  maxSalary: number;
  tags: string[];
}
export interface Challenge {
  id: string;
  kind: string;
  title: string;
  brief: string;
  timeLimit: number;
  data: Record<string, unknown>;
}
export interface Evaluation {
  professional: number;
  expression: number;
  logic: number;
  evidence: number;
  integrity: number;
  specialized: Record<string, number>;
  feedback: string[];
}
export interface InterviewReport extends Evaluation {
  day: number;
  round: number;
  objectiveAbility: number;
  match: number;
  impression: number;
  willingness: number;
  competitorScore: number;
  passed: boolean;
  reason: string;
}
export type ApplicationStatus =
  | "submitted"
  | "scheduling"
  | "scheduled"
  | "rejected"
  | "offer"
  | "accepted"
  | "withdrawn";
export interface Application {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  appliedDay: number;
  responseDay: number;
  round: number;
  scheduledDay: number | null;
  slot: number;
  reports: InterviewReport[];
  feedback: string;
}
export interface Offer {
  id: string;
  applicationId: string;
  jobId: string;
  salary: number;
  bonus: number;
  probation: number;
  benefits: string;
  startIn: number;
  level: string;
  expiresDay: number;
  createdDay: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn" | "expired";
  negotiations: number;
  patience: number;
  benefitsAsked: boolean;
  messages: string[];
}
export interface InterviewSession {
  applicationId: string | null;
  jobId: string;
  practice: boolean;
  round: number;
  challenges: Challenge[];
  step: number;
  draft: unknown;
  evaluations: Evaluation[];
  expiresAt: number;
}
export interface GameEvent {
  id: number;
  day: number;
  kind: "info" | "success" | "warning";
  title: string;
  text: string;
}
export interface GameState {
  version: 1;
  seed: string;
  rng: number;
  careerId: string;
  mode: Mode;
  day: number;
  slots: number;
  ended: boolean;
  player: Player;
  resume: Resume;
  careers: Record<
    string,
    { skills: Record<string, number>; practiceCount: number }
  >;
  jobs: Job[];
  applications: Application[];
  offers: Offer[];
  events: GameEvent[];
  activeInterview: InterviewSession | null;
  lastPractice: Evaluation | null;
  stats: {
    studied: number;
    researched: number;
    rested: number;
    applications: number;
    interviews: number;
    offers: number;
    spent: number;
  };
}
export interface ChallengeContext {
  job: Job;
  player: Player;
  skills: Record<string, number>;
  round: number;
}
export interface ChallengePanelProps {
  challenge: Challenge;
  draft: unknown;
  onChange: (draft: unknown) => void;
  onSubmit: (answer: unknown) => void;
  context: ChallengeContext;
  remaining: number;
}
export interface CareerModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  interviewRounds: number;
  createResume?: (background: Background) => Omit<Resume, "strength">;
  abilityModel: { id: string; label: string; description: string }[];
  practiceChallenges: {
    kind: string;
    name: string;
    description: string;
    icon: string;
  }[];
  jobs: JobDefinition[];
  initialSkills: (background: Background) => Record<string, number>;
  createInterview: (job: Job, round: number, seed: string) => Challenge[];
  createPractice: (kind: string, seed: string) => Challenge;
  ChallengePanel: ComponentType<ChallengePanelProps>;
  validateSession?: (session: InterviewSession) => boolean;
  evaluateChallenge: (
    challenge: Challenge,
    answer: unknown,
    context: ChallengeContext,
  ) => Evaluation;
  review: (evaluations: Evaluation[]) => string[];
}
export interface InterviewAIAdapter {
  analyzeAnswer: (
    question: string,
    answer: string,
  ) => Promise<{ evidence: string[]; followup: string; feedback: string }>;
}
export type Action =
  | { type: "NEXT_DAY" }
  | { type: "SEARCH" }
  | { type: "RESEARCH"; jobId: string }
  | { type: "RESUME"; resume: Omit<Resume, "strength"> }
  | { type: "APPLY"; jobId: string }
  | { type: "STUDY"; skill: string }
  | { type: "MOCK" }
  | { type: "FAIR" }
  | { type: "REST" }
  | { type: "SCHEDULE"; applicationId: string; day: number; slot: number }
  | { type: "START_INTERVIEW"; applicationId: string; now: number }
  | { type: "START_PRACTICE"; kind: string; now: number }
  | { type: "DRAFT"; draft: unknown }
  | { type: "SUBMIT_CHALLENGE"; answer: unknown; now: number }
  | { type: "ABANDON_INTERVIEW" }
  | { type: "NEGOTIATE"; offerId: string; salary: number }
  | {
      type: "OFFER_ACTION";
      offerId: string;
      action: "accept" | "reject" | "benefits" | "date";
      startIn?: number;
    }
  | { type: "WITHDRAW"; applicationId: string };
