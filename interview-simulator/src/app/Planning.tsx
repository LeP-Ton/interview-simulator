import { useEffect, useState } from "react";
import { BACKGROUNDS } from "../core/config";
import { resumeStrength } from "../core/engine";
import type { Application, GameState } from "../core/types";
import {
  Badge,
  Empty,
  Icon,
  Modal,
  Progress,
  SectionTitle,
  money,
} from "../shared/ui";
import type { GameProps } from "./types";
import { STATUS_LABELS } from "./types";
import { CompanyLogo } from "./Workspace";

export function ResumeEditor({ game, career, act }: GameProps) {
  const [resume, setResume] = useState({ ...game.resume });
  const strength = resumeStrength(resume);
  const changed = JSON.stringify(resume) !== JSON.stringify(game.resume);
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">TELL YOUR STORY WELL</span>
          <h1>我的简历</h1>
          <p>经历不必完美，真实、有证据的故事更有力量。</p>
        </div>
        <button
          className="button primary"
          disabled={!changed || game.ended}
          onClick={() => act({ type: "RESUME", resume })}
        >
          <Icon name="save" size={16} />
          保存简历<span className="button-cost">1 时段 · 8 精力</span>
        </button>
      </div>
      <div className="resume-layout">
        <section className="panel resume-form">
          <div className="panel-heading">
            <h3>
              <Icon name="resume" size={18} />
              编辑我的经历
            </h3>
            {changed && <Badge tone="orange">未保存修改</Badge>}
          </div>
          <div className="form-section">
            <label htmlFor="resume-title">求职意向</label>
            <input
              id="resume-title"
              value={resume.title}
              maxLength={60}
              onChange={(e) => setResume({ ...resume, title: e.target.value })}
            />
            <label htmlFor="resume-summary">
              个人简介 <span>你是谁，擅长什么，想去哪里</span>
            </label>
            <textarea
              id="resume-summary"
              value={resume.summary}
              rows={5}
              maxLength={2000}
              onChange={(e) =>
                setResume({ ...resume, summary: e.target.value })
              }
            />
            <label htmlFor="resume-project">
              代表项目 <span>情境 → 任务 → 行动 → 结果</span>
            </label>
            <textarea
              id="resume-project"
              value={resume.project}
              rows={7}
              maxLength={4000}
              onChange={(e) =>
                setResume({ ...resume, project: e.target.value })
              }
            />
            <label htmlFor="resume-emphasis">专业侧重</label>
            <select
              id="resume-emphasis"
              value={resume.emphasis}
              onChange={(e) =>
                setResume({ ...resume, emphasis: e.target.value })
              }
            >
              {career.abilityModel.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} · {s.description}
                </option>
              ))}
            </select>
            <div className="tip-box">
              <Icon name="sparkles" size={18} />
              <p>
                “我做了什么”比“我们做了什么”更清楚；成果最好包含基线、指标和验证方式。简历质量会影响筛选与岗位匹配。
              </p>
            </div>
          </div>
        </section>
        <aside>
          <div className="resume-preview-label">
            <span>
              <Icon name="monitor" size={15} />
              实时预览
            </span>
            <Badge tone="green">{strength}% 完整度</Badge>
          </div>
          <div className="resume-paper">
            <div className="paper-top-line" />
            <h2>{game.player.name}</h2>
            <p className="paper-role">{resume.title || "你的求职意向"}</p>
            <div className="paper-contact">
              <span>{game.player.years} 年经验</span>
              <span>
                {BACKGROUNDS.find((b) => b.id === game.player.background)?.name}
              </span>
            </div>
            <h4>
              个人简介 <span>ABOUT ME</span>
            </h4>
            <p>{resume.summary || "写下你的故事……"}</p>
            <h4>
              代表项目 <span>SELECTED EXPERIENCE</span>
            </h4>
            <p>{resume.project || "分享一段真实的项目经历……"}</p>
            <h4>
              专业技能 <span>SKILLS</span>
            </h4>
            <div className="paper-skills">
              {career.abilityModel.map((s) => (
                <span
                  className={s.id === resume.emphasis ? "emphasis" : ""}
                  key={s.id}
                >
                  {s.label}
                  {s.id === resume.emphasis ? " · 重点" : ""}
                </span>
              ))}
            </div>
            <div className="paper-footer">
              {game.player.name} · 每一段经历，都有它的价值。
            </div>
          </div>
          <div className="resume-quality">
            <div>
              <strong>简历质量</strong>
              <span>{strength}/100</span>
            </div>
            <Progress value={strength} />
            <p>
              {strength < 70
                ? "加入更多项目细节、职责与量化结果，让企业更了解你。"
                : "结构清晰，已有具体成果。面试时记得准备支撑这些结论的细节。"}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
