import { useState } from "react";
import { BACKGROUNDS, MODES } from "../core/config";
import type { BackgroundId, CareerModule, Mode } from "../core/types";
import { Badge, Brand, DeskIllustration, Icon, money } from "../shared/ui";

export function Onboarding({
  careers,
  onStart,
  onResume,
  hasSave,
}: {
  careers: CareerModule[];
  onStart: (
    input: { name: string; background: BackgroundId; seed: string; mode: Mode },
    career: CareerModule,
  ) => void;
  onResume: () => void;
  hasSave: boolean;
}) {
  const [name, setName] = useState("林小满");
  const [background, setBackground] = useState<BackgroundId>("experienced");
  const [seed, setSeed] = useState("NEXT-CHAPTER");
  const [mode, setMode] = useState<Mode>("free");
  const [careerId, setCareerId] = useState(careers[0].id);
  const selected = BACKGROUNDS.find((b) => b.id === background)!;
  return (
    <div className="onboarding">
      <div className="welcome-panel">
        <Brand />
        <div className="welcome-copy">
          <div className="welcome-eyebrow">
            <span />
            一场关于可能性的 30 天冒险
          </div>
          <h1>
            下一站，
            <br />
            你的<span>理想工作。</span>
          </h1>
          <p>
            打磨简历，迎战面试，谈下心动的 Offer。
            <br />
            在一次次选择里，找到自己的职业答案。
          </p>
          <div className="welcome-tags">
            <span>
              <Icon name="target" size={15} />
              策略求职
            </span>
            <span>
              <Icon name="code" size={15} />
              真实练习
            </span>
            <span>
              <Icon name="refresh" size={15} />
              重复挑战
            </span>
          </div>
        </div>
        <div className="welcome-desk">
          <DeskIllustration />
          <div className="welcome-quote">
            “每一份认真，都在为下一次机会铺路。”
          </div>
        </div>
        <div className="welcome-footer">
          <span>GAMEX ORIGINAL</span>
          <span>BUILD YOUR NEXT CHAPTER ↗</span>
        </div>
      </div>
      <div className="setup-panel">
        <div className="setup-heading">
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h2>准备好，开启新旅程</h2>
          <p>没有标准答案，适合你的才是好工作。</p>
          {hasSave && (
            <button className="text-button resume-journey" onClick={onResume}>
              <Icon name="left" size={16} />
              返回当前存档
            </button>
          )}
        </div>
        <div className="setup-section">
          <div className="setup-label">
            <span>01</span>
            <h3>选择你的职业</h3>
            <Badge tone="green">首发职业</Badge>
          </div>
          <div className="career-options">
            {careers.map((c) => (
              <button
                key={c.id}
                className={`career-choice ${careerId === c.id ? "selected" : ""}`}
                onClick={() => setCareerId(c.id)}
              >
                <span className="career-icon">
                  <Icon name={c.icon} size={24} />
                </span>
                <span>
                  <strong>{c.name}</strong>
                  <small>
                    {c.practiceChallenges.map((p) => p.name).join(" · ")}
                  </small>
                </span>
                <span className="radio-dot" />
              </button>
            ))}
            <div className="future-careers">
              <span>
                <Icon name="lock" size={13} />
                产品经理
              </span>
              <span>
                <Icon name="lock" size={13} />
                设计师
              </span>
              <span>
                <Icon name="lock" size={13} />
                数据分析师
              </span>
              <small>更多职业，正在路上</small>
            </div>
          </div>
        </div>
        <div className="setup-section">
          <div className="setup-label">
            <span>02</span>
            <h3>每个人都有自己的起点</h3>
          </div>
          <div className="background-grid">
            {BACKGROUNDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBackground(b.id)}
                className={`background-choice ${background === b.id ? "selected" : ""}`}
              >
                <strong>{b.name}</strong>
                <small>{b.badge}</small>
                {background === b.id && <Icon name="success" size={17} />}
              </button>
            ))}
          </div>
          <div className="background-summary">
            <Icon name="info" size={16} />
            <span>{selected.description}</span>
            <b>资金 {money(selected.money)}</b>
          </div>
        </div>
        <div className="setup-section last">
          <div className="setup-label">
            <span>03</span>
            <h3>为这段旅程命名</h3>
          </div>
          <div className="setup-fields">
            <label>
              你的名字
              <input
                value={name}
                maxLength={16}
                onChange={(e) => setName(e.target.value)}
                placeholder="怎么称呼你？"
              />
            </label>
            <label>
              挑战模式
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
              >
                {MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="seed-field">
              市场种子 <span>相同种子，相同起点</span>
              <div>
                <input
                  value={seed}
                  maxLength={64}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="输入种子，重复挑战"
                />
                <button
                  title="生成随机种子"
                  aria-label="生成随机种子"
                  onClick={() => {
                    const value = crypto.getRandomValues(new Uint32Array(1))[0];
                    setSeed(`NEXT-${value.toString(36).toUpperCase()}`);
                  }}
                >
                  <Icon name="refresh" size={16} />
                </button>
              </div>
            </label>
          </div>
        </div>
        <div className="setup-start">
          <div>
            <span>
              <Icon name="save" size={14} />
              自动保存 · 随时继续
            </span>
            <small>
              {hasSave
                ? "开始新旅程会替换当前自动存档，手动存档保留。"
                : "30 天，有限的资源，无限的可能。"}
            </small>
          </div>
          <button
            className="button primary start-button"
            disabled={!name.trim()}
            onClick={() =>
              onStart(
                { name, background, seed, mode },
                careers.find((c) => c.id === careerId)!,
              )
            }
          >
            开启求职之旅
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
