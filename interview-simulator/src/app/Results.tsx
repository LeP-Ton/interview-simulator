import { useEffect, useState } from "react";
import { BACKGROUNDS, MODES, PERSONALITIES } from "../core/config";
import { jobMatch, runSummary } from "../core/engine";
import { readRecords, recordRun, type LocalRecord } from "../core/save";
import type { InterviewReport, Offer } from "../core/types";
import type { GameProps } from "./types";
import { STATUS_LABELS } from "./types";
import {
  Badge,
  Empty,
  Icon,
  Modal,
  Progress,
  SectionTitle,
  money,
} from "../shared/ui";
import { CompanyLogo } from "./Workspace";

function NegotiationPanel({ offer, ...props }: GameProps & { offer: Offer }) {
  const { game, act } = props;
  const job = game.jobs.find((j) => j.id === offer.jobId)!;
  const [amount, setAmount] = useState(String(offer.salary + 2000));
  const [startIn, setStartIn] = useState(offer.startIn);
  useEffect(() => setAmount(String(offer.salary + 1000)), [offer.salary]);
  return (
    <section className="offer-detail">
      <div className="offer-letter">
        <div className="offer-letter-heading">
          <CompanyLogo job={job} large />
          <span className="offer-stamp">
            OFFER
            <br />
            LETTER
          </span>
        </div>
        <span className="eyebrow">我们期待与你并肩</span>
        <h2>
          嗨，{game.player.name}，<br />
          欢迎加入{job.name}。
        </h2>
        <p>我们欣赏你的思考与潜力，希望这会是一次彼此成就的开始。</p>
        <div className="offer-salary">
          <strong>
            {money(offer.salary)}
            <small>/ 月</small>
          </strong>
          <Badge tone="green">
            {offer.level} · {job.role}
          </Badge>
        </div>
        <div className="offer-terms">
          <div>
            <span>基本年薪</span>
            <strong>{money(offer.salary * 12)}</strong>
          </div>
          <div>
            <span>目标奖金</span>
            <strong>
              {offer.bonus} 个月 <small>随绩效浮动</small>
            </strong>
          </div>
          <div>
            <span>试用期</span>
            <strong>{offer.probation} 个月 · 全薪</strong>
          </div>
          <div>
            <span>入职时间</span>
            <strong>接受后 {offer.startIn} 天</strong>
          </div>
          <div className="terms-wide">
            <span>福利与关怀</span>
            <strong>
              {offer.benefitsAsked
                ? offer.benefits
                : "欢迎询问，我们愿意详细介绍。"}
            </strong>
          </div>
        </div>
        <div className="offer-deadline">
          <Icon name="clock" size={16} />
          {offer.status === "pending"
            ? `请在第 ${offer.expiresDay} 天结束前回复 · 还有 ${offer.expiresDay - game.day + 1} 天`
            : `当前状态：${STATUS_LABELS[offer.status]}`}
        </div>
      </div>
      <div className="negotiation-area">
        <SectionTitle title="把期待，聊清楚" />
        <div className="negotiation-messages">
          {offer.messages.map((message, i) => (
            <div key={i}>
              <span className="mini-avatar">HR</span>
              <p>{message}</p>
            </div>
          ))}
        </div>
        {offer.status === "pending" && !game.ended && (
          <>
            <div className="negotiation-controls">
              <label htmlFor="salary-request">
                期望月薪{" "}
                <span>
                  第 {offer.negotiations + 1 > 3 ? 3 : offer.negotiations + 1}/3
                  轮沟通
                </span>
              </label>
              <div className="salary-request">
                <span>¥</span>
                <input
                  id="salary-request"
                  type="number"
                  step={500}
                  min={offer.salary + 1}
                  max={999999}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button
                  className="button primary"
                  disabled={
                    offer.negotiations >= 3 ||
                    !Number.isFinite(+amount) ||
                    +amount <= offer.salary
                  }
                  onClick={() =>
                    act({
                      type: "NEGOTIATE",
                      offerId: offer.id,
                      salary: +amount,
                    })
                  }
                >
                  提出期望
                  <Icon name="send" size={15} />
                </button>
              </div>
              <p className="small muted">
                1 时段 · 5 精力。薪资依据企业预算、面试表现和其他有效
                Offer；持续超预算可能被撤回。
              </p>
              <div className="patience">
                <span>沟通耐心</span>
                {Array.from({ length: 3 }, (_, i) => (
                  <Icon
                    name="heart"
                    key={i}
                    size={16}
                    className={i < offer.patience ? "heart-filled" : ""}
                  />
                ))}
              </div>
              <div className="offer-extra-actions">
                <button
                  className="button secondary"
                  disabled={offer.benefitsAsked}
                  onClick={() =>
                    act({
                      type: "OFFER_ACTION",
                      offerId: offer.id,
                      action: "benefits",
                    })
                  }
                >
                  <Icon name="help" size={16} />
                  {offer.benefitsAsked ? "福利已了解" : "了解福利"}
                </button>
                <label>
                  入职时间
                  <select
                    aria-label="协商入职时间"
                    value={startIn}
                    onChange={(e) => setStartIn(+e.target.value)}
                  >
                    <option value={7}>7 天后</option>
                    <option value={14}>14 天后</option>
                    <option value={30}>30 天后</option>
                  </select>
                </label>
                <button
                  className="text-button"
                  disabled={startIn === offer.startIn}
                  onClick={() =>
                    act({
                      type: "OFFER_ACTION",
                      offerId: offer.id,
                      action: "date",
                      startIn,
                    })
                  }
                >
                  协商时间
                </button>
              </div>
            </div>
            <div className="offer-decision">
              <button
                className="button secondary"
                onClick={() =>
                  act({
                    type: "OFFER_ACTION",
                    offerId: offer.id,
                    action: "reject",
                  })
                }
              >
                婉拒 Offer
              </button>
              <button
                className="button primary"
                disabled={game.offers.some((o) => o.status === "accepted")}
                onClick={() =>
                  act({
                    type: "OFFER_ACTION",
                    offerId: offer.id,
                    action: "accept",
                  })
                }
              >
                <Icon name="check" size={17} />
                接受这份 Offer
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
export function Offers(props: GameProps) {
  const { game, career, navigate } = props;
  const [selected, setSelected] = useState<string | null>(null);
  const selectedOffer =
    game.offers.find((o) => o.id === selected) ??
    game.offers.find((o) => o.status === "pending") ??
    game.offers.at(-1);
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">YOU HAVE SOMETHING TO LOOK FORWARD TO</span>
          <h1>
            Offer 收件箱<Badge tone="green">{game.offers.length} 份心意</Badge>
          </h1>
          <p>别只看薪资，选一份值得投入时间的工作。</p>
        </div>
        <Icon name="offers" size={32} />
      </div>
      {!game.offers.length ? (
        <div className="panel offer-empty">
          <Empty
            icon="offers"
            title="好消息，正在路上"
            text={`通过 ${career.interviewRounds} 轮专业面试后，企业会给出正式 Offer。准备好自己的期待，再和未来的团队聊一聊。`}
          >
            <button
              className="button primary"
              onClick={() => navigate("market")}
            >
              寻找我的第一个机会
              <Icon name="arrow" size={16} />
            </button>
          </Empty>
          <div className="offer-empty-steps">
            <span>
              <Icon name="send" size={17} />
              投递简历
            </span>
            <Icon name="chevron" size={15} />
            <span>
              <Icon name="video" size={17} />
              {career.interviewRounds} 轮面试
            </span>
            <Icon name="chevron" size={15} />
            <span>
              <Icon name="chat" size={17} />
              薪资沟通
            </span>
            <Icon name="chevron" size={15} />
            <span>
              <Icon name="heart" size={17} />
              双向选择
            </span>
          </div>
        </div>
      ) : (
        <div className="offers-layout">
          <aside className="offer-list">
            {[...game.offers].reverse().map((offer) => {
              const job = game.jobs.find((j) => j.id === offer.jobId)!;
              return (
                <button
                  className={`offer-preview ${selectedOffer?.id === offer.id ? "selected" : ""}`}
                  key={offer.id}
                  onClick={() => setSelected(offer.id)}
                >
                  <div>
                    <CompanyLogo job={job} />
                    <Badge
                      tone={
                        offer.status === "accepted" ||
                        offer.status === "pending"
                          ? "green"
                          : "neutral"
                      }
                    >
                      {STATUS_LABELS[offer.status]}
                    </Badge>
                  </div>
                  <h3>{job.name}</h3>
                  <p>{job.role}</p>
                  <strong>
                    {money(offer.salary)}
                    <small>/ 月</small>
                  </strong>
                  <footer>
                    <span>岗位匹配 {jobMatch(game, job)}%</span>
                    <Icon name="chevron" size={15} />
                  </footer>
                </button>
              );
            })}
          </aside>
          {selectedOffer && (
            <NegotiationPanel
              key={selectedOffer.id}
              offer={selectedOffer}
              {...props}
            />
          )}
        </div>
      )}
    </>
  );
}
function ReportCard({
  report,
  company,
}: {
  report: InterviewReport;
  company: string;
}) {
  const [open, setOpen] = useState(true);
  const dimensions = [
    { label: "客观能力", value: report.objectiveAbility },
    { label: "本场专业表现", value: report.professional },
    { label: "岗位匹配", value: report.match },
    { label: "企业录用意愿", value: report.willingness },
  ];
  return (
    <article className="interview-report">
      <button
        className="report-heading"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span
          className={`report-status-icon ${report.passed ? "success" : ""}`}
        >
          <Icon name={report.passed ? "checked" : "book"} size={21} />
        </span>
        <div>
          <strong>
            {company} · 第 {report.round + 1} 轮
          </strong>
          <span>第 {report.day} 天 · 面试复盘</span>
        </div>
        <Badge tone={report.passed ? "green" : "orange"}>
          {report.passed ? "本轮通过" : "继续积累"}
        </Badge>
        <Icon name={open ? "chevronDown" : "chevron"} size={17} />
      </button>
      {open && (
        <div className="report-content">
          <div className="report-dimensions">
            {dimensions.map((d) => (
              <div key={d.label}>
                <span>{d.label}</span>
                <strong>{d.value}</strong>
                <Progress value={d.value} />
              </div>
            ))}
          </div>
          <p className="report-reason">{report.reason}</p>
          <div className="report-detailed">
            <div>
              <h4>表达与可信度</h4>
              {[
                { label: "表达能力", value: report.expression },
                { label: "逻辑能力", value: report.logic },
                { label: "证据质量", value: report.evidence },
                { label: "诚信可信度", value: report.integrity },
                { label: "面试官印象", value: report.impression },
              ].map((d) => (
                <div className="report-bar" key={d.label}>
                  <span>{d.label}</span>
                  <Progress value={d.value} />
                  <strong>{d.value}</strong>
                </div>
              ))}
            </div>
            <div>
              <h4>职业专业维度</h4>
              {Object.entries(report.specialized).map(([label, value]) => (
                <div className="report-bar" key={label}>
                  <span>{label}</span>
                  <Progress value={value} tone="blue" />
                  <strong>{value}</strong>
                </div>
              ))}
              <p className="small muted">
                候选人竞争参考 {report.competitorScore}
                。专业表现、能力、匹配和录用意愿分别计算。
              </p>
            </div>
          </div>
          <div className="report-advice">
            <h4>
              <Icon name="sparkles" size={16} />
              留给下一场面试的建议
            </h4>
            {report.feedback.map((feedback, i) => (
              <p key={i}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {feedback}
              </p>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
export function Report({ game, navigate }: GameProps) {
  const summary = runSummary(game);
  const accepted = game.offers.find((o) => o.status === "accepted");
  const reports = game.applications
    .flatMap((a) =>
      a.reports.map((report) => ({
        report,
        company: game.jobs.find((j) => j.id === a.jobId)!.name,
      })),
    )
    .reverse();
  const [records, setRecords] = useState<LocalRecord[]>([]);
  useEffect(() => {
    try {
      if (game.ended) recordRun(localStorage, game);
      setRecords(
        readRecords(localStorage).filter(
          (r) =>
            r.seed === game.seed &&
            r.mode === game.mode &&
            r.background === game.player.background,
        ),
      );
    } catch {
      setRecords([]);
    }
  }, [game.ended, game.seed, game.mode, game.player.background]);
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">EVERY STEP COUNTS</span>
          <h1>{game.ended ? "这一程，值得被记住。" : "看见自己的每一步"}</h1>
          <p>
            {game.ended
              ? "30 天不是终点，带着更清晰的答案，走向下一段旅程。"
              : "把经历变成经验，把下一次选择做得更好。"}
          </p>
        </div>
        <Badge tone="green">
          <Icon name="report" size={14} />
          {game.ended ? "30 天完整复盘" : `第 ${game.day} 天 · 阶段复盘`}
        </Badge>
      </div>
      <section className="summary-hero">
        <div className="summary-emblem">
          <Icon name={accepted ? "trophy" : "sparkles"} size={45} />
        </div>
        <div>
          <span className="eyebrow">
            {MODES.find((m) => m.id === game.mode)?.name} ·{" "}
            {BACKGROUNDS.find((b) => b.id === game.player.background)?.name}
          </span>
          <h2>
            {accepted
              ? `下一站，${game.jobs.find((j) => j.id === accepted.jobId)?.name}`
              : game.stats.offers > 0
                ? "获得机会，也学会选择。"
                : game.ended
                  ? "积累与成长，同样是收获。"
                  : "每一次认真准备，都在发生改变。"}
          </h2>
          <p>
            {accepted
              ? `你接受了月薪 ${money(accepted.salary)} 的 Offer。希望这里有值得投入的工作，也有彼此成就的伙伴。`
              : "主动拒绝不合适的机会不会被判为失败。你的能力成长、面试经验和每一次选择，都会保留在报告中。"}
          </p>
        </div>
        <div className="summary-score">
          <span>本局挑战积分</span>
          <strong>{summary.score.toLocaleString("zh-CN")}</strong>
          <small>{MODES.find((m) => m.id === game.mode)?.name}</small>
        </div>
      </section>
      <div className="summary-metrics">
        {[
          {
            value: `${game.stats.offers}`,
            label: "累计获得 Offer",
            note: `${summary.valid.length} 份仍有效 / 已接受`,
            icon: "offers",
          },
          {
            value: summary.maxSalary ? money(summary.maxSalary) : "—",
            label: "最高目标年包",
            note: "含目标奖金，奖金随绩效浮动",
            icon: "wallet",
          },
          {
            value: summary.firstDay ? `第 ${summary.firstDay} 天` : "—",
            label: "首次获得 Offer",
            note: "每一份认真，都在缩短距离",
            icon: "clock",
          },
          {
            value: `${summary.bestMatch}%`,
            label: "最高有效岗位匹配",
            note: "比薪资更长远的，是适合",
            icon: "target",
          },
        ].map((m) => (
          <div key={m.label}>
            <Icon name={m.icon} size={21} />
            <strong>{m.value}</strong>
            <span>{m.label}</span>
            <small>{m.note}</small>
          </div>
        ))}
      </div>
      <div className="report-overview">
        <section className="panel">
          <div className="panel-heading">
            <h3>这一路的积累</h3>
            <Icon name="trend" size={19} />
          </div>
          <div className="growth-list">
            {[
              { label: "简历投递", value: game.stats.applications, unit: "份" },
              { label: "正式面试", value: game.stats.interviews, unit: "场" },
              { label: "专业学习", value: game.stats.studied, unit: "次" },
              { label: "企业调查", value: game.stats.researched, unit: "次" },
              {
                label: "训练与实战经验",
                value: game.player.experience,
                unit: "点",
              },
              { label: "求职总支出", value: game.stats.spent, unit: "元" },
            ].map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>
                  {item.value.toLocaleString("zh-CN")}{" "}
                  <small>{item.unit}</small>
                </strong>
              </div>
            ))}
          </div>
        </section>
        <section className="panel seed-records">
          <div className="panel-heading">
            <h3>
              <Icon name="trophy" size={17} />
              同种子个人纪录
            </h3>
            <Badge>本地</Badge>
          </div>
          <p>SEED · {game.seed}</p>
          <small>仅比较相同种子、模式与背景的本地纪录。</small>
          {!records.length ? (
            <div className="no-record">
              <Icon name="target" size={26} />
              <p>挑战结束后，成绩会自动记录在这里。</p>
            </div>
          ) : (
            records.slice(0, 5).map((r, i) => (
              <div className="local-record" key={r.id}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>
                  {r.name}
                  <small>{r.offers} 份 Offer</small>
                </span>
                <strong>{r.score.toLocaleString("zh-CN")}</strong>
              </div>
            ))
          )}
        </section>
      </div>
      <section className="spaced">
        <SectionTitle
          title="让每一场面试，都成为经验"
          eyebrow="INTERVIEW RETROSPECTIVE"
        >
          <Badge>{reports.length} 份报告</Badge>
        </SectionTitle>
        {reports.length ? (
          reports.map((item, i) => (
            <ReportCard
              key={`${item.company}-${item.report.round}-${i}`}
              {...item}
            />
          ))
        ) : (
          <div className="panel">
            <Empty
              icon="book"
              title="第一份面试报告，在下一次勇敢之后"
              text="正式面试结束后，这里会分别呈现能力、专业表现、企业意愿、岗位匹配和可操作的改进建议。"
            >
              <button
                className="button secondary"
                onClick={() => navigate("learning")}
              >
                先去训练场准备
                <Icon name="arrow" size={16} />
              </button>
            </Empty>
          </div>
        )}
      </section>
    </>
  );
}
export function Interview(props: GameProps) {
  const { game, career, act } = props;
  const session = game.activeInterview!;
  const challenge = session.challenges[session.step];
  const job = game.jobs.find((j) => j.id === session.jobId)!;
  const person = PERSONALITIES[job.personality];
  const [now, setNow] = useState(Date.now());
  const [confirmExit, setConfirmExit] = useState(false);
  const remaining = Math.max(0, Math.ceil((session.expiresAt - now) / 1000));
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (remaining === 0)
      act({
        type: "SUBMIT_CHALLENGE",
        answer: session.draft,
        now: Math.max(Date.now(), session.expiresAt + 1),
      });
  }, [remaining, session.step, session.expiresAt]);
  const Panel = career.ChallengePanel;
  return (
    <>
      <div className="interview-topbar">
        <button className="text-button" onClick={() => setConfirmExit(true)}>
          <Icon name="left" size={16} />
          {session.practice ? "退出训练" : "结束面试"}
        </button>
        <div>
          <span className="live-dot" />
          {session.practice ? "模拟训练中" : "面试进行中"}
          <i />
          规则引擎模拟
        </div>
        <span className={`interview-timer ${remaining < 60 ? "urgent" : ""}`}>
          <Icon name="clock" size={17} />
          {String(Math.floor(remaining / 60)).padStart(2, "0")}:
          {String(remaining % 60).padStart(2, "0")}
        </span>
      </div>
      <div className="interview-heading">
        <div>
          <span className="eyebrow">
            {session.practice
              ? "PRACTICE ROOM"
              : `${job.english} · ROUND ${session.round + 1}`}
          </span>
          <h1>{challenge.title}</h1>
          <p>{challenge.brief}</p>
        </div>
        <div className="interview-step">
          {session.challenges.map((c, i) => (
            <span
              className={
                i === session.step
                  ? "active"
                  : i < session.step
                    ? "complete"
                    : ""
              }
              key={c.id}
            >
              <b>{i < session.step ? "✓" : i + 1}</b>
              {c.title}
            </span>
          ))}
        </div>
      </div>
      <div className="interview-stage">
        <aside className="interviewer-panel">
          <div className={`video-portrait ${job.personality}`}>
            <div className="portrait-background" />
            <div className="portrait-body" />
            <div className="portrait-neck" />
            <div className="portrait-hair" />
            <div className="portrait-face">
              <span />
              <span />
              <i />
            </div>
            <span className="video-live">
              <span />
              在线
            </span>
            <span className="video-mic">
              <Icon name="activity" size={17} />
            </span>
          </div>
          <div className="interviewer-name">
            <h3>
              {session.practice ? "训练官 · " : ""}
              {person.name}
            </h3>
            <p>
              {person.role} · {job.name}
            </p>
            <Badge>{person.style.split(" · ")[0]}风格</Badge>
          </div>
          <div className="interviewer-message">
            <Icon name="chat" size={18} />
            <p>{person.opening}</p>
          </div>
          <div className="interview-reminder">
            <Icon name="info" size={17} />
            <p>
              这里的回答由确定性规则评价，不具备完整语义理解。说明真实细节、验证方法与能力边界更有价值。
            </p>
          </div>
        </aside>
        <section className="challenge-panel">
          <Panel
            key={`${challenge.id}-${session.step}`}
            challenge={challenge}
            draft={session.draft}
            context={{
              job,
              player: game.player,
              skills: game.careers[game.careerId].skills,
              round: session.round,
            }}
            remaining={remaining}
            onChange={(draft) => act({ type: "DRAFT", draft })}
            onSubmit={(answer) =>
              act({ type: "SUBMIT_CHALLENGE", answer, now: Date.now() })
            }
          />
        </section>
      </div>
      {confirmExit && (
        <Modal
          title={session.practice ? "要暂停这次训练吗？" : "结束本次面试？"}
          onClose={() => setConfirmExit(false)}
        >
          <div className="confirmation-content">
            <p>
              {session.practice
                ? "本次训练的时段与精力已消耗，退出后不会生成报告。"
                : "主动退出会结束这家企业的本次求职流程。你可以把精力留给更适合的机会。"}
            </p>
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setConfirmExit(false)}
              >
                继续{session.practice ? "训练" : "面试"}
              </button>
              <button
                className="button primary"
                onClick={() => act({ type: "ABANDON_INTERVIEW" })}
              >
                确认结束
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
