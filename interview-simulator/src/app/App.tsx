import { useEffect, useRef, useState } from "react";
import { BALANCE } from "../core/config";
import { createGame, transition } from "../core/engine";
import { createCareerRegistry } from "../core/registry";
import { loadGame, parseSave, recordRun, saveGame } from "../core/save";
import type { Action, GameState, Job } from "../core/types";
import { programmer } from "../careers/programmer/manifest";
import { Badge, Brand, Icon, Modal, Progress } from "../shared/ui";
import { Onboarding } from "./Onboarding";
import { Dashboard, JobDetail, Market } from "./Workspace";
import { Calendar, Learning, ResumeEditor } from "./Planning";
import { Interview, Offers, Report } from "./Results";
import type { GameProps, Page } from "./types";

const registry = createCareerRegistry([programmer]);
const NAV: { id: Page; name: string; icon: string; subtitle: string }[] = [
  {
    id: "dashboard",
    name: "工作台",
    icon: "dashboard",
    subtitle: "你的求职生活，从这里展开",
  },
  {
    id: "market",
    name: "招聘市场",
    icon: "market",
    subtitle: "发现下一段故事的起点",
  },
  {
    id: "resume",
    name: "我的简历",
    icon: "resume",
    subtitle: "把你的经历，讲得更动人",
  },
  {
    id: "calendar",
    name: "求职日历",
    icon: "calendar",
    subtitle: "给重要的事情留出时间",
  },
  {
    id: "learning",
    name: "成长空间",
    icon: "study",
    subtitle: "成长，发生在每一天",
  },
  {
    id: "offers",
    name: "Offer 收件箱",
    icon: "offers",
    subtitle: "好消息，值得认真选择",
  },
  {
    id: "report",
    name: "求职复盘",
    icon: "report",
    subtitle: "每一步，都算数",
  },
];
const VIEWS = {
  dashboard: Dashboard,
  market: Market,
  resume: ResumeEditor,
  calendar: Calendar,
  learning: Learning,
  offers: Offers,
  report: Report,
};

