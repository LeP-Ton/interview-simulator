import type { Challenge } from "../../core/types";
import { hashSeed } from "../../core/random";

export const STRATEGIES = [
  { id: "star", name: "STAR 叙事", note: "用情境、任务、行动、结果组织经历" },
  { id: "clarify", name: "澄清问题", note: "先确认边界和约束，适合复杂问题" },
  { id: "outcome", name: "成果优先", note: "突出业务结果，适合创业团队" },
  { id: "reverse", name: "反向提问", note: "了解团队，但需要先正面回答" },
  { id: "honest", name: "诚实说明", note: "承认不足，并提出补齐方案" },
  { id: "evidence", name: "数据论证", note: "以测量、指标和验证支撑结论" },
];
export const TECHNICAL_QUESTIONS = [
  {
    question:
      "一个 React 页面打开很慢，你会如何定位瓶颈并优化？请结合项目经历说明。",
    concepts: [
      "测量|监控|profil|performance|指标|耗时",
      "缓存|cache|memo",
      "懒加载|分包|拆包|按需|lazy",
      "渲染|render|重绘|虚拟",
      "网络|请求|资源|压缩|CDN",
    ],
    deeper: "如果加上缓存后仍然卡顿，你会如何区分网络、计算和渲染瓶颈？",
    clarification: "你提到“优化性能”，具体测量什么指标？如何确认优化有效？",
    remedy: "假设你没有相关经验，第一步会如何建立可以验证的排查计划？",
  },
  {
    question:
      "高并发接口偶尔返回过期数据。你会如何分析缓存与数据库的一致性问题？",
    concepts: [
      "缓存|cache|redis",
      "一致|更新|失效|删除",
      "并发|锁|事务|原子",
      "监控|日志|追踪|指标",
      "过期|TTL|重试|消息|队列",
    ],
    deeper: "数据库更新成功而缓存删除失败，你如何保证最终一致性？",
    clarification: "请说明具体的更新顺序，以及失败时可能发生什么。",
    remedy: "如果还没有处理过这个问题，你会如何构造复现案例和验证假设？",
  },
];
export function createChallenge(kind: string, seed: string): Challenge {
  const index = hashSeed(seed) % TECHNICAL_QUESTIONS.length;
  switch (kind) {
    case "technical":
      return {
        id: `technical-${index}`,
        kind,
        title: "技术问答",
        brief: "让真实经验，成为你的底气。",
        timeLimit: 600,
        data: { ...TECHNICAL_QUESTIONS[index] },
      };
    case "algorithm":
      return {
        id: "algorithm-two-sum",
        kind,
        title: "算法挑战",
        brief: "在约束中找到清晰、高效的解法。",
        timeLimit: 480,
        data: {
          question: "两数之和",
          description:
            "给定整数数组 nums 和整数 target，返回两个不同元素的下标，使它们之和等于 target。恰好有一个解，不能重复使用同一元素。",
          starter:
            "function solve(nums, target) {\n  const seen = new Map();\n\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    // 检查是否已找到另一个数\n\n    // 记录当前值和下标\n  }\n  return [];\n}",
          examples: "[2, 7, 11, 15], target = 9 → [0, 1]",
          constraints: "2 ≤ nums.length ≤ 10⁴；支持负数与重复值",
        },
      };
    case "debug":
      return {
        id: "debug-cart",
        kind,
        title: "Debug 挑战",
        brief: "复现问题，找到原因，再验证修复。",
        timeLimit: 480,
        data: {
          question: "修复购物车金额计算",
          description:
            "线上用户反馈购物车金额不正确，空购物车还会抛错。请修复 3 个独立问题，确保函数始终返回 number。",
          starter:
            "type Item = { price: number; quantity: number };\n\nfunction total(items: Item[]): number {\n  let sum = 0;\n  for (let i = 0; i <= items.length; i++) {\n    sum += items[i].price;\n  }\n  return sum.toFixed(2);\n}",
          incident:
            "TypeError: Cannot read properties of undefined (reading 'price')\n  at total (cart.ts:6:21)\n  at Checkout.render (checkout.ts:42:9)",
        },
      };
    case "system":
      return {
        id: "system-notification",
        kind,
        title: "系统设计",
        brief: "好的架构，是约束下的恰好够用。",
        timeLimit: 600,
        data: {
          question: "设计一个高峰通知服务",
          description:
            "为一款协作产品设计通知服务：日常 1,000 QPS，高峰 10,000 QPS。通知不能丢失，接口需快速响应，单节点故障时仍可用。",
          budget: 24,
          target: "可用性 99.9% · 接口响应 < 200ms · 持久化存储",
          requirements: [
            "接入与流量保护",
            "持久化与可靠投递",
            "异步削峰",
            "多实例容灾",
            "成本可控",
            "可观测性",
          ],
        },
      };
    default:
      throw new Error(`未知的程序员挑战：${kind}`);
  }
}
export const ARCHITECTURE_COMPONENTS = [
  {
    id: "gateway",
    name: "API 网关",
    description: "请求入口、鉴权与路由",
    cost: 2,
    icon: "network",
  },
  {
    id: "database",
    name: "关系数据库",
    description: "通知与投递状态持久化",
    cost: 5,
    icon: "database",
  },
  {
    id: "queue",
    name: "消息队列",
    description: "异步投递，削峰与重试",
    cost: 4,
    icon: "layers",
  },
  {
    id: "cache",
    name: "Redis 缓存",
    description: "读缓存与幂等键",
    cost: 3,
    icon: "zap",
  },
  {
    id: "limiter",
    name: "请求限流",
    description: "限制突发请求，保护下游",
    cost: 2,
    icon: "shield",
  },
  {
    id: "monitor",
    name: "监控告警",
    description: "延迟、积压与错误率追踪",
    cost: 2,
    icon: "activity",
  },
  {
    id: "cdn",
    name: "CDN",
    description: "缓存静态内容，通知链路收益低",
    cost: 3,
    icon: "globe",
  },
  {
    id: "search",
    name: "搜索集群",
    description: "全文检索，本场景并非必需",
    cost: 6,
    icon: "search",
  },
];
