import type { Action, CareerModule, GameState, Job } from "../core/types";

export type Page =
  | "dashboard"
  | "market"
  | "resume"
  | "calendar"
  | "learning"
  | "offers"
  | "report";
export interface GameProps {
  game: GameState;
  career: CareerModule;
  act: (action: Action) => boolean;
  navigate: (page: Page) => void;
  openJob: (job: Job) => void;
}
export const STATUS_LABELS = {
  submitted: "等待反馈",
  scheduling: "待预约",
  scheduled: "面试已预约",
  rejected: "流程结束",
  offer: "已获 Offer",
  accepted: "已接受",
  withdrawn: "已放弃",
  pending: "待回复",
  expired: "已过期",
};
