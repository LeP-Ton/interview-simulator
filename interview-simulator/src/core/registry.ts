import type { CareerModule } from "./types";

export function createCareerRegistry(modules: CareerModule[]) {
  const registry = new Map<string, CareerModule>();
  for (const module of modules) {
    if (!module.id || registry.has(module.id))
      throw new Error("职业 ID 为空或重复");
    if (!module.jobs.length || !module.abilityModel.length)
      throw new Error("职业必须定义能力模型与岗位");
    if (
      !Number.isInteger(module.interviewRounds) ||
      module.interviewRounds < 1 ||
      module.interviewRounds > 5
    )
      throw new Error("职业面试轮数应为 1 至 5");
    registry.set(module.id, module);
  }
  return {
    all: () => [...registry.values()],
    get: (id: string) => {
      const module = registry.get(id);
      if (!module) throw new Error(`未安装职业：${id}`);
      return module;
    },
  };
}
