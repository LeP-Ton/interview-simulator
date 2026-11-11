import { useEffect, useRef, type ReactNode } from "react";
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Coffee,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  Folder,
  GitBranch,
  Globe,
  GraduationCap,
  Heart,
  Inbox,
  Info,
  Layers3,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  MessageCircle,
  Minus,
  Monitor,
  MoreHorizontal,
  Network,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Terminal,
  Trash2,
  TrendingUp,
  Trophy,
  Upload,
  UserRound,
  UsersRound,
  Video,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

const icons = {
  dashboard: LayoutDashboard,
  market: BriefcaseBusiness,
  resume: FileText,
  calendar: CalendarDays,
  study: GraduationCap,
  offers: Inbox,
  report: ChartNoAxesCombined,
  settings: Settings2,
  clock: Clock3,
  energy: Zap,
  wallet: Wallet,
  arrow: ArrowRight,
  left: ArrowLeft,
  up: ArrowUpRight,
  down: ArrowDown,
  chevron: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  checked: CheckCheck,
  success: CheckCircle2,
  help: CircleHelp,
  info: Info,
  code: Code2,
  terminal: Terminal,
  debug: FileCode2,
  system: GitBranch,
  chat: MessageCircle,
  coffee: Coffee,
  users: UsersRound,
  user: UserRound,
  search: Search,
  filter: ListFilter,
  save: Save,
  copy: Copy,
  refresh: RefreshCw,
  download: Download,
  upload: Upload,
  external: ExternalLink,
  more: MoreHorizontal,
  lock: LockKeyhole,
  sparkles: Sparkles,
  star: Star,
  target: Target,
  trophy: Trophy,
  trend: TrendingUp,
  bell: Bell,
  video: Video,
  monitor: Monitor,
  maximize: Maximize2,
  send: Send,
  folder: Folder,
  book: BookOpen,
  database: Database,
  layers: Layers3,
  network: Network,
  globe: Globe,
  shield: ShieldCheck,
  activity: Activity,
  heart: Heart,
  trash: Trash2,
  loader: LoaderCircle,
} satisfies Record<string, LucideIcon>;
export type IconName = keyof typeof icons;
export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Component = icons[name as IconName] ?? icons.code;
  return (
    <Component
      size={size}
      strokeWidth={1.7}
      className={className}
      aria-hidden="true"
    />
  );
}
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <Icon name="terminal" size={24} />
      </span>
      <span>
        <strong>
          面试模拟器<span className="brand-dot">.</span>
        </strong>
        {!compact && <small>INTERVIEW SIMULATOR</small>}
      </span>
    </div>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Empty({
  icon = "inbox",
  title,
  text,
  children,
}: {
  icon?: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function Progress({
  value,
  tone = "green",
}: {
  value: number;
  tone?: string;
}) {
  return (
    <div className={`progress ${tone}`}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const items = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input, select, textarea, [tabindex="0"]',
          ) ?? [],
        );
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
      old?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            aria-label="关闭对话框"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
export function DeskIllustration() {
  return (
    <svg
      className="desk-art"
      viewBox="0 0 370 225"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="235" cy="105" r="91" fill="#D4DFC5" opacity=".55" />
      <path d="M48 193H348" stroke="#9AB59E" strokeWidth="2" />
      <rect
        x="87"
        y="27"
        width="221"
        height="143"
        rx="9"
        fill="#D7DFCC"
        stroke="#315D4C"
        strokeWidth="2"
      />
      <rect x="95" y="35" width="205" height="125" rx="4" fill="#1E483C" />
      <circle cx="106" cy="44" r="2.5" fill="#E3B485" />
      <circle cx="115" cy="44" r="2.5" fill="#B8CB99" />
      <circle cx="124" cy="44" r="2.5" fill="#77A58B" />
      <path
        d="M109 66L116 72L109 78M122 78H132"
        stroke="#D4E5AE"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <text x="110" y="101" fill="#E4EDDA" fontSize="13" fontFamily="monospace">
        Hello, next chapter.
      </text>
      <rect x="110" y="114" width="83" height="4" rx="2" fill="#749B81" />
      <rect x="110" y="125" width="117" height="4" rx="2" fill="#527E67" />
      <rect x="110" y="136" width="63" height="4" rx="2" fill="#527E67" />
      <path
        d="M185 171V189M207 171V189M169 192H223"
        stroke="#315D4C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="43"
        y="112"
        width="85"
        height="66"
        rx="5"
        transform="rotate(-9 43 112)"
        fill="#F4F0DC"
        stroke="#99AB8D"
      />
      <path
        d="M59 125L70 123M59 135L105 127M62 144L108 136M64 153L93 148"
        stroke="#9BAD91"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="37" y="171" width="96" height="13" rx="3" fill="#D1AE85" />
      <rect x="43" y="184" width="88" height="8" rx="2" fill="#EFE6CB" />
      <path d="M312 168V115" stroke="#4F795B" strokeWidth="2" />
      <path
        d="M312 149C292 148 292 130 296 121C310 123 315 135 312 149Z"
        fill="#73956A"
      />
      <path
        d="M313 137C332 135 337 117 331 111C316 113 309 125 313 137Z"
        fill="#567C55"
      />
      <path
        d="M312 125C299 116 299 100 306 95C319 102 320 116 312 125Z"
        fill="#90A77A"
      />
      <path d="M295 163H332L327 192H301L295 163Z" fill="#C69D74" />
      <path
        d="M291 163H336"
        stroke="#B18864"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M244 183H278L275 193H247L244 183Z" fill="#8FA88A" />
      <path
        d="M249 178L265 166"
        stroke="#A4B696"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M53 58L57 50L61 58L69 62L61 66L57 74L53 66L45 62L53 58Z"
        fill="#9AB18B"
      />
      <circle cx="326" cy="70" r="4" fill="#A8BC96" />
    </svg>
  );
}
export const money = (value: number) =>
  `¥${Math.round(value).toLocaleString("zh-CN")}`;
export const salary = (value: number) =>
  `${(value / 1000).toFixed(value % 1000 ? 1 : 0)}k`;
