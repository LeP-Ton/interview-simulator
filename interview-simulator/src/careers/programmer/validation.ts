import type { InterviewSession } from "../../core/types";
import { ARCHITECTURE_COMPONENTS, createChallenge } from "./content";

export function validateProgrammerSession(session: InterviewSession): boolean {
  for (const challenge of session.challenges) {
    let expected;
    try {
      expected = createChallenge(challenge.kind, "validation");
    } catch {
      return false;
    }
    for (const [key, value] of Object.entries(expected.data)) {
      const actual = challenge.data[key];
      if (
        Array.isArray(value)
          ? !Array.isArray(actual) ||
            !actual.every((v) => typeof v === "string")
          : typeof actual !== typeof value
      )
        return false;
    }
  }
  if (session.draft === null) return true;
  if (typeof session.draft !== "object" || Array.isArray(session.draft))
    return false;
  const draft = session.draft as Record<string, unknown>;
  const kind = session.challenges[session.step].kind;
  if (kind === "technical")
    return (
      ["text", "strategy", "followup", "probe"].every(
        (k) => typeof draft[k] === "string",
      ) && typeof draft.asked === "boolean"
    );
  if (kind === "algorithm" || kind === "debug")
    return (
      typeof draft.code === "string" && typeof draft.explanation === "string"
    );
  if (kind === "system")
    return (
      Array.isArray(draft.components) &&
      draft.components.every((id) =>
        ARCHITECTURE_COMPONENTS.some((c) => c.id === id),
      ) &&
      typeof draft.notes === "string" &&
      typeof draft.replicas === "number" &&
      Number.isInteger(draft.replicas) &&
      draft.replicas >= 1 &&
      draft.replicas <= 5
    );
  return false;
}