function ScheduleDialog({
  application,
  game,
  act,
  onClose,
}: {
  application: Application;
  game: GameState;
  act: GameProps["act"];
  onClose: () => void;
}) {
  const [day, setDay] = useState(
    Math.max(game.day, application.scheduledDay ?? game.day),
  );
  const [slot, setSlot] = useState(application.slot);
  const job = game.jobs.find((j) => j.id === application.jobId)!;
  return (
    <Modal
      title={`预约${job.name}面试`}
      subtitle={`第 ${application.round + 1} 轮 · 需要预留 2 个行动时段和 22 点精力`}
      onClose={onClose}
    >
      <div className="schedule-form">
        <label>
          选择日期
          <select value={day} onChange={(e) => setDay(+e.target.value)}>
            {Array.from({ length: Math.min(6, 31 - game.day) }, (_, i) => (
              <option key={i} value={game.day + i}>
                第 {game.day + i} 天{!i ? " · 今天" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          选择时段
          <select value={slot} onChange={(e) => setSlot(+e.target.value)}>
            <option value={0}>上午 10:00</option>
            <option value={1}>下午 14:00</option>
          </select>
        </label>
        <div className="info-note">
          <Icon name="info" size={18} />
          <span>
            预约消耗 1 时段、3
            精力。面试需在预约当天手动参加；跨过该日会被记为缺席。
          </span>
        </div>
        <button
          className="button primary full-width"
          onClick={() => {
            if (
              act({
                type: "SCHEDULE",
                applicationId: application.id,
                day,
                slot,
              })
            )
              onClose();
          }}
        >
          确认预约
          <Icon name="check" size={16} />
        </button>
      </div>
    </Modal>
  );
}
export function Calendar({ game, career, act, openJob }: GameProps) {
  const [selectedDay, setSelectedDay] = useState(game.day);
  useEffect(() => setSelectedDay(game.day), [game.day]);
  const [scheduling, setScheduling] = useState<string | null>(null);
  const invitations = game.applications.filter(
    (a) => a.status === "scheduling",
  );
  const scheduled = game.applications.filter(
    (a) => a.status === "scheduled" && a.scheduledDay === selectedDay,
  );
  const scheduleApplication = game.applications.find(
    (a) => a.id === scheduling,
  );
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">MAKE ROOM FOR WHAT MATTERS</span>
          <h1>求职日历</h1>
          <p>准备要留时间，机会也要按时赴约。</p>
        </div>
        <Badge tone="green">
          第 {game.day} 天 · 今日剩余 {game.slots} 时段
        </Badge>
      </div>
      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <div className="panel-heading">
            <h3>我的 30 天求职计划</h3>
            <span className="small muted">每个时段约 2 小时</span>
          </div>
          <div className="calendar-weekdays">
            {["周三", "周四", "周五", "周六", "周日", "周一", "周二"].map(
              (d) => (
                <span key={d}>{d}</span>
              ),
            )}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i + 1;
              const appointments = game.applications.filter(
                (a) => a.status === "scheduled" && a.scheduledDay === day,
              );
              return day <= 30 ? (
                <button
                  key={day}
                  className={`${day === game.day ? "today" : ""} ${day === selectedDay ? "selected" : ""} ${day < game.day ? "past" : ""}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span>
                    {String(day).padStart(2, "0")}
                    {day === game.day && <small>今天</small>}
                  </span>
                  {appointments.slice(0, 2).map((a) => (
                    <em key={a.id}>
                      {game.jobs.find((j) => j.id === a.jobId)?.name}
                    </em>
                  ))}
                  {day === 30 && (
                    <span className="calendar-finish">
                      <Icon name="trophy" size={13} />
                      结算日
                    </span>
                  )}
                </button>
              ) : (
                <div key={day} className="calendar-blank" />
              );
            })}
          </div>
          <div className="calendar-legend">
            <span>
              <i className="green-dot" />
              今天
            </span>
            <span>
              <i className="sage-dot" />
              预约面试
            </span>
            <span>预约未来 5 天内的时间，避免撞期</span>
          </div>
        </section>
        <aside className="panel selected-day-panel">
          <div className="panel-heading">
            <h3>第 {selectedDay} 天</h3>
            <Icon name="calendar" size={18} />
          </div>
          {scheduled.length ? (
            scheduled.map((a) => {
              const job = game.jobs.find((j) => j.id === a.jobId)!;
              return (
                <div className="agenda-card" key={a.id}>
                  <Badge tone="green">
                    {a.slot === 0 ? "10:00 上午" : "14:00 下午"}
                  </Badge>
                  <h3>{job.name}</h3>
                  <p>
                    {job.role} · 第 {a.round + 1} 轮
                  </p>
                  <small>
                    {career
                      .createInterview(job, a.round, game.seed)
                      .map((c) => c.title)
                      .join(" + ")}
                  </small>
                  <div className="agenda-actions">
                    {selectedDay === game.day ? (
                      <button
                        className="button primary full-width"
                        disabled={game.ended}
                        onClick={() =>
                          act({
                            type: "START_INTERVIEW",
                            applicationId: a.id,
                            now: Date.now(),
                          })
                        }
                      >
                        <Icon name="video" size={16} />
                        进入面试
                      </button>
                    ) : (
                      <button
                        className="button secondary full-width"
                        disabled={game.ended}
                        onClick={() => setScheduling(a.id)}
                      >
                        调整预约
                      </button>
                    )}
                    <button
                      className="text-button"
                      disabled={game.ended}
                      onClick={() =>
                        act({ type: "WITHDRAW", applicationId: a.id })
                      }
                    >
                      放弃本次流程
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty
              icon="coffee"
              title="留一点从容"
              text={
                selectedDay < game.day
                  ? "这一天已经过去，新的机会在前方。"
                  : "这一天暂时没有面试，可以安排学习、调查或投递。"
              }
            />
          )}
        </aside>
      </div>
      <section className="spaced">
        <SectionTitle title="等待你的回复" eyebrow="INTERVIEW INVITATIONS">
          <Badge>{invitations.length} 份邀请</Badge>
        </SectionTitle>
        {!invitations.length ? (
          <div className="invitation-empty">
            <Icon name="inbox" size={24} />
            <span>暂时没有待预约邀请。简历投递后，通常在第二天收到反馈。</span>
          </div>
        ) : (
          <div className="invitation-list">
            {invitations.map((a) => {
              const job = game.jobs.find((j) => j.id === a.jobId)!;
              return (
                <div className="invitation-card" key={a.id}>
                  <CompanyLogo job={job} />
                  <div>
                    <strong>{job.name}邀请你继续交流</strong>
                    <p>
                      {job.role} · 第 {a.round + 1} 轮面试
                    </p>
                  </div>
                  <button
                    className="button primary small-button"
                    disabled={game.ended || job.closed}
                    onClick={() => setScheduling(a.id)}
                  >
                    {job.closed ? "招聘已暂停" : "预约时间"}
                    <Icon name="arrow" size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <section className="spaced">
        <SectionTitle title="我的投递记录" />
        {!game.applications.length ? (
          <div className="invitation-empty">
            <Icon name="send" size={22} />
            <span>还没有投递记录。先去招聘市场，遇见你的第一个机会。</span>
          </div>
        ) : (
          <div className="applications-table">
            <div className="application-table-head">
              <span>企业与岗位</span>
              <span>投递日期</span>
              <span>当前进展</span>
              <span>反馈</span>
            </div>
            {game.applications.map((a) => {
              const job = game.jobs.find((j) => j.id === a.jobId)!;
              return (
                <button
                  className="application-row"
                  key={a.id}
                  onClick={() => openJob(job)}
                >
                  <span>
                    <strong>{job.name}</strong>
                    <small>{job.role}</small>
                  </span>
                  <span>第 {a.appliedDay} 天</span>
                  <span>
                    <Badge
                      tone={
                        ["scheduling", "offer", "accepted"].includes(a.status)
                          ? "green"
                          : "neutral"
                      }
                    >
                      {STATUS_LABELS[a.status]}
                    </Badge>
                  </span>
                  <span>
                    {a.feedback}
                    <Icon name="chevron" size={16} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
      {scheduleApplication && (
        <ScheduleDialog
          application={scheduleApplication}
          game={game}
          act={act}
          onClose={() => setScheduling(null)}
        />
      )}
    </>
  );
}
export function Learning({ game, career, act }: GameProps) {
  const skills = game.careers[game.careerId].skills;
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">GROW AT YOUR OWN PACE</span>
          <h1>成长空间</h1>
          <p>不用一夜成为高手，每一次练习都是积累。</p>
        </div>
        <Badge tone="green">
          <Icon name="star" size={13} />
          已完成 {game.stats.studied} 次学习
        </Badge>
      </div>
      <SectionTitle title="打磨你的专业能力" />
      <div className="skill-grid">
        {career.abilityModel.map((s, i) => (
          <section className="skill-card" key={s.id}>
            <div>
              <span
                className={`resource-icon ${["sage", "blue", "orange", "purple"][i % 4]}`}
              >
                <Icon
                  name={career.practiceChallenges[i]?.icon ?? career.icon}
                  size={22}
                />
              </span>
              <h3>{s.label}</h3>
              <strong>
                {skills[s.id]}
                <small>/100</small>
              </strong>
            </div>
            <p>{s.description}</p>
            <Progress value={skills[s.id]} />
            <footer>
              <span>1 时段 · 15 精力 · {money(80)}</span>
              <button
                className="text-button"
                disabled={game.ended || skills[s.id] === 100}
                onClick={() => act({ type: "STUDY", skill: s.id })}
              >
                开始学习
                <Icon name="plus" size={15} />
              </button>
            </footer>
          </section>
        ))}
      </div>
      <section className="spaced">
        <SectionTitle title="面试训练场" eyebrow="PRACTICE MAKES PROGRESS">
          <span className="small muted">
            1 时段 · 10 精力 · 每次训练 +3 面试经验
          </span>
        </SectionTitle>
        <div className="practice-grid">
          {career.practiceChallenges.map((c, i) => (
            <button
              disabled={game.ended}
              className="practice-card"
              key={c.kind}
              onClick={() =>
                act({ type: "START_PRACTICE", kind: c.kind, now: Date.now() })
              }
            >
              <span className="practice-number">0{i + 1}</span>
              <Icon name={c.icon} size={28} />
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <span className="practice-cta">
                进入练习
                <Icon name="up" size={17} />
              </span>
            </button>
          ))}
        </div>
      </section>
      {game.lastPractice && (
        <section className="practice-feedback spaced">
          <div>
            <Badge tone="green">最近一次训练报告</Badge>
            <h3>专业表现 {game.lastPractice.professional} / 100</h3>
          </div>
          <div>
            {game.lastPractice.feedback.map((feedback, i) => (
              <p key={i}>
                <Icon name="check" size={15} />
                {feedback}
              </p>
            ))}
          </div>
        </section>
      )}
      <div className="other-actions spaced">
        {[
          {
            icon: "chat",
            title: "练习表达",
            desc: "STAR 叙事与沟通训练，沟通 +4，经验 +2。",
            cost: "1 时段 · 12 精力 · ¥40",
            action: "MOCK" as const,
            button: "模拟表达",
          },
          {
            icon: "users",
            title: "去一场招聘会",
            desc: "认识团队、了解真实问题，沟通 +3。",
            cost: "2 时段 · 18 精力 · ¥150",
            action: "FAIR" as const,
            button: "参加招聘会",
          },
          {
            icon: "coffee",
            title: "给自己充个电",
            desc: "暂时放下压力，散步休息，恢复 30 精力。",
            cost: "1 时段 · 免费",
            action: "REST" as const,
            button: "休息一下",
          },
        ].map((item) => (
          <section key={item.action}>
            <Icon name={item.icon} size={24} />
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
            <small>{item.cost}</small>
            <button
              className="button secondary"
              disabled={
                game.ended ||
                (item.action === "REST" && game.player.energy === 100)
              }
              onClick={() => act({ type: item.action })}
            >
              {item.button}
              <Icon name="arrow" size={15} />
            </button>
          </section>
        ))}
      </div>
    </>
  );
}
