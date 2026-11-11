import { clamp } from "./random";
import type { Evaluation, InterviewerTraits, Personality } from "./types";

const PREFERENCES: Record<Personality, number[]> = {
  gentle: [45, 90, 85, 35, 50, 40],
  technical: [95, 45, 50, 65, 40, 85],
  pressure: [65, 45, 65, 95, 65, 95],
  founder: [65, 70, 75, 65, 90, 70],
};
export function generateInterviewer(
  personality: Personality,
  draw: () => number,
): InterviewerTraits {
  const values = PREFERENCES[personality].map((value) =>
    clamp(value + draw() * 16 - 8, 10, 100),
  );
  return {
    professionalPreference: values[0],
    collaborationPreference: values[1],
    stabilityPreference: values[2],
    pressurePreference: values[3],
    salarySensitivity: values[4],
    followupTendency: values[5],
  };
}
export function interviewerImpression(
  evaluation: Evaluation,
  personality: Personality,
  traits?: InterviewerTraits,
): number {
  const profile = traits ?? generateInterviewer(personality, () => 0.5);
  // 采用归一化权重，避免某类人格的总权重更大而天然给出高印象分。
  const weights = [
    profile.professionalPreference,
    profile.collaborationPreference * 0.65,
    profile.pressurePreference * 0.75,
    personality === "founder" ? 95 : 55,
    profile.stabilityPreference * 0.25,
  ];
  const values = [
    evaluation.professional,
    evaluation.expression,
    evaluation.logic,
    evaluation.evidence,
    evaluation.integrity,
  ];
  return clamp(
    values.reduce((sum, value, i) => sum + value * weights[i], 0) /
      weights.reduce((sum, value) => sum + value, 0),
  );
}