function validateCareer(state: GameState) {
  const career = registry.get(state.careerId);
  if (
    !career.abilityModel.every(
      (s) => typeof state.careers[state.careerId].skills[s.id] === "number",
    )
  )
    throw new Error("存档能力模型与当前职业版本不一致");
  if (
    state.activeInterview &&
    !state.activeInterview.challenges.every((c) =>
      career.practiceChallenges.some((p) => p.kind === c.kind),
    )
  )
    throw new Error("存档包含未安装的专业挑战");
  if (
    state.activeInterview &&
    career.validateSession &&
    !career.validateSession(state.activeInterview)
  )
    throw new Error("专业挑战或草稿数据损坏，请选择其他备份");
  return state;
}
function bootGame(): { game: GameState | null; error: string } {
  try {
    const game = loadGame(localStorage);
    return { game: game ? validateCareer(game) : null, error: "" };
  } catch (e) {
    return {
      game: null,
      error: e instanceof Error ? e.message : "自动存档读取失败",
    };
  }
}
export default function App() {
  const [boot] = useState(bootGame);
  const [game, setGame] = useState<GameState | null>(boot.game);
  const [onboarding, setOnboarding] = useState(!boot.game);
  const [page, setPage] = useState<Page>(
    boot.game?.ended ? "report" : "dashboard",
  );
  const [jobId, setJobId] = useState<string | null>(null);
  const [modal, setModal] = useState<"settings" | "help" | "next" | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    error?: boolean;
  } | null>(
    boot.error
      ? {
          message: `自动存档暂未载入：${boot.error}。可导入备份或新建游戏。`,
          error: true,
        }
      : null,
  );
  const [saveState, setSaveState] = useState("已自动保存");
  const fileInput = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    if (!game) return;
    try {
      saveGame(localStorage, game);
      recordRun(localStorage, game);
      setSaveState("已自动保存");
    } catch {
      setSaveState("自动保存不可用，请导出备份");
    }
  }, [game]);
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [page, game?.activeInterview?.applicationId, game?.activeInterview?.step]);
  const navigate = (next: Page) => {
    setPage(next);
    setJobId(null);
  };
  const act = (action: Action): boolean => {
    if (!game) return false;
    try {
      const next = transition(game, action, registry.get(game.careerId));
      setGame(next);
      if (game.activeInterview && !next.activeInterview) {
        setPage(game.activeInterview.practice ? "learning" : "report");
      }
      if (next.ended) setPage("report");
      if (
        ![
          "DRAFT",
          "START_INTERVIEW",
          "START_PRACTICE",
          "SUBMIT_CHALLENGE",
          "NEXT_DAY",
        ].includes(action.type)
      )
        setToast({
          message:
            next.events[0]?.id !== game.events[0]?.id
              ? next.events[0].title
              : "操作已完成，相关信息已更新。",
        });
      return true;
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "操作未完成，请稍后再试。",
        error: true,
      });
      return false;
    }
  };
  const manualSave = () => {
    if (game) {
      try {
        saveGame(localStorage, game, "manual");
        setToast({ message: "手动存档已保存，可在设置中随时读取。" });
      } catch {
        setToast({
          message: "当前浏览器无法写入存档，请导出 JSON 备份。",
          error: true,
        });
      }
    }
  };
  const manualLoad = () => {
    try {
      const loaded = loadGame(localStorage, "manual");
      if (!loaded) throw new Error("还没有手动存档，先保存一次吧。");
      setGame(validateCareer(loaded));
      setOnboarding(false);
      setModal(null);
      setPage(loaded.ended ? "report" : "dashboard");
      setToast({ message: "已恢复手动存档。" });
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "读取失败",
        error: true,
      });
    }
  };
  const copySeed = async () => {
    if (game) {
      try {
        await navigator.clipboard.writeText(game.seed);
        setToast({
          message: `市场种子 ${game.seed} 已复制，相同背景与模式更适合比较。`,
        });
      } catch {
        setToast({
          message: `当前种子：${game.seed}。浏览器不支持复制，请手动选取。`,
        });
      }
    }
  };
  const exportSave = () => {
    if (!game) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(game, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `面试模拟器-${game.seed.replace(/[^a-zA-Z0-9_-]/g, "_")}-DAY${game.day}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast({ message: "存档已导出，换浏览器时可以导入继续。" });
  };
  const selectedJob = game?.jobs.find((j) => j.id === jobId);
  const currentNav = NAV.find((n) => n.id === page)!;
  const career = game ? registry.get(game.careerId) : programmer;
  const props: GameProps | null = game
    ? { game, career, act, navigate, openJob: (job: Job) => setJobId(job.id) }
    : null;
  const View = VIEWS[page];
  const invitationCount =
    game?.applications.filter((a) => a.status === "scheduling").length ?? 0;
  const todayCount =
    game?.applications.filter(
      (a) => a.status === "scheduled" && a.scheduledDay === game.day,
    ).length ?? 0;
  const goNext = () => {
    if (todayCount || game?.day === 30) setModal("next");
    else act({ type: "NEXT_DAY" });
  };
  return (
    <div className={`desktop ${onboarding ? "is-onboarding" : ""}`}>
      <div className="desktop-menubar">
        <span>
          <Icon name="terminal" size={15} />
          <strong>GameX</strong>
          <i />
          面试模拟器
        </span>
        <span>
          属于你的下一章<span className="menubar-star">✳</span>
        </span>
      </div>
      <div className="app-window">
        <div className="window-titlebar">
          <div className="traffic-lights">
            <span />
            <span />
            <span />
          </div>
          <span>
            <Icon name="lock" size={10} />
            Interview Simulator — {onboarding ? "新的旅程" : "我的求职桌面"}
          </span>
          <span className="window-version">
            V1.0 <Icon name="maximize" size={11} />
          </span>
        </div>
        {onboarding ? (
          <Onboarding
            careers={registry.all()}
            hasSave={!!game}
            onResume={() => setOnboarding(false)}
            onStart={(input, selectedCareer) => {
              setGame(createGame(input, selectedCareer));
              setOnboarding(false);
              setPage("dashboard");
              setJobId(null);
              setModal(null);
              setToast({
                message: "新旅程已开启。先看看招聘市场，或完善你的简历吧。",
              });
            }}
          />
        ) : (
          game &&
          props && (
            <div className="workspace">
              <aside className="sidebar">
                <Brand />
                <div className="sidebar-caption">我的求职桌面</div>
                <nav aria-label="主导航">
                  {NAV.map((item) => {
                    const count =
                      item.id === "calendar"
                        ? invitationCount
                        : item.id === "offers"
                          ? game.offers.filter((o) => o.status === "pending")
                              .length
                          : 0;
                    return (
                      <button
                        aria-label={item.name}
                        title={item.name}
                        className={page === item.id ? "active" : ""}
                        disabled={!!game.activeInterview}
                        key={item.id}
                        onClick={() => navigate(item.id)}
                      >
                        <Icon name={item.icon} size={19} />
                        <span>{item.name}</span>
                        {count > 0 && <b>{count}</b>}
                        {page === item.id && count === 0 && (
                          <span className="nav-active-dot" />
                        )}
                      </button>
                    );
                  })}
                </nav>
                <div className="sidebar-challenge">
                  <div>
                    <span>
                      <Icon name="target" size={15} />
                      30 天求职挑战
                    </span>
                    <Icon name="sparkles" size={14} />
                  </div>
                  <p>
                    <strong>{String(game.day).padStart(2, "0")}</strong>
                    <span>/ 30 天</span>
                    <small>
                      {game.ended
                        ? "旅程已完成"
                        : `还有 ${31 - game.day} 天的可能`}
                    </small>
                  </p>
                  <Progress value={(game.day / 30) * 100} />
                  <div className="sidebar-challenge-foot">
                    {game.ended ? "每一步，都算数。" : "慢慢来，比较快。"}
                    <span>↗</span>
                  </div>
                </div>
                <div className="sidebar-bottom">
                  <button
                    aria-label="玩法指南"
                    title="玩法指南"
                    onClick={() => setModal("help")}
                  >
                    <Icon name="help" size={17} />
                    玩法指南
                    <Icon name="up" size={14} />
                  </button>
                  <button
                    aria-label="设置与存档"
                    title="设置与存档"
                    onClick={() => setModal("settings")}
                  >
                    <Icon name="settings" size={17} />
                    设置与存档
                  </button>
                  <div className="player-mini">
                    <span className="player-avatar">
                      {game.player.name.slice(0, 1)}
                    </span>
                    <div>
                      <strong>{game.player.name}</strong>
                      <small>{career.name} · 正在奔向下一站</small>
                    </div>
                    <span className="online-dot" />
                  </div>
                </div>
              </aside>
              <div className="main-shell">
                <header className="app-toolbar">
                  <div className="breadcrumb">
                    <Icon name="monitor" size={16} />
                    <span>我的桌面</span>
                    <Icon name="chevron" size={13} />
                    <strong>
                      {game.activeInterview ? "在线面试" : currentNav.name}
                    </strong>
                  </div>
                  <div className="toolbar-actions">
                    <span className="today-date">
                      {new Date(
                        Date.UTC(2026, 10, 10 + game.day),
                      ).toLocaleDateString("zh-CN", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                        timeZone: "Asia/Shanghai",
                      })}
                    </span>
                    <span className="toolbar-divider" />
                    <button
                      className="toolbar-save"
                      onClick={manualSave}
                      title="保存到独立的手动存档槽"
                    >
                      <Icon name="save" size={16} />
                      <span>保存进度</span>
                    </button>
                    <button
                      className="button primary next-day-button"
                      disabled={game.ended || !!game.activeInterview}
                      onClick={goNext}
                    >
                      {game.ended
                        ? "旅程已完成"
                        : game.day === 30
                          ? "完成 30 天"
                          : "结束今天"}
                      <Icon name="arrow" size={16} />
                    </button>
                  </div>
                </header>
                <main
                  ref={contentRef}
                  className={`main-content ${game.activeInterview ? "interview-content" : ""}`}
                >
                  {game.activeInterview ? (
                    <Interview {...props} />
                  ) : (
                    <View {...props} />
                  )}
                </main>
                <footer className="app-footer">
                  <span>
                    <span
                      className={`save-dot ${saveState.startsWith("已") ? "" : "warning"}`}
                    />
                    {saveState}
                  </span>
                  <span className="remaining-slots">
                    今日行动
                    {Array.from({ length: BALANCE.slots }, (_, i) => (
                      <i
                        key={i}
                        className={i < game.slots ? "available" : ""}
                      />
                    ))}
                    <b>
                      {game.slots}/{BALANCE.slots}
                    </b>
                  </span>
                  <button onClick={copySeed} title="复制市场种子">
                    SEED · {game.seed}
                    <Icon name="copy" size={12} />
                  </button>
                </footer>
              </div>
            </div>
          )
        )}
      </div>
      <div className="desktop-footer">
        <span>MAKE YOUR NEXT MOVE.</span>
        <span>
          认真准备，也认真生活。
          <Icon name="heart" size={12} />
        </span>
      </div>
      {toast && (
        <div className={`toast ${toast.error ? "error" : ""}`} role="status">
          <Icon name={toast.error ? "info" : "success"} size={19} />
          <span>{toast.message}</span>
          <button
            className="icon-button"
            aria-label="关闭提示"
            onClick={() => setToast(null)}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
      {selectedJob && game && (
        <JobDetail
          job={selectedJob}
          career={career}
          game={game}
          act={act}
          onClose={() => setJobId(null)}
          navigate={navigate}
        />
      )}
      <input
        className="hidden-input"
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        aria-label="导入游戏存档"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            if (file.size > 2_000_000) throw new Error("存档文件不能超过 2MB");
            const loaded = validateCareer(parseSave(await file.text()));
            setGame(loaded);
            setOnboarding(false);
            setPage(loaded.ended ? "report" : "dashboard");
            setModal(null);
            setToast({ message: "存档已导入，欢迎继续你的旅程。" });
          } catch (error) {
            setToast({
              message: error instanceof Error ? error.message : "导入失败",
              error: true,
            });
          }
          e.target.value = "";
        }}
      />
      {modal === "settings" && game && (
        <Modal
          title="设置与存档"
          subtitle="随时停下来，下次从这里继续。"
          onClose={() => setModal(null)}
        >
          <div className="settings-content">
            <div className="settings-summary">
              <Icon name="save" size={24} />
              <div>
                <strong>
                  {game.player.name}的旅程 · DAY {game.day}
                </strong>
                <span>
                  存档版本 V{game.version} · {career.name}
                </span>
              </div>
              <Badge tone="green">本地保存</Badge>
            </div>
            <div className="settings-actions">
              <button onClick={manualSave}>
                <Icon name="save" />
                <span>
                  <strong>手动保存</strong>
                  <small>覆盖独立手动存档，自动存档继续保留</small>
                </span>
                <Icon name="chevron" size={17} />
              </button>
              <button onClick={manualLoad}>
                <Icon name="refresh" />
                <span>
                  <strong>读取手动存档</strong>
                  <small>将当前进度恢复到上次手动保存的位置</small>
                </span>
                <Icon name="chevron" size={17} />
              </button>
              <button onClick={exportSave}>
                <Icon name="download" />
                <span>
                  <strong>导出存档</strong>
                  <small>下载 JSON 文件，便于备份和跨浏览器恢复</small>
                </span>
                <Icon name="chevron" size={17} />
              </button>
              <button onClick={() => fileInput.current?.click()}>
                <Icon name="upload" />
                <span>
                  <strong>导入存档</strong>
                  <small>校验版本与完整性后，替换当前自动存档</small>
                </span>
                <Icon name="chevron" size={17} />
              </button>
              <button onClick={copySeed}>
                <Icon name="copy" />
                <span>
                  <strong>分享市场种子</strong>
                  <small>{game.seed} · 同种子、同背景可以公平比较</small>
                </span>
                <Icon name="chevron" size={17} />
              </button>
              <button
                onClick={() => {
                  setModal(null);
                  setOnboarding(true);
                }}
              >
                <Icon name="plus" />
                <span>
                  <strong>开启新旅程</strong>
                  <small>重新选择背景与挑战模式，完成设置前不会替换进度</small>
                </span>
                <Icon name="chevron" size={17} />
              </button>
            </div>
            <p className="settings-note">
              存档存于当前浏览器。清除浏览器数据会删除本地进度，建议定期导出。游戏无外部
              AI 依赖，不上传你的回答。
            </p>
          </div>
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="求职没有唯一的正确路线"
          subtitle="在 30 天里，为自己做出值得的选择。"
          onClose={() => setModal(null)}
        >
          <div className="help-content">
            {[
              {
                number: "01",
                title: "管理你的日常",
                text: "每天 4 个时段。生活费 ¥80，隔夜恢复 28 精力。投递、调查、学习都需要时段，休息可恢复 30 精力。",
              },
              {
                number: "02",
                title: "先了解，再选择",
                text: "企业有真实问题、预算与偏好。调查每次消耗 1 时段、8 精力、¥90。简历中的具体职责和量化成果能改善筛选结果。",
              },
              {
                number: "03",
                title: "按时赴约，展示实力",
                text: "投递次日得到反馈，再预约面试。每场需要 2 时段、22 精力。首轮技术问答和算法，第二轮 Debug 和系统设计。每题有独立倒计时，超时会提交当前草稿。",
              },
              {
                number: "04",
                title: "谈清期待，双向选择",
                text: "两轮通过后获得 Offer，通常有 7 天回复期。可谈薪三轮、了解福利、协调入职。持续超预算会降低耐心。接受仅限一份，拒绝不合适的机会不会判负。",
              },
              {
                number: "05",
                title: "复盘之后，继续成长",
                text: "第 30 天结束生成完整报告与本地纪录。种子复现初始市场，后续变化取决于行动。代码与文本使用受限规则评价，不运行任意代码，不具备完整语义理解。",
              },
            ].map((item) => (
              <div key={item.number}>
                <span>{item.number}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {modal === "next" && game && (
        <Modal
          title={game.day === 30 ? "为这段旅程写下复盘" : "准备结束今天了吗？"}
          onClose={() => setModal(null)}
        >
          <div className="confirmation-content">
            <p>
              {game.day === 30
                ? "本次 30 天挑战即将结束，系统会保留你的 Offer、能力成长和面试报告，并记录本地成绩。"
                : `今天还有 ${todayCount} 场预约面试。结束今天后，这些面试会被记为缺席。请确认你的安排。`}
            </p>
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setModal(null)}
              >
                再看看今天
              </button>
              <button
                className="button primary"
                onClick={() => {
                  if (act({ type: "NEXT_DAY" })) setModal(null);
                }}
              >
                {game.day === 30 ? "生成求职报告" : "确认进入下一天"}
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
