import { useState } from "react";
import type { ChallengePanelProps } from "../../core/types";
import { Icon, Badge, Progress } from "../../shared/ui";
import { ARCHITECTURE_COMPONENTS, STRATEGIES } from "./content";
import {
  algorithmChecks,
  analyzeTechnical,
  debugChecks,
  systemChecks,
  type CodeAnswer,
  type SystemAnswer,
  type TechnicalAnswer,
} from "./evaluation";

function CodeEditor({
  value,
  onChange,
  filename,
}: {
  value: string;
  onChange: (value: string) => void;
  filename: string;
}) {
  return (
    <div className="code-editor">
      <div className="editor-tab">
        <Icon name="debug" size={15} />
        {filename}
        <span>TypeScript / JavaScript</span>
      </div>
      <div className="editor-body">
        <div className="line-numbers" aria-hidden="true">
          {value.split("\n").map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          aria-label={`${filename} 代码编辑器`}
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              const editor = e.currentTarget;
              const start = editor.selectionStart;
              const end = editor.selectionEnd;
              onChange(`${value.slice(0, start)}  ${value.slice(end)}`);
              requestAnimationFrame(() => {
                editor.setSelectionRange(start + 2, start + 2);
              });
            }
          }}
        />
      </div>
    </div>
  );
}
function Checks({
  checks,
}: {
  checks: { name: string; passed: boolean; detail: string }[];
}) {
  return (
    <div className="test-results">
      {checks.map((c) => (
        <div className={c.passed ? "passed" : "failed"} key={c.name}>
          <Icon name={c.passed ? "success" : "info"} size={16} />
          <div>
            <strong>{c.name}</strong>
            <small>{c.detail}</small>
          </div>
          <span>{c.passed ? "通过" : "待完善"}</span>
        </div>
      ))}
    </div>
  );
}
function TechnicalPanel({
  challenge,
  draft: raw,
  onChange,
  onSubmit,
  context,
}: ChallengePanelProps) {
  const draft = {
    text: "",
    strategy: "star",
    followup: "",
    asked: false,
    probe: "",
    ...(raw as Partial<TechnicalAnswer> | null),
  };
  const probe = analyzeTechnical(
    challenge,
    draft.text,
    context.job.personality,
    context.job.interviewer?.followupTendency,
  );
  return (
    <div className="technical-panel">
      <div className="question-card">
        <Badge tone="green">开放式回答</Badge>
        <h2>{String(challenge.data.question)}</h2>
        <p>结合你的经历，讲清楚你做了什么、为什么这样做，以及如何验证结果。</p>
      </div>
      <label className="field-label">
        选择你的沟通策略 <span>不同面试官有不同偏好</span>
      </label>
      <div className="strategy-grid">
        {STRATEGIES.map((s) => (
          <button
            key={s.id}
            className={`strategy ${draft.strategy === s.id ? "selected" : ""}`}
            title={s.note}
            onClick={() => onChange({ ...draft, strategy: s.id })}
          >
            <Icon
              name={
                s.id === "star"
                  ? "star"
                  : s.id === "evidence"
                    ? "report"
                    : s.id === "honest"
                      ? "heart"
                      : s.id === "clarify"
                        ? "help"
                        : s.id === "outcome"
                          ? "target"
                          : "chat"
              }
              size={17}
            />
            {s.name}
          </button>
        ))}
      </div>
      <p className="strategy-note">
        {STRATEGIES.find((s) => s.id === draft.strategy)?.note}
      </p>
      <label className="field-label" htmlFor="technical-answer">
        你的回答
      </label>
      <textarea
        id="technical-answer"
        className="answer-input"
        value={draft.text}
        maxLength={4000}
        disabled={draft.asked}
        onChange={(e) => onChange({ ...draft, text: e.target.value })}
        placeholder="例如：在之前的协作项目中，我负责……先通过……定位瓶颈，再……最终将……降低了……"
        rows={6}
      />
      {!draft.asked ? (
        <div className="challenge-actions">
          <span className="muted small">
            规则化模拟：根据概念、结构和证据生成追问
          </span>
          <button
            className="button primary"
            disabled={draft.text.trim().length < 10}
            onClick={() =>
              onChange({ ...draft, asked: true, probe: probe.question })
            }
          >
            提交回答，接受追问
            <Icon name="arrow" size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="followup">
            <span className="mini-avatar">
              {context.job.personality === "gentle"
                ? "林"
                : context.job.personality === "founder"
                  ? "许"
                  : context.job.personality === "pressure"
                    ? "周"
                    : "陈"}
            </span>
            <div>
              <small>面试官继续追问</small>
              <p>{draft.probe}</p>
            </div>
          </div>
          <label className="field-label" htmlFor="followup-answer">
            进一步说明
          </label>
          <textarea
            id="followup-answer"
            className="answer-input"
            value={draft.followup}
            maxLength={3000}
            onChange={(e) => onChange({ ...draft, followup: e.target.value })}
            rows={4}
            placeholder="具体说明你的验证方法、取舍，以及失败时的补救方案……"
          />
          <div className="challenge-actions">
            <span className="small muted">
              承认能力边界并提出计划，也是一种专业表现。
            </span>
            <button
              className="button primary"
              disabled={draft.followup.trim().length < 10}
              onClick={() => onSubmit(draft)}
            >
              完成技术问答
              <Icon name="check" size={17} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
function AlgorithmPanel({
  challenge,
  draft: raw,
  onChange,
  onSubmit,
}: ChallengePanelProps) {
  const draft = {
    code: String(challenge.data.starter),
    explanation: "",
    complexity: "O(n)",
    hint: false,
    ...(raw as Partial<CodeAnswer> | null),
  };
  const [checks, setChecks] = useState<ReturnType<
    typeof algorithmChecks
  > | null>(null);
  return (
    <div>
      <div className="challenge-columns">
        <div className="problem-pane">
          <Badge tone="green">算法 · 简单</Badge>
          <h2>{String(challenge.data.question)}</h2>
          <p>{String(challenge.data.description)}</p>
          <h4>示例</h4>
          <pre className="example-code">{String(challenge.data.examples)}</pre>
          <h4>约束条件</h4>
          <p>{String(challenge.data.constraints)}</p>
          <div className="info-note">
            <Icon name="shield" size={17} />
            <span>
              受限解法检查：支持标准 Map
              单遍历与双循环写法，不执行任意代码。检查结果用于玩法评分。
            </span>
          </div>
          <button
            className="text-button"
            onClick={() => onChange({ ...draft, hint: true })}
          >
            <Icon name="help" size={15} />
            查看思路提示（得分 −8）
          </button>
          {draft.hint && (
            <div className="tip-box">
              先计算 need = target - nums[i]。用 seen.has(need)
              查找已出现的数，找到后返回 [seen.get(need), i]；否则
              seen.set(nums[i], i)。先查找，再记录。
            </div>
          )}
        </div>
        <div className="code-pane">
          <CodeEditor
            value={draft.code}
            onChange={(code) => {
              onChange({ ...draft, code });
              setChecks(null);
            }}
            filename="solution.js"
          />
          <div className="editor-controls">
            <span className="small muted">支持标准下标 i、nums、target</span>
            <button
              className="button secondary small-button"
              onClick={() => setChecks(algorithmChecks(draft.code))}
            >
              <Icon name="code" size={15} />
              检查解法
            </button>
          </div>
          {checks && <Checks checks={checks} />}
        </div>
      </div>
      <div className="answer-footer">
        <label className="field-label" htmlFor="algorithm-notes">
          解释你的思路与复杂度
        </label>
        <div className="inline-field">
          <textarea
            id="algorithm-notes"
            className="answer-input"
            rows={2}
            value={draft.explanation}
            maxLength={2000}
            placeholder="为什么这样做？如何避免重复使用同一个元素？"
            onChange={(e) =>
              onChange({ ...draft, explanation: e.target.value })
            }
          />
          <label className="complexity-label">
            时间复杂度
            <select
              value={draft.complexity}
              onChange={(e) =>
                onChange({ ...draft, complexity: e.target.value })
              }
            >
              <option>O(n)</option>
              <option>O(n²)</option>
              <option>O(n log n)</option>
            </select>
          </label>
        </div>
        <div className="challenge-actions">
          <span className="small muted">清晰的思路与正确的边界同样重要。</span>
          <button
            className="button primary"
            disabled={draft.code.trim().length < 20}
            onClick={() => onSubmit(draft)}
          >
            提交算法方案
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
function DebugPanel({
  challenge,
  draft: raw,
  onChange,
  onSubmit,
}: ChallengePanelProps) {
  const draft = {
    code: String(challenge.data.starter),
    explanation: "",
    ...(raw as Partial<CodeAnswer> | null),
  };
  const [checks, setChecks] = useState<ReturnType<typeof debugChecks> | null>(
    null,
  );
  return (
    <div>
      <div className="incident-title">
        <Badge tone="orange">线上故障 · 3 个问题</Badge>
        <h2>{String(challenge.data.question)}</h2>
        <p>{String(challenge.data.description)}</p>
      </div>
      <div className="debug-workspace">
        <aside className="debug-files">
          <span className="eyebrow">项目文件</span>
          <div>
            <Icon name="folder" size={16} />
            src / checkout
          </div>
          <div className="active">
            <Icon name="debug" size={16} />
            cart.ts
          </div>
          <div>
            <Icon name="code" size={16} />
            checkout.ts
          </div>
          <div className="debug-hint">
            <Icon name="help" size={18} />
            <p>不要只修复报错。检查数量、空数组和返回类型。</p>
          </div>
        </aside>
        <CodeEditor
          filename="cart.ts"
          value={draft.code}
          onChange={(code) => {
            onChange({ ...draft, code });
            setChecks(null);
          }}
        />
      </div>
      <div className="incident-log">
        <div>
          <Icon name="activity" size={16} />
          <strong>错误日志</strong>
          <Badge tone="orange">生产环境</Badge>
        </div>
        <pre>{String(challenge.data.incident)}</pre>
      </div>
      <div className="editor-controls">
        <span className="small muted">
          按已支持的修复结构检查：循环边界、单项金额、数值返回。
        </span>
        <button
          className="button secondary small-button"
          onClick={() => setChecks(debugChecks(draft.code))}
        >
          <Icon name="refresh" size={15} />
          检查修复
        </button>
      </div>
      {checks && <Checks checks={checks} />}
      <label className="field-label" htmlFor="debug-notes">
        根因与验证说明
      </label>
      <textarea
        id="debug-notes"
        rows={3}
        maxLength={2000}
        className="answer-input"
        placeholder="说明这三个问题为什么发生，以及你会用哪些边界用例验证……"
        value={draft.explanation}
        onChange={(e) => onChange({ ...draft, explanation: e.target.value })}
      />
      <div className="challenge-actions">
        <span className="small muted">真正的修复，包含对问题的理解。</span>
        <button className="button primary" onClick={() => onSubmit(draft)}>
          提交修复
          <Icon name="check" size={16} />
        </button>
      </div>
    </div>
  );
}
function SystemPanel({
  challenge,
  draft: raw,
  onChange,
  onSubmit,
}: ChallengePanelProps) {
  const draft = {
    components: [],
    replicas: 1,
    notes: "",
    ...(raw as Partial<SystemAnswer> | null),
  } as SystemAnswer;
  const [checked, setChecked] = useState(false);
  const evaluation = systemChecks(draft);
  const toggle = (id: string) => {
    onChange({
      ...draft,
      components: draft.components.includes(id)
        ? draft.components.filter((c) => c !== id)
        : [...draft.components, id],
    });
    setChecked(false);
  };
  return (
    <div>
      <div className="incident-title">
        <Badge tone="blue">架构实验室</Badge>
        <h2>{String(challenge.data.question)}</h2>
        <p>{String(challenge.data.description)}</p>
        <div className="requirement-strip">
          <span>
            <Icon name="target" size={15} />
            {String(challenge.data.target)}
          </span>
          <span className={evaluation.cost > 24 ? "danger-text" : ""}>
            预算 <strong>{evaluation.cost}/24</strong>
          </span>
        </div>
      </div>
      <div className="architecture-workspace">
        <aside className="component-palette">
          <h4>
            组件库 <span>点击添加 / 移除</span>
          </h4>
          {ARCHITECTURE_COMPONENTS.map((c) => (
            <button
              key={c.id}
              className={draft.components.includes(c.id) ? "selected" : ""}
              onClick={() => toggle(c.id)}
            >
              <Icon name={c.icon} size={19} />
              <span>
                <strong>{c.name}</strong>
                <small>{c.description}</small>
              </span>
              <b>{draft.components.includes(c.id) ? "✓" : `+${c.cost}`}</b>
            </button>
          ))}
        </aside>
        <div className="architecture-canvas">
          <span className="canvas-label">你的通知服务架构</span>
          <div className="architecture-client">
            <Icon name="users" size={20} />
            客户端请求 <span>10,000 QPS</span>
          </div>
          <div className="architecture-connector" />
          <div className="architecture-service">
            <Icon name="code" size={21} />
            <span>
              通知服务<strong>{draft.replicas} 个实例</strong>
            </span>
          </div>
          <div className="architecture-connector" />
          <div className="architecture-nodes">
            {draft.components.map((id) => {
              const c = ARCHITECTURE_COMPONENTS.find((x) => x.id === id)!;
              return (
                <button key={id} onClick={() => toggle(id)} title="点击移除">
                  <Icon name={c.icon} size={20} />
                  <span>{c.name}</span>
                  <Icon name="close" size={12} />
                </button>
              );
            })}
            {!draft.components.length && (
              <div className="architecture-placeholder">
                <Icon name="plus" size={23} />
                <p>从左侧组件库构建你的方案</p>
                <small>选择需要的能力，留意预算和失败场景</small>
              </div>
            )}
          </div>
          <div className="replica-control">
            <label htmlFor="replicas">
              服务实例数 <b>{draft.replicas}</b>
            </label>
            <input
              id="replicas"
              type="range"
              min={1}
              max={5}
              value={draft.replicas}
              onChange={(e) => {
                onChange({ ...draft, replicas: +e.target.value });
                setChecked(false);
              }}
            />
            <small>每实例成本 2 单位，增加实例可提升容错能力。</small>
            <Progress
              value={(evaluation.cost / 24) * 100}
              tone={evaluation.cost > 24 ? "orange" : "green"}
            />
          </div>
        </div>
      </div>
      <div className="editor-controls">
        <span className="small muted">
          组件组合具有取舍，添加更多并不总是更好。
        </span>
        <button
          className="button secondary small-button"
          onClick={() => setChecked(true)}
        >
          <Icon name="shield" size={15} />
          验证架构约束
        </button>
      </div>
      {checked && <Checks checks={evaluation.checks} />}
      <label htmlFor="system-notes" className="field-label">
        解释数据流、失败处理与设计取舍
      </label>
      <textarea
        id="system-notes"
        className="answer-input"
        rows={3}
        maxLength={2500}
        value={draft.notes}
        onChange={(e) => onChange({ ...draft, notes: e.target.value })}
        placeholder="请求如何流转？如何保证幂等、处理重试？为什么这套方案适合当前业务与成本约束？"
      />
      <div className="challenge-actions">
        <span className="small muted">
          清楚地说明“为什么”，也是架构能力的一部分。
        </span>
        <button
          className="button primary"
          disabled={!draft.components.length}
          onClick={() => onSubmit(draft)}
        >
          提交系统设计
          <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  );
}
const panels = {
  technical: TechnicalPanel,
  algorithm: AlgorithmPanel,
  debug: DebugPanel,
  system: SystemPanel,
};
export function ProgrammerChallengePanel(props: ChallengePanelProps) {
  const Panel = panels[props.challenge.kind as keyof typeof panels];
  return Panel ? (
    <Panel {...props} />
  ) : (
    <p>这个挑战尚未安装，请检查职业模块版本。</p>
  );
}
