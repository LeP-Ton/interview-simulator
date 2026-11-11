import { BALANCE } from "./config";
import { runSummary } from "./engine";
import type { GameState } from "./types";

export const SAVE_KEYS = {
  auto: "interview-simulator:v1:auto",
  manual: "interview-simulator:v1:manual",
  leaderboard: "interview-simulator:v1:records",
} as const;
type StorageLike = Pick<Storage, "getItem" | "setItem">;
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const validScore = (value: unknown) =>
  finite(value) && value >= 0 && value <= 100;
function validEvaluation(value: unknown): boolean {
  return (
    record(value) &&
    ["professional", "expression", "logic", "evidence", "integrity"].every(
      (key) => validScore(value[key]),
    ) &&
    record(value.specialized) &&
    Object.values(value.specialized).every(validScore) &&
    Array.isArray(value.feedback) &&
    value.feedback.every((t) => typeof t === "string")
  );
}
export function parseSave(text: string): GameState {
  if (text.length > 2_000_000) throw new Error("存档文件过大");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("存档不是有效的 JSON 文件");
  }
  if (!record(data) || data.version !== 1)
    throw new Error("不支持的存档版本，请使用 V1 存档");
  if (
    typeof data.seed !== "string" ||
    !data.seed ||
    data.seed.length > 64 ||
    typeof data.careerId !== "string" ||
    !Number.isInteger(data.rng) ||
    !finite(data.day) ||
    data.day < 1 ||
    data.day > 30 ||
    !Number.isInteger(data.day) ||
    !finite(data.slots) ||
    data.slots < 0 ||
    data.slots > BALANCE.slots ||
    !Number.isInteger(data.slots) ||
    typeof data.ended !== "boolean" ||
    !["free", "speed", "salary", "collector", "fit"].includes(String(data.mode))
  )
    throw new Error("存档的时间、职业或随机种子数据无效");
  if (
    !record(data.player) ||
    typeof data.player.name !== "string" ||
    ![
      "graduate",
      "experienced",
      "bigtech",
      "switcher",
      "senior",
      "unemployed",
    ].includes(String(data.player.background)) ||
    !finite(data.player.money) ||
    data.player.money < 0 ||
    !finite(data.player.years) ||
    !finite(data.player.expectedSalary) ||
    !["energy", "communication", "experience"].every((key) =>
      validScore((data.player as Record<string, unknown>)[key]),
    )
  )
    throw new Error("存档的求职者数据损坏");
  if (
    !record(data.resume) ||
    !["title", "summary", "project", "emphasis"].every(
      (key) =>
        typeof (data.resume as Record<string, unknown>)[key] === "string",
    ) ||
    !validScore(data.resume.strength)
  )
    throw new Error("存档的简历数据损坏");
  if (!record(data.careers) || !record(data.careers[data.careerId]))
    throw new Error("存档缺少职业命名空间");
  const namespace = data.careers[data.careerId] as Record<string, unknown>;
  if (
    !record(namespace.skills) ||
    !Object.keys(namespace.skills).length ||
    !Object.values(namespace.skills).every(validScore) ||
    !finite(namespace.practiceCount)
  )
    throw new Error("存档的职业能力数据损坏");
  if (
    !Array.isArray(data.jobs) ||
    data.jobs.length === 0 ||
    data.jobs.length > 100 ||
    !data.jobs.every(
      (job) =>
        record(job) &&
        [
          "id",
          "name",
          "english",
          "mark",
          "color",
          "industry",
          "size",
          "culture",
          "intensity",
          "benefit",
          "problem",
          "preference",
          "role",
          "level",
          "careerId",
        ].every((k) => typeof job[k] === "string") &&
        [
          "minSalary",
          "maxSalary",
          "budget",
          "requiredSkill",
          "minYears",
          "openings",
          "competition",
          "risk",
          "research",
        ].every((k) => finite(job[k])) &&
        ["gentle", "technical", "pressure", "founder"].includes(
          String(job.personality),
        ) &&
        (job.interviewer === undefined ||
          (record(job.interviewer) &&
            [
              "professionalPreference",
              "collaborationPreference",
              "stabilityPreference",
              "pressurePreference",
              "salarySensitivity",
              "followupTendency",
            ].every((key) =>
              validScore((job.interviewer as Record<string, unknown>)[key]),
            ))) &&
        typeof job.closed === "boolean" &&
        typeof job.discovered === "boolean" &&
        Array.isArray(job.skillTags) &&
        job.skillTags.every((t) => typeof t === "string") &&
        Array.isArray(job.competitors) &&
        job.competitors.every(
          (c) =>
            record(c) &&
            typeof c.name === "string" &&
            finite(c.ability) &&
            finite(c.progress) &&
            finite(c.years) &&
            finite(c.expectedSalary) &&
            ["active", "hired", "left"].includes(String(c.state)),
        ),
    )
  )
    throw new Error("存档的招聘市场数据损坏");
  const jobIds = new Set(
    data.jobs.map((job) => (job as Record<string, unknown>).id),
  );
  if (
    !Array.isArray(data.applications) ||
    !data.applications.every(
      (a) =>
        record(a) &&
        typeof a.id === "string" &&
        jobIds.has(a.jobId) &&
        [
          "submitted",
          "scheduling",
          "scheduled",
          "rejected",
          "offer",
          "accepted",
          "withdrawn",
        ].includes(String(a.status)) &&
        finite(a.round) &&
        finite(a.appliedDay) &&
        finite(a.responseDay) &&
        (a.scheduledDay === null || finite(a.scheduledDay)) &&
        finite(a.slot) &&
        typeof a.feedback === "string" &&
        Array.isArray(a.reports) &&
        a.reports.every(
          (r) =>
            validEvaluation(r) &&
            record(r) &&
            [
              "day",
              "round",
              "objectiveAbility",
              "match",
              "impression",
              "willingness",
              "competitorScore",
            ].every((k) => finite(r[k])) &&
            typeof r.passed === "boolean" &&
            typeof r.reason === "string",
        ),
    )
  )
    throw new Error("存档的投递数据损坏");
  const appIds = new Set(
    data.applications.map((a) => (a as Record<string, unknown>).id),
  );
  if (
    !Array.isArray(data.offers) ||
    !data.offers.every(
      (o) =>
        record(o) &&
        typeof o.id === "string" &&
        appIds.has(o.applicationId) &&
        jobIds.has(o.jobId) &&
        [
          "salary",
          "bonus",
          "probation",
          "startIn",
          "expiresDay",
          "createdDay",
          "negotiations",
          "patience",
        ].every((k) => finite(o[k])) &&
        typeof o.benefits === "string" &&
        typeof o.level === "string" &&
        typeof o.benefitsAsked === "boolean" &&
        ["pending", "accepted", "rejected", "withdrawn", "expired"].includes(
          String(o.status),
        ) &&
        Array.isArray(o.messages) &&
        o.messages.every((m) => typeof m === "string"),
    )
  )
    throw new Error("存档的 Offer 数据损坏");
  if (
    !Array.isArray(data.events) ||
    !data.events.every(
      (e) =>
        record(e) &&
        finite(e.id) &&
        finite(e.day) &&
        typeof e.title === "string" &&
        typeof e.text === "string" &&
        ["info", "success", "warning"].includes(String(e.kind)),
    ) ||
    !record(data.stats) ||
    ![
      "studied",
      "researched",
      "rested",
      "applications",
      "interviews",
      "offers",
      "spent",
    ].every((k) => finite((data.stats as Record<string, unknown>)[k]))
  )
    throw new Error("存档的记录数据损坏");
  if (data.lastPractice !== null && !validEvaluation(data.lastPractice))
    throw new Error("训练报告损坏");
  if (data.activeInterview !== null) {
    const s = data.activeInterview;
    if (
      !record(s) ||
      !jobIds.has(s.jobId) ||
      !(s.applicationId === null || appIds.has(s.applicationId)) ||
      typeof s.practice !== "boolean" ||
      !finite(s.round) ||
      !finite(s.expiresAt) ||
      !finite(s.step) ||
      !Number.isInteger(s.step) ||
      !Array.isArray(s.challenges) ||
      s.step < 0 ||
      s.step >= s.challenges.length ||
      !Array.isArray(s.evaluations) ||
      !s.evaluations.every(validEvaluation) ||
      !s.challenges.every(
        (c) =>
          record(c) &&
          typeof c.id === "string" &&
          typeof c.kind === "string" &&
          typeof c.title === "string" &&
          typeof c.brief === "string" &&
          finite(c.timeLimit) &&
          record(c.data),
      )
    )
      throw new Error("存档的面试进度损坏");
  }
  return data as unknown as GameState;
}
export function saveGame(
  storage: StorageLike,
  state: GameState,
  slot: "auto" | "manual" = "auto",
) {
  storage.setItem(SAVE_KEYS[slot], JSON.stringify(state));
}
export function loadGame(
  storage: StorageLike,
  slot: "auto" | "manual" = "auto",
): GameState | null {
  const text = storage.getItem(SAVE_KEYS[slot]);
  return text ? parseSave(text) : null;
}
export interface LocalRecord {
  id: string;
  seed: string;
  mode: string;
  background: string;
  name: string;
  score: number;
  salary: number;
  offers: number;
}
export function readRecords(storage: StorageLike): LocalRecord[] {
  try {
    const records: unknown = JSON.parse(
      storage.getItem(SAVE_KEYS.leaderboard) ?? "[]",
    );
    return Array.isArray(records)
      ? (records
          .filter(
            (r) =>
              record(r) &&
              typeof r.id === "string" &&
              typeof r.seed === "string" &&
              typeof r.mode === "string" &&
              typeof r.background === "string" &&
              typeof r.name === "string" &&
              finite(r.score) &&
              finite(r.salary) &&
              finite(r.offers),
          )
          .slice(0, 40) as LocalRecord[])
      : [];
  } catch {
    return [];
  }
}
export function recordRun(storage: StorageLike, state: GameState) {
  if (!state.ended) return;
  const summary = runSummary(state);
  const id = `${summary.fingerprint}`;
  const records = readRecords(storage);
  const previous = records.find((r) => r.id === id);
  if (previous && previous.score >= summary.score) return;
  storage.setItem(
    SAVE_KEYS.leaderboard,
    JSON.stringify(
      [
        ...records.filter((r) => r.id !== id),
        {
          id,
          seed: state.seed,
          mode: state.mode,
          background: state.player.background,
          name: state.player.name,
          score: summary.score,
          salary: summary.maxSalary,
          offers: state.stats.offers,
        },
      ]
        .sort((a, b) => b.score - a.score)
        .slice(0, 40),
    ),
  );
}
