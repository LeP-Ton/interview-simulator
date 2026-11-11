import { Fragment, useState } from "react";
import { jobMatch, objectiveAbility } from "../core/engine";
import { BALANCE, PERSONALITIES } from "../core/config";
import type { Application, CareerModule, GameState, Job } from "../core/types";
import type { GameProps } from "./types";
import { STATUS_LABELS } from "./types";
import {
  Badge,
  DeskIllustration,
  Empty,
  Icon,
  Modal,
  Progress,
  SectionTitle,
  money,
  salary,
} from "../shared/ui";

export function CompanyLogo({
  job,
  large = false,
}: {
  job: Job;
  large?: boolean;
}) {
  return (
    <span className={`company-logo ${job.color} ${large ? "large" : ""}`}>
      {job.mark}
    </span>
  );
}
export function JobCard({
  job,
  game,
  openJob,
}: {
  job: Job;
  game: GameState;
  openJob: (job: Job) => void;
}) {
  const match = jobMatch(game, job);
  const application = game.applications.find((a) => a.jobId === job.id);
  return (
    <article className={`job-card ${job.closed ? "is-closed" : ""}`}>
      <div className="company-row">
        <CompanyLogo job={job} />
        <div>
          <strong>{job.name}</strong>
          <span>
            {job.industry}
            <i /> {job.size}
          </span>
        </div>
        <span className={`match-label ${match < 50 ? "low" : ""}`}>
          <span />
          {match}% 匹配
        </span>
      </div>
      <div className="job-heading">
        <h3>{job.role}</h3>
        <strong>
          {salary(job.minSalary)}–{salary(job.maxSalary)}
          <small> / 月</small>
        </strong>
      </div>
      <p className="job-meta">
        {job.minYears === 0 ? "应届 / 经验不限" : `${job.minYears} 年及以上`}
        <span>·</span>
        {job.level}
        <span>·</span>
        {job.culture}
      </p>
      <div className="job-tags">
        {job.skillTags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="job-card-footer">
        <span>
          <Icon name="users" size={14} />
          {job.closed ? "招聘暂停" : `${job.openings} 个名额`}
          <i />
          {job.competition > 65 ? "竞争较热" : "机会正好"}
        </span>
        <button className="text-button" onClick={() => openJob(job)}>
          {application ? STATUS_LABELS[application.status] : "查看机会"}
          <Icon name="arrow" size={15} />
        </button>
      </div>
    </article>
  );
}
export function Dashboard(props: GameProps) {
  const { game, act, navigate, openJob } = props;
  const recommended = game.jobs
    .filter(
      (j) =>
        j.discovered &&
        !j.closed &&
        !game.applications.some((a) => a.jobId === j.id),
    )
    .sort((a, b) => jobMatch(game, b) - jobMatch(game, a))
    .slice(0, 2);
  const today = game.applications.filter(
    (a) => a.status === "scheduled" && a.scheduledDay === game.day,
  );
  const invitations = game.applications.filter(
    (a) => a.status === "scheduling",
  );
  const weekStart = Math.floor((game.day - 1) / 7) * 7 + 1;
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">A LITTLE PROGRESS, EVERY DAY</div>
          <h1>
            你好，{game.player.name}
            <span className="greeting-spark">✳</span>
          </h1>
          <p>今天的每一点准备，都在靠近理想的自己。</p>
        </div>
        <Badge tone="green">
          <span className="live-dot" />
          你的求职旅程正在进行
        </Badge>
      </div>
      <section className="journey-hero">
        <div>
          <span className="hero-kicker">
            <Icon name="sparkles" size={15} />
            下一个机会，值得期待
          </span>
          <h2>
            把每一次准备，
            <br />
            变成新的<span>可能。</span>
          </h2>
          <p>
            市场瞬息万变，但你可以选择自己的节奏。
            <br />
            先迈出一小步，好机会会慢慢清晰。
          </p>
          <button className="button dark" onClick={() => navigate("market")}>
            探索招聘市场
            <Icon name="up" size={17} />
          </button>
        </div>
        <DeskIllustration />
        <div className="hero-day">
          <span>你的 30 天挑战</span>
          <strong>
            DAY {String(game.day).padStart(2, "0")}
            <small> / 30</small>
          </strong>
          <Progress value={(game.day / 30) * 100} />
        </div>
      </section>
      <div className="resource-grid">
        {[
          {
            icon: "wallet",
            label: "求职资金",
            value: money(game.player.money),
            note: `生活费 ${money(BALANCE.dailyCost)} / 天`,
            tone: "sage",
          },
          {
            icon: "energy",
            label: "当前精力",
            value: `${game.player.energy}`,
            unit: "/ 100",
            note:
              game.player.energy > 60
                ? "状态不错，保持节奏"
                : "记得给自己留些休息时间",
            tone: "orange",
          },
          {
            icon: "code",
            label: "专业能力",
            value: `${objectiveAbility(game)}`,
            unit: "/ 100",
            note: "每一次学习，都算数",
            tone: "blue",
          },
          {
            icon: "chat",
            label: "沟通能力",
            value: `${game.player.communication}`,
            unit: "/ 100",
            note: `面试经验 ${game.player.experience} 点`,
            tone: "purple",
          },
        ].map((item) => (
          <div className="resource-card" key={item.label}>
            <span className={`resource-icon ${item.tone}`}>
              <Icon name={item.icon} size={20} />
            </span>
            <div>
              <span className="resource-label">{item.label}</span>
              <strong>
                {item.value}
                <small>{item.unit}</small>
              </strong>
              <span className="resource-note">{item.note}</span>
            </div>
            {item.label === "当前精力" && (
              <div className="mini-energy">
                <Progress value={game.player.energy} tone="orange" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-left">
          <section>
            <SectionTitle
              title="为你发现的机会"
              eyebrow="YOUR NEXT OPPORTUNITY"
            >
              <button
                className="text-button"
                onClick={() => navigate("market")}
              >
                全部岗位
                <Icon name="arrow" size={15} />
              </button>
            </SectionTitle>
            <div className="job-grid dashboard-jobs">
              {recommended.map((job) => (
                <JobCard key={job.id} job={job} game={game} openJob={openJob} />
              ))}
              {!recommended.length && (
                <Empty
                  icon="market"
                  title="新的可能还在路上"
                  text="当前推荐岗位已投递，去看看其他岗位或搜索新机会。"
                >
                  <button
                    className="button secondary"
                    onClick={() => navigate("market")}
                  >
                    前往市场
                  </button>
                </Empty>
              )}
            </div>
          </section>
          <section className="market-feed">
            <SectionTitle
              title="市场风向"
              eyebrow="THE MARKET NEVER STANDS STILL"
            >
              <span className="small muted">
                <span className="live-dot" />
                实时动态
              </span>
            </SectionTitle>
            <div className="feed-list">
              {game.events.slice(0, 4).map((item) => (
                <div className="feed-item" key={item.id}>
                  <span className={`feed-dot ${item.kind}`} />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                  <time>第 {item.day} 天</time>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="dashboard-right">
          <section className="today-card">
            <div className="card-heading">
              <h3>我的求职日历</h3>
              <button
                className="icon-button"
                aria-label="打开求职日历"
                onClick={() => navigate("calendar")}
              >
                <Icon name="up" size={17} />
              </button>
            </div>
            <div className="mini-week">
              {Array.from({ length: 7 }, (_, i) => {
                const day = weekStart + i;
                return (
                  <button
                    className={day === game.day ? "current" : ""}
                    disabled={day > 30}
                    key={day}
                    onClick={() => navigate("calendar")}
                  >
                    <small>DAY</small>
                    <strong>{day > 30 ? "—" : day}</strong>
                    <span
                      className={
                        game.applications.some(
                          (a) =>
                            a.status === "scheduled" && a.scheduledDay === day,
                        )
                          ? "has-event"
                          : ""
                      }
                    />
                  </button>
                );
              })}
            </div>
            <div className="today-label">
              <span>今日安排</span>
              <Badge>{game.slots} 个时段可用</Badge>
            </div>
            {today.length ? (
              today.map((a) => {
                const job = game.jobs.find((j) => j.id === a.jobId)!;
                return (
                  <div className="today-interview" key={a.id}>
                    <span className="time-label">
                      {a.slot === 0 ? "10:00" : "14:00"}
                    </span>
                    <div>
                      <strong>{job.name}</strong>
                      <small>第 {a.round + 1} 轮 · 在线面试</small>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`参加${job.name}面试`}
                      onClick={() =>
                        act({
                          type: "START_INTERVIEW",
                          applicationId: a.id,
                          now: Date.now(),
                        })
                      }
                    >
                      <Icon name="video" size={18} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="quiet-day">
                <Icon name="coffee" size={27} />
                <p>今天还没有安排面试</p>
                <small>留点时间准备，也很好。</small>
              </div>
            )}
            {invitations.length > 0 && (
              <button
                className="invitation-banner"
                onClick={() => navigate("calendar")}
              >
                <Icon name="bell" size={16} />
                {invitations.length} 份邀请等待预约
                <Icon name="chevron" size={15} />
              </button>
            )}
            <button
              className="button secondary full-width"
              onClick={() => navigate("calendar")}
            >
              <Icon name="calendar" size={16} />
              查看完整日程
            </button>
          </section>
          <section className="daily-tip">
            <div>
              <Icon name="book" size={18} />
              <span>今日求职灵感</span>
            </div>
            <h3>
              {
                [
                  "用结果，讲好你的故事。",
                  "面试，也是一次双向选择。",
                  "不必准备好一切，才开始。",
                ][(game.day - 1) % 3]
              }
            </h3>
            <p>
              {
                [
                  "把“负责性能优化”换成“首屏加载从 3 秒降到 1.2 秒”，具体的变化比抽象的形容更有说服力。",
                  "调查团队真实问题，准备一次有价值的反向提问。你也在选择未来的工作环境。",
                  "一边投递，一边复盘。真实的面试反馈，能帮你找到更有价值的学习方向。",
                ][(game.day - 1) % 3]
              }
            </p>
            <button
              className="text-button"
              onClick={() => navigate("learning")}
            >
              去练习一下
              <Icon name="arrow" size={15} />
            </button>
          </section>
          <div className="journey-stats">
            <div>
              <strong>{game.applications.length}</strong>
              <span>已投递</span>
            </div>
            <div>
              <strong>{game.stats.interviews}</strong>
              <span>已面试</span>
            </div>
            <div>
              <strong>{game.stats.offers}</strong>
              <span>已获 Offer</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
export function Market({ game, act, openJob }: GameProps) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState("match");
  const jobs = game.jobs
    .filter(
      (j) =>
        j.discovered &&
        `${j.name}${j.role}${j.industry}${j.skillTags.join("")}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (level === "all" || j.level === level) &&
        (tab !== "recommended" || (jobMatch(game, j) >= 60 && !j.closed)) &&
        (tab !== "applied" || game.applications.some((a) => a.jobId === j.id)),
    )
    .sort((a, b) =>
      sort === "salary"
        ? b.maxSalary - a.maxSalary
        : sort === "competition"
          ? a.competition - b.competition
          : jobMatch(game, b) - jobMatch(game, a),
    );
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">GOOD THINGS ARE OUT THERE</span>
          <h1>
            招聘市场
            <span className="heading-count">
              {game.jobs.filter((j) => j.discovered && !j.closed).length} 个机会
            </span>
          </h1>
          <p>每一家企业，都可能是下一段故事的开始。</p>
        </div>
        <button
          className="button primary"
          onClick={() => act({ type: "SEARCH" })}
        >
          <Icon name="refresh" size={16} />
          搜索新机会<span className="button-cost">1 时段</span>
        </button>
      </div>
      <div className="market-banner">
        <span className="market-banner-icon">
          <Icon name="trend" size={23} />
        </span>
        <div>
          <strong>机会是动态的，准备也是。</strong>
          <p>企业名额与预算每日变化。深入调查，可以比其他候选人多知道一点。</p>
        </div>
        <Badge tone="green">SEED · {game.seed}</Badge>
      </div>
      <div className="market-toolbar">
        <div className="tabs">
          {[
            { id: "all", name: "全部机会" },
            { id: "recommended", name: "高匹配岗位" },
            { id: "applied", name: `已投递 ${game.applications.length}` },
          ].map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="market-search">
          <Icon name="search" size={17} />
          <input
            aria-label="搜索公司、岗位或技能"
            placeholder="搜索公司、岗位或技能"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="market-filters">
        <div>
          <label>
            <Icon name="filter" size={15} />
            <select
              aria-label="按职级筛选"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="all">全部职级</option>
              {["P4", "P5", "P6", "P7"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <span className="small muted">找到 {jobs.length} 个相关岗位</span>
        </div>
        <select
          aria-label="岗位排序"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="match">按匹配度排序</option>
          <option value="salary">按薪资排序</option>
          <option value="competition">按竞争程度排序</option>
        </select>
      </div>
      <div className="job-grid market-jobs">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} game={game} openJob={openJob} />
        ))}
      </div>
      {!jobs.length && (
        <Empty
          icon="search"
          title="暂时没有找到相关机会"
          text="换一个关键词、调整职级，或探索新的岗位。"
        >
          <button
            className="button secondary"
            onClick={() => {
              setQuery("");
              setLevel("all");
              setTab("all");
            }}
          >
            重置筛选
          </button>
        </Empty>
      )}
      <div className="market-bottom-note">
        <Icon name="shield" size={15} />
        所有企业及岗位均为虚构 · 策略练习，在这里安心尝试
      </div>
    </>
  );
}
export function JobDetail({
  job,
  career,
  game,
  act,
  onClose,
  navigate,
}: {
  job: Job;
  career: CareerModule;
  game: GameState;
  act: GameProps["act"];
  onClose: () => void;
  navigate: GameProps["navigate"];
}) {
  const application: Application | undefined = game.applications.find(
    (a) => a.jobId === job.id,
  );
  return (
    <Modal
      title="遇见你的下一站"
      subtitle="不止了解岗位，也了解一起工作的人。"
      onClose={onClose}
      wide
    >
      <div className="job-detail">
        <div className="job-detail-hero">
          <CompanyLogo job={job} large />
          <div>
            <div className="detail-company-name">
              {job.name}
              <span>{job.english}</span>
            </div>
            <h2>{job.role}</h2>
            <p>
              {job.industry} · {job.size} · {job.level}
            </p>
          </div>
          <div className="detail-salary">
            <strong>
              {salary(job.minSalary)}–{salary(job.maxSalary)}
            </strong>
            <span>/ 月 · 预期 14–16 薪</span>
            <Badge tone="green">{jobMatch(game, job)}% 匹配</Badge>
          </div>
        </div>
        <div className="detail-columns">
          <div>
            <h3>你将参与什么</h3>
            <p className="body-text">
              加入{job.name}
              的产品技术团队，参与核心产品迭代，和跨职能伙伴一起解决真实业务问题。我们期待你对工程质量负责，也愿意分享自己的思考。
            </p>
            <div className="job-tags">
              {job.skillTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="detail-info-grid">
              <div>
                <span>经验要求</span>
                <strong>
                  {job.minYears === 0
                    ? "不限 / 欢迎应届生"
                    : `${job.minYears} 年及以上`}
                </strong>
              </div>
              <div>
                <span>团队文化</span>
                <strong>{job.culture}</strong>
              </div>
              <div>
                <span>招聘名额</span>
                <strong>{job.closed ? "已暂停" : `${job.openings} 人`}</strong>
              </div>
              <div>
                <span>能力参考</span>
                <strong>{job.requiredSkill} / 100</strong>
              </div>
            </div>
            <h3 className="spaced">面试旅程</h3>
            <div className="interview-process">
              {[
                "简历筛选",
                ...Array.from({ length: career.interviewRounds }, (_, round) =>
                  career
                    .createInterview(job, round, game.seed)
                    .map((c) => c.title)
                    .join(" + "),
                ),
                "Offer 沟通",
              ].map((title, index) => (
                <Fragment key={index}>
                  {index > 0 && <Icon name="chevron" size={14} />}
                  <span>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    {title}
                  </span>
                </Fragment>
              ))}
            </div>
            <h3 className="spaced">
              你的竞争者 <Badge>{job.competitors.length} 位候选人</Badge>
            </h3>
            <div className="competitor-list">
              {job.competitors.map((c, i) => (
                <div key={c.id}>
                  <span className="candidate-avatar">{i + 1}</span>
                  <div>
                    <strong>
                      {job.research >= 2
                        ? c.name
                        : `候选人 ${String.fromCharCode(65 + i)}`}
                    </strong>
                    <small>
                      {job.research >= 2
                        ? `${c.years} 年经验 · ${c.pedigree}`
                        : "继续调查，了解竞争者背景"}
                    </small>
                  </div>
                  <div className="candidate-progress">
                    <small>
                      {c.state === "hired"
                        ? "已入职"
                        : c.state === "left"
                          ? "已离开"
                          : `进度 ${c.progress}%`}
                    </small>
                    <Progress value={c.progress} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="intel-panel">
            <div className="card-heading">
              <h3>
                <Icon name="search" size={17} />
                企业调查
              </h3>
              <Badge tone="green">{job.research}/3</Badge>
            </div>
            <p>信息越充分，选择越笃定。</p>
            {[
              { title: "团队真实问题", text: job.problem },
              {
                title: "薪资与工作节奏",
                text: `可批月薪上限 ${money(job.budget)}；${job.intensity}。`,
              },
              {
                title: "招聘偏好与风险",
                text: `更重视${job.preference}；经营风险 ${job.risk}/100。面试官风格：${PERSONALITIES[job.personality].style}。`,
              },
            ].map((intel, i) => (
              <div
                className={`intel-item ${job.research > i ? "unlocked" : ""}`}
                key={intel.title}
              >
                <span>
                  <Icon
                    name={job.research > i ? "checked" : "lock"}
                    size={16}
                  />
                  {intel.title}
                </span>
                <p>{job.research > i ? intel.text : "继续调查以解锁信息"}</p>
              </div>
            ))}
            <button
              className="button secondary full-width"
              disabled={job.research === 3 || game.ended}
              onClick={() => act({ type: "RESEARCH", jobId: job.id })}
            >
              <Icon name="search" size={15} />
              {job.research === 3 ? "调查已完成" : "深入调查"}
            </button>
            <small className="cost-note">
              1 时段 · 8 精力 · {money(BALANCE.researchCost)}
            </small>
          </aside>
        </div>
        {application && (
          <div className="application-feedback">
            <Badge
              tone={
                ["offer", "accepted"].includes(application.status)
                  ? "green"
                  : "neutral"
              }
            >
              {STATUS_LABELS[application.status]}
            </Badge>
            <span>{application.feedback}</span>
          </div>
        )}
        <div className="modal-actions">
          <button
            className="text-button"
            onClick={() => {
              onClose();
              navigate("resume");
            }}
          >
            <Icon name="resume" size={16} />
            查看我的简历
          </button>
          {application ? (
            <button
              className="button primary"
              onClick={() => {
                onClose();
                navigate(
                  application.status === "offer" ||
                    application.status === "accepted"
                    ? "offers"
                    : "calendar",
                );
              }}
            >
              查看求职进展
              <Icon name="arrow" size={16} />
            </button>
          ) : (
            <button
              className="button primary"
              disabled={
                job.closed || game.ended || game.player.years + 2 < job.minYears
              }
              onClick={() => {
                if (act({ type: "APPLY", jobId: job.id })) onClose();
              }}
            >
              <Icon name="send" size={16} />
              {game.player.years + 2 < job.minYears
                ? "经验暂未达到要求"
                : "投递简历"}
              <span className="button-cost">1 时段 · 7 精力</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
