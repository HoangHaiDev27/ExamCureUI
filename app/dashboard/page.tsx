"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileCheck2,
  History,
  LayoutDashboard,
  Play,
  Target,
  TrendingUp,
  Trophy,
  FileText,
  Layers,
  HelpCircle,
  ArrowLeft,
  ArrowUpRight,
  Eye,
  ChevronRight,
  ChevronDown,
  Menu,
  Search,
  LogOut,
  MessageSquare,
  X,
} from "lucide-react";
import { getSchool } from "@/lib/schools";
import type { School } from "@/lib/types";
import { SchoolMark } from "@/components/SchoolMark";
import { Logo } from "@/components/Logo";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import {
  Avatar,
  DashboardAccountControl,
  ProgressChart,
  SectionEmpty,
  SectionError,
  SectionLoading,
  SettingToggle,
  Stat,
} from "@/components/dashboard/parts";
import { classify, TONE_COLOR } from "@/lib/grade";
import { logout, useAuth, useAuthReady, type AuthUser } from "@/lib/auth";
import { FPT_DASHBOARD_ACCENT } from "@/lib/theme";
import {
  difficultyLabel,
  formatFileSize,
  formatRelativeTime,
  getDashboard,
  listMyAttempts,
  listSchoolMaterials,
  listSubjectMaterials,
  listSubjects,
  listWrongAnswers,
  type AttemptItem,
  type CatalogSubject,
  type DifficultyCode,
} from "@/lib/catalog";
import {
  dedupeMaterials,
  examHref,
  fileTypeLabel,
  formatDate,
  groupByTerm,
  materialHref,
  resultHref,
  selectQuickAccess,
  trendDelta,
} from "@/lib/dashboard-helpers";
import { useResource } from "@/lib/useResource";
import { FeedbackPanel } from "@/components/dashboard/FeedbackPanel";

const NAV_GROUPS = [
  {
    title: "Tổng quan",
    items: [
      { id: "tong-quan", label: "Bảng điều khiển", icon: LayoutDashboard },
      { id: "mon-hoc", label: "Danh mục môn học", icon: BookOpen }
    ]
  },
  {
    title: "Ôn tập",
    items: [
      { id: "tai-lieu", label: "Đọc tài liệu", icon: FileText },
      { id: "flashcards", label: "Thẻ ghi nhớ", icon: Layers },
      { id: "trac-nghiem", label: "Luyện câu hỏi nhanh", icon: HelpCircle },
      { id: "so-tay-sai", label: "Sổ tay sửa sai", icon: BookOpen }
    ]
  },
  {
    title: "Thi thử",
    items: [
      { id: "de-thi", label: "Đề thi gợi ý", icon: FileCheck2 },
      { id: "lich-su", label: "Lịch sử thi", icon: History }
    ]
  },
  {
    title: "Hỗ trợ",
    items: [{ id: "gop-y", label: "Góp ý & báo lỗi", icon: MessageSquare }]
  }
];

const DASHBOARD_TAB_IDS = new Set(NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id)));

const capitalizeFirst = (value: string) => value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const DIFFICULTY_TONE: Record<DifficultyCode, string> = {
  basic: "var(--color-green)",
  medium: "#c98a06",
  advanced: "var(--color-danger)",
};

const examMeta = (s: CatalogSubject) =>
  [`${s.publishedExamCount} đề`, s.durationMin != null ? `${s.durationMin} phút` : null, difficultyLabel(s.difficulty)]
    .filter(Boolean)
    .join(" · ");

export default function DashboardPage() {
  const user = useAuth();
  const ready = useAuthReady();
  const { openAuth } = useAuthModal();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper-2">
        <div role="status" className="text-[14px] text-ink-3">Đang tải bảng điều khiển…</div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper-2 p-6">
        <div className="max-w-sm rounded-[14px] border border-line bg-paper p-8 text-center shadow-[var(--shadow-1)]">
          <Logo size={28} />
          <h1 className="mt-4 font-display text-[22px] font-semibold text-ink">Đăng nhập để xem bảng điều khiển</h1>
          <p className="mt-1.5 text-[14px] text-ink-2">Kết quả thi và tiến độ ôn tập của bạn được lưu theo tài khoản.</p>
          <button
            type="button"
            onClick={() => openAuth("login")}
            className="mt-5 inline-flex h-10 items-center rounded-[7px] bg-orange px-5 text-[13.5px] font-semibold text-white hover:bg-orange-dark"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }
  const home = user.schoolId ? getSchool(user.schoolId) : undefined;
  if (!home) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper-2 p-6">
        <p role="alert" className="text-[14px] text-danger">Tài khoản chưa được gắn với một trường hợp lệ.</p>
      </div>
    );
  }
  return <DashboardView user={user} home={home} />;
}

function DashboardView({ user, home }: { user: AuthUser; home: School }) {
  const router = useRouter();
  const schoolId = home.id;
  const [activeTab, setActiveTab] = useState("tong-quan");
  // Last tab that was not the feedback form, kept in sync for Back/Forward navigation too.
  const [tabBeforeFeedback, setTabBeforeFeedback] = useState("tong-quan");
  if (activeTab !== "gop-y" && tabBeforeFeedback !== activeTab) setTabBeforeFeedback(activeTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<"profile" | "settings">("profile");
  const [expandedTerms, setExpandedTerms] = useState<Set<number>>(() => new Set(Array.from({ length: 9 }, (_, index) => index + 1)));
  const [showDailyNudge, setShowDailyNudge] = useState(true);
  const [autoExpandTerms, setAutoExpandTerms] = useState(true);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuPanelRef = useRef<HTMLDivElement>(null);

  const mssv = user.mssv?.trim() || "—";
  const studentName = user.name;
  const avatarUrl = user.avatarUrl;

  // Dữ liệu từ API: tải ngay khi vào trang (môn học, tổng quan), các tab khác tải khi mở lần đầu.
  const loadSubjects = useCallback((signal: AbortSignal) => listSubjects(schoolId, { signal }), [schoolId]);
  const loadDashboard = useCallback((signal: AbortSignal) => getDashboard(signal), []);
  const loadSchoolMaterials = useCallback((signal: AbortSignal) => listSchoolMaterials(schoolId, signal), [schoolId]);
  const loadWrongAnswers = useCallback((signal: AbortSignal) => listWrongAnswers({ limit: 50, signal }), []);
  const loadHistory = useCallback((signal: AbortSignal) => listMyAttempts({ limit: 20, signal }), []);
  const subjectsRes = useResource(loadSubjects, true);
  const dashRes = useResource(loadDashboard, true);
  const materialsRes = useResource(loadSchoolMaterials, activeTab === "tai-lieu");
  const wrongRes = useResource(loadWrongAnswers, activeTab === "so-tay-sai");
  const historyRes = useResource(loadHistory, activeTab === "lich-su");

  const [moreHistory, setMoreHistory] = useState<{ items: AttemptItem[]; next: string | null | undefined }>({ items: [], next: undefined });
  const [moreLoading, setMoreLoading] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const historyItems = [...(historyRes.data?.attempts ?? []), ...moreHistory.items];
  const historyNext = moreHistory.next !== undefined ? moreHistory.next : (historyRes.data?.nextBefore ?? null);
  const loadMoreHistory = async () => {
    if (!historyNext) return;
    setMoreLoading(true);
    setMoreError(null);
    try {
      const page = await listMyAttempts({ limit: 20, before: historyNext });
      setMoreHistory((current) => ({ items: [...current.items, ...page.attempts], next: page.nextBefore }));
    } catch (reason) {
      setMoreError(reason instanceof Error ? reason.message : "Không thể tải thêm.");
    } finally {
      setMoreLoading(false);
    }
  };

  const subjects = useMemo(() => subjectsRes.data ?? [], [subjectsRes.data]);
  const dash = dashRes.data;
  const quickAccess = useMemo(() => selectQuickAccess(subjects, dash?.recentAttempts ?? []), [subjects, dash]);
  const examSubjects = useMemo(() => subjects.filter((s) => s.publishedExamCount > 0), [subjects]);

  const signOut = async () => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    setIsAccountModalOpen(false);
    try { await logout(); router.replace("/"); }
    catch { window.alert("Không thể đăng xuất. Vui lòng thử lại."); }
  };

  const givenName = studentName.trim().split(/\s+/).pop() || studentName;
  const latestAttempt = dash?.recentAttempts[0] ?? null;
  const trendScores = dash?.trend.map((point) => point.score) ?? [];
  const delta = trendDelta(trendScores);

  // States cho danh mục môn học
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [selectedSubjectForDocs, setSelectedSubjectForDocs] = useState<CatalogSubject | null>(null);

  useEffect(() => {
    const syncTabFromUrl = () => {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab && DASHBOARD_TAB_IDS.has(tab)) setActiveTab(tab);
    };

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    return () => window.removeEventListener("popstate", syncTabFromUrl);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileMenuPanelRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  // Cài đặt hiển thị của người dùng — đồng bộ từ localStorage, cả khi mount lẫn khi đổi ở tab khác.
  useEffect(() => {
    const syncPrefsFromStorage = () => {
      try {
        const nudgeOff = localStorage.getItem("examcure:pref-daily-nudge") === "0";
        setShowDailyNudge(!nudgeOff);
        const autoExpandOff = localStorage.getItem("examcure:pref-auto-expand-terms") === "0";
        setAutoExpandTerms(!autoExpandOff);
        setExpandedTerms(autoExpandOff ? new Set() : new Set(Array.from({ length: 9 }, (_, index) => index + 1)));
      } catch {
        /* localStorage không khả dụng — giữ mặc định */
      }
    };
    syncPrefsFromStorage();
    window.addEventListener("storage", syncPrefsFromStorage);
    return () => window.removeEventListener("storage", syncPrefsFromStorage);
  }, []);

  const toggleDailyNudge = () => {
    setShowDailyNudge((current) => {
      const next = !current;
      try { localStorage.setItem("examcure:pref-daily-nudge", next ? "1" : "0"); } catch {}
      return next;
    });
  };

  const toggleAutoExpandTerms = () => {
    setAutoExpandTerms((current) => {
      const next = !current;
      try { localStorage.setItem("examcure:pref-auto-expand-terms", next ? "1" : "0"); } catch {}
      setExpandedTerms(next ? new Set(Array.from({ length: 9 }, (_, index) => index + 1)) : new Set());
      return next;
    });
  };

  const navigateToTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    const url = new URL(window.location.href);
    if (tabId === "tong-quan") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tabId);
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const activeTabLabel = NAV_GROUPS.flatMap((group) => group.items).find((item) => item.id === activeTab)?.label || "Bảng điều khiển";

  const faculties = Array.from(new Set(subjects.map((s) => s.faculty).filter((f): f is string => Boolean(f))));
  const allTerms = Array.from(new Set(subjects.flatMap((s) => s.terms))).sort((a, b) => a - b);
  const filteredSubjects = subjects.filter((s) => {
    if (selectedFaculty && s.faculty !== selectedFaculty) return false;
    if (selectedTerm && !s.terms.includes(selectedTerm)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    }
    return true;
  });
  const { groups: termGroups, untermed } = groupByTerm(filteredSubjects.map((s) => s));
  const visibleTermGroups = selectedTerm ? termGroups.filter((g) => g.term === selectedTerm) : termGroups;

  const renderSubjectCard = (subject: CatalogSubject) => (
    <button
      key={subject.id}
      type="button"
      onClick={() => setSelectedSubjectForDocs(subject)}
      aria-label={`Xem giáo trình và slide môn ${subject.code} - ${subject.name}`}
      className="group flex min-h-[132px] flex-col justify-between rounded-[10px] border border-line bg-paper p-4 text-left shadow-[var(--shadow-1)] transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-orange hover:bg-orange-soft/30"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-2">{subject.code}</span>
          {subject.faculty && <span className="truncate text-[11px] font-medium text-ink-3">{subject.faculty}</span>}
        </div>
        <h3 className="mt-2 line-clamp-1 text-[14.5px] font-bold text-ink">{subject.name}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-ink-3">
          {subject.difficulty && (
            <>
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: DIFFICULTY_TONE[subject.difficulty] }} aria-hidden="true" />
              {difficultyLabel(subject.difficulty)} ·{" "}
            </>
          )}
          {subject.publishedExamCount} đề
          {subject.lastScore != null && <> · Gần nhất <span className="tnum font-semibold text-ink-2">{subject.lastScore.toFixed(1)}</span></>}
        </p>
      </div>

      <span className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-[12px] font-semibold text-ink-3 transition-colors group-hover:text-orange-dark">
        <FileText size={13} aria-hidden="true" /> Giáo trình &amp; Slide
        <ArrowUpRight size={14} className="ml-auto transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </button>
  );

  /** Một dòng môn thi (dùng ở "Tiếp tục ôn tập" và "Đề luyện tập"). */
  const renderExamRow = (s: CatalogSubject) => {
    const grade = s.lastScore != null ? classify(s.lastScore) : null;
    return (
      <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-paper-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-[5px] border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-2">{s.code}</span>
            <h3 className="truncate text-[14.5px] font-semibold text-ink">{s.name}</h3>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-3">
            {s.difficulty && <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: DIFFICULTY_TONE[s.difficulty] }} aria-hidden="true" />}
            {examMeta(s)}
          </p>
        </div>
        {grade && (
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <span className="text-[12px] text-ink-3">Gần nhất</span>
            <span className="tnum text-[14px] font-semibold" style={{ color: TONE_COLOR[grade.tone] }}>{s.lastScore?.toFixed(1)}</span>
          </span>
        )}
        <Link
          href={examHref(s.schoolCode, s.code)}
          className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-orange px-3.5 text-[13px] font-medium text-white shadow-sm hover:shadow transition-colors hover:bg-orange-dark"
        >
          <Play size={14} fill="currentColor" /> Vào thi
        </Link>
      </div>
    );
  };

  const subjectsGate = (render: () => React.ReactNode) =>
    subjectsRes.error && !subjectsRes.data
      ? <SectionError message={subjectsRes.error} onRetry={subjectsRes.reload} />
      : subjectsRes.loading ? <SectionLoading rows={4} /> : render();

  return (
    <div
      className="dashboard-shell flex min-h-screen w-full bg-paper-2"
      style={schoolId === "fptu" ? FPT_DASHBOARD_ACCENT : undefined}
    >
      {/* Sidebar */}
      <aside className="dashboard-sidebar sticky top-0 hidden h-[100dvh] w-[268px] self-start flex-none overflow-y-auto overscroll-contain border-r border-line bg-paper lg:block">
        <div className="flex min-h-full flex-col justify-between p-6">
          <div>
            {/* Logo and site title */}
            <div className="border-b border-line px-3 pb-5">
              <Logo size={28} />
              <p className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">Không gian ôn tập · {home.abbr}</p>
            </div>

            {/* Navigation Groups */}
            <nav className="mt-5 space-y-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1">
                  <h3 className="px-3 text-[10.5px] font-bold text-ink-3 uppercase tracking-wider">
                    {group.title}
                  </h3>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigateToTab(item.id)}
                          aria-current={isActive ? "page" : undefined}
                          className={`relative flex w-full items-center gap-3 rounded-[7px] px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200 ${
                            isActive
                              ? "translate-x-1 bg-orange-soft font-semibold text-orange-dark"
                              : "text-ink-2 hover:translate-x-0.5 hover:bg-paper-2 hover:text-ink"
                          }`}
                        >
                          {isActive && <span className="absolute -left-1 h-5 w-0.5 rounded-full bg-orange" aria-hidden="true" />}
                          <item.icon size={15} className={isActive ? "text-orange" : "text-ink-3"} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Quick access */}
            <div className="mt-5 border-t border-line pt-4 space-y-1">
              <h3 className="px-3 text-[10.5px] font-bold text-ink-3 uppercase tracking-wider">
                Truy cập nhanh
              </h3>
              <div className="space-y-0.5 max-h-[180px] overflow-y-auto pr-1">
                {subjectsRes.error && !subjectsRes.data ? (
                  <div className="px-3 py-1.5 text-[12px] text-danger">
                    Không tải được.{" "}
                    <button type="button" onClick={subjectsRes.reload} className="font-semibold underline">Thử lại</button>
                  </div>
                ) : subjectsRes.loading ? (
                  <p className="px-3 py-1.5 text-[12px] text-ink-3" role="status">Đang tải…</p>
                ) : quickAccess.length === 0 ? (
                  <p className="px-3 py-1.5 text-[12px] text-ink-3">Chưa có đề thi nào</p>
                ) : quickAccess.map((s) => (
                  <Link
                    key={s.id}
                    href={examHref(s.schoolCode, s.code)}
                    className="flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-[12.5px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink transition-colors w-full text-left"
                  >
                    <span className="shrink-0 rounded bg-paper-2 border border-line px-1.5 py-0.5 font-mono text-[9.5px] text-ink-3">{s.code}</span>
                    <span className="truncate text-ink-2">{s.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Info ở cuối Sidebar */}
          <div className="border-t border-line pt-4">
            <DashboardAccountControl
              name={studentName}
              mssv={mssv}
              avatarUrl={avatarUrl}
              menuOpen={isProfileMenuOpen}
              onToggle={() => setIsProfileMenuOpen((open) => !open)}
              onAccount={() => { setIsProfileMenuOpen(false); setAccountModalTab("profile"); setIsAccountModalOpen(true); }}
              onSignOut={signOut}
            />
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu điều hướng"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
          />
          <div
            ref={mobileMenuPanelRef}
            id="dashboard-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-mobile-menu-title"
            tabIndex={-1}
            className="dashboard-mobile-drawer absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col overflow-y-auto border-r border-line bg-paper p-5 shadow-2xl outline-none"
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <Logo size={25} />
                <h2 id="dashboard-mobile-menu-title" className="sr-only">Điều hướng dashboard</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  mobileMenuButtonRef.current?.focus();
                }}
                aria-label="Đóng menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[7px] text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <nav className="mt-5 space-y-5" aria-label="Điều hướng dashboard">
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1">
                  <h3 className="px-3 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">{group.title}</h3>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigateToTab(item.id)}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex w-full items-center gap-3 rounded-[7px] px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors ${
                            isActive
                              ? "bg-orange-soft font-semibold text-orange-dark"
                              : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                          }`}
                        >
                          <item.icon size={16} className={isActive ? "text-orange" : "text-ink-3"} aria-hidden="true" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto border-t border-line pt-4">
              <DashboardAccountControl
                name={studentName}
                mssv={`${mssv} · ${home.abbr}`}
                avatarUrl={avatarUrl}
                menuOpen={isProfileMenuOpen}
                onToggle={() => setIsProfileMenuOpen((open) => !open)}
                onAccount={() => { setIsProfileMenuOpen(false); setIsMobileMenuOpen(false); setAccountModalTab("profile"); setIsAccountModalOpen(true); }}
                onSignOut={signOut}
                trailing={<SchoolMark theme={home.theme} abbr={home.abbr} size={22} />}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="min-w-0 flex-1 px-5 py-5 lg:px-10 lg:py-8 xl:px-12">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 -mx-5 -mt-5 mb-6 flex items-center justify-between border-b border-line bg-paper-2/95 px-5 py-3.5 backdrop-blur-md lg:hidden">
          <div className="min-w-0">
            <Logo size={24} />
            <p className="mt-1 truncate text-[12px] font-medium text-ink-3">{activeTabLabel}</p>
          </div>
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isMobileMenuOpen}
            aria-controls="dashboard-mobile-menu"
            aria-label="Mở menu điều hướng"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-line bg-paper text-ink-2 shadow-[var(--shadow-1)] transition-colors hover:border-orange-border hover:bg-orange-soft hover:text-orange-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            <Menu size={19} aria-hidden="true" />
          </button>
        </div>

        {/* Overview Tab Content */}
        {activeTab === "tong-quan" && (
          <div className="dashboard-view space-y-6">
            {/* Hero greeting */}
            <div className="dashboard-title">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">
                Bảng điều khiển · {home.abbr}
              </span>
              <h1 className="mt-1 font-display text-[27px] font-semibold leading-tight text-ink">
                Chào {givenName}, tiếp tục ôn tập nhé
              </h1>
              {dash && (
                <p className="mt-1.5 text-[14.5px] text-ink-2">
                  {latestAttempt ? (
                    <>
                      Vừa đạt <strong className="tnum font-semibold text-ink">{latestAttempt.score.toFixed(1)}</strong> ở{" "}
                      <span className="font-mono text-[12.5px] text-ink-3">{latestAttempt.subjectCode ?? "—"}</span> · {formatRelativeTime(latestAttempt.submittedAt).toLowerCase()}.
                      {showDailyNudge && dash.weakestSubject && (
                        <> Ưu tiên ôn thêm <strong className="text-ink">{dash.weakestSubject.name}</strong> — điểm trung bình còn thấp ({dash.weakestSubject.averageScore.toFixed(1)}).</>
                      )}
                    </>
                  ) : (
                    <>Bạn chưa làm bài thi nào — hãy bắt đầu với một đề luyện tập để theo dõi tiến độ.</>
                  )}
                </p>
              )}
            </div>

            {/* Stat strip */}
            {dashRes.error && !dash ? (
              <div className="rounded-[12px] border border-line bg-paper"><SectionError message={dashRes.error} onRetry={dashRes.reload} /></div>
            ) : !dash ? (
              <div className="rounded-[12px] border border-line bg-paper"><SectionLoading rows={2} /></div>
            ) : (
              <div id="tong-quan" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Stat icon={<FileCheck2 size={18} />} value={String(dash.stats.totalAttempts)} label="Đề đã làm" sub={dash.stats.attemptsThisWeek > 0 ? `+${dash.stats.attemptsThisWeek} tuần này` : undefined} tone="ink" />
                <Stat icon={<Target size={18} />} value={dash.stats.averageScore != null ? dash.stats.averageScore.toFixed(1) : "—"} label="Điểm trung bình" sub="thang 10" tone="green" />
                <Stat icon={<BookOpen size={18} />} value={String(dash.stats.subjectsInProgress)} label="Môn đang luyện" tone="blue" />
                <Stat icon={<Trophy size={18} />} value={dash.stats.rankPercentile != null ? `Top ${dash.stats.rankPercentile}%` : "—"} label="Xếp hạng" sub="cùng trường" tone="orange" />
              </div>
            )}

            {/* Chart + History grid */}
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]" id="thong-ke">
              <section className="dashboard-panel rounded-[14px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold text-ink">Tiến bộ điểm số</h2>
                    <p className="text-[12.5px] text-ink-3">{trendScores.length > 0 ? `${trendScores.length} lần thi gần nhất` : "Các lần thi thử gần nhất"}</p>
                  </div>
                  {trendScores.length >= 2 && delta != null && (
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-[4px] px-2 py-1 text-[12px] font-bold text-white"
                        style={{ background: TONE_COLOR[classify(trendScores[trendScores.length - 1]).tone] }}
                      >
                        Xếp loại {classify(trendScores[trendScores.length - 1]).letter}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-medium ${delta >= 0 ? "bg-green-soft text-green" : "bg-danger-soft text-danger"}`}>
                        <TrendingUp size={14} /> {delta >= 0 ? "+" : ""}{delta.toFixed(1)} điểm
                      </span>
                    </div>
                  )}
                </div>
                {dashRes.error && !dash ? (
                  <SectionError message={dashRes.error} onRetry={dashRes.reload} />
                ) : !dash ? (
                  <SectionLoading rows={3} />
                ) : trendScores.length < 2 ? (
                  <SectionEmpty title="Làm ít nhất 2 bài thi để xem tiến độ" />
                ) : (
                  <ProgressChart data={trendScores} />
                )}
              </section>

              {/* Lịch sử thi (hợp với 1 trường) */}
              <section className="dashboard-panel rounded-[14px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]" id="lich-su">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-ink">Lịch sử thi gần đây</h2>
                    <p className="text-[12px] text-ink-3">Chỉ hiển thị dữ liệu của {home.abbr}</p>
                  </div>
                </div>
                {dashRes.error && !dash ? (
                  <SectionError message={dashRes.error} onRetry={dashRes.reload} />
                ) : !dash ? (
                  <SectionLoading rows={3} />
                ) : dash.recentAttempts.length === 0 ? (
                  <SectionEmpty title="Bạn chưa làm bài thi nào" />
                ) : (
                  <div className="mt-3 divide-y divide-line max-h-[220px] overflow-y-auto">
                    {dash.recentAttempts.map((h) => {
                      const grade = classify(h.score);
                      const href = resultHref(h);
                      const body = (
                        <>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-ink">
                              <span className="font-mono text-[11px] text-ink-3 bg-paper-2 border border-line rounded px-1 mr-1">{h.subjectCode ?? "—"}</span> {h.subjectName ?? ""}
                            </p>
                            <p className="truncate text-[11px] text-ink-3 mt-0.5">{h.examTitle ? `${h.examTitle} · ` : ""}{formatRelativeTime(h.submittedAt)}</p>
                          </div>
                          <span className="inline-flex items-center gap-1">
                            <span className="tnum text-[13.5px] font-semibold" style={{ color: TONE_COLOR[grade.tone] }}>{h.score.toFixed(1)}</span>
                            <span className="rounded-[4px] px-1 py-0.5 text-[9.5px] font-semibold text-white" style={{ background: TONE_COLOR[grade.tone] }}>{grade.letter}</span>
                          </span>
                        </>
                      );
                      return href ? (
                        <Link key={h.id} href={href} className="flex items-center gap-3 py-2.5 hover:bg-paper-2">{body}</Link>
                      ) : (
                        <div key={h.id} className="flex items-center gap-3 py-2.5">{body}</div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Suggested exams */}
            <section className="dashboard-panel overflow-hidden rounded-[14px] border border-line bg-paper shadow-[var(--shadow-1)]" id="mon">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Tiếp tục ôn tập</h2>
                  <p className="text-[12.5px] text-ink-3">Các học phần truy cập nhanh của {home.abbr}</p>
                </div>
                <button onClick={() => navigateToTab("de-thi")} className="text-[13px] font-medium text-orange hover:text-orange-dark">
                  Xem tất cả
                </button>
              </div>
              {subjectsGate(() =>
                quickAccess.length === 0
                  ? <SectionEmpty title="Chưa có đề thi nào" />
                  : <div className="divide-y divide-line">{quickAccess.map(renderExamRow)}</div>
              )}
            </section>
          </div>
        )}

        {/* Danh mục môn học */}
        {activeTab === "mon-hoc" && (
          <div className="dashboard-view space-y-6">
            {selectedSubjectForDocs ? (
              <div className="space-y-6">
                {/* Back button and subject info */}
                <div className="flex flex-wrap items-start gap-4 justify-between border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedSubjectForDocs(null)}
                      className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-[6px] border border-line bg-paper px-3 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
                    >
                      <ArrowLeft size={15} /> Quay lại
                    </button>
                    <div>
                      <h2 className="text-[20px] font-bold text-ink flex flex-wrap items-center gap-2">
                        <span className="rounded bg-paper-2 border border-line px-1.5 py-0.5 font-mono text-[13px] font-bold text-ink-2">
                          {selectedSubjectForDocs.code}
                        </span>
                        {selectedSubjectForDocs.name}
                      </h2>
                      {selectedSubjectForDocs.faculty && <p className="text-[12.5px] text-ink-3">Chuyên ngành: {selectedSubjectForDocs.faculty}</p>}
                    </div>
                  </div>
                </div>

                <SubjectMaterialsPanel key={selectedSubjectForDocs.id} subject={selectedSubjectForDocs} />
              </div>
            ) : (
              // Original list view
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="dashboard-title">
                    <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">{home.abbr} · Ôn tập</span>
                    <h1 className="mt-1 font-display text-[26px] font-semibold text-ink">Danh mục môn học</h1>
                    <p className="mt-1 text-[15px] text-ink-2">Tra cứu học phần và tài liệu ôn tập theo chương trình của {home.name}.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-[8px] border border-line bg-paper px-4 py-2 text-[13px] shadow-[var(--shadow-1)]">
                      <span className="tnum font-semibold text-ink">{subjects.length}</span> môn học
                    </div>
                    {termGroups.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedTerms(expandedTerms.size > 0 ? new Set() : new Set(allTerms))}
                        className="inline-flex h-9 items-center rounded-[8px] border border-line bg-paper px-3 text-[12.5px] font-semibold text-ink-2 transition-colors hover:border-orange-border hover:bg-orange-soft hover:text-orange-dark"
                      >
                        {expandedTerms.size > 0 ? "Thu gọn các kỳ" : "Mở tất cả kỳ"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter controls */}
                <div className="rounded-[9px] border border-line bg-paper p-3 shadow-[var(--shadow-1)]">
                  <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
                    <div className="relative min-w-0 flex-1">
                      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo tên hoặc mã môn..."
                        aria-label="Tìm môn học theo tên hoặc mã"
                        className="h-10 w-full rounded-[7px] border border-line bg-paper-2 pl-9 pr-3 text-[13.5px] outline-none placeholder:text-ink-3 focus:border-orange focus:bg-paper"
                      />
                    </div>

                    {allTerms.length > 0 && (
                      <select
                        value={selectedTerm ?? ""}
                        onChange={(e) => {
                          const term = e.target.value ? Number(e.target.value) : null;
                          setSelectedTerm(term);
                          if (term) setExpandedTerms((current) => new Set(current).add(term));
                        }}
                        aria-label="Lọc theo kỳ học"
                        className="h-10 rounded-[7px] border border-line bg-paper px-3 text-[13px] font-medium text-ink-2 outline-none focus:border-orange md:w-[145px]"
                      >
                        <option value="">Tất cả kỳ học</option>
                        {allTerms.map((term) => (
                          <option key={term} value={term}>Kỳ {term}</option>
                        ))}
                      </select>
                    )}

                    {faculties.length > 0 && (
                      <select
                        value={selectedFaculty ?? ""}
                        onChange={(e) => setSelectedFaculty(e.target.value || null)}
                        aria-label="Lọc theo nhóm môn"
                        className="h-10 rounded-[7px] border border-line bg-paper px-3 text-[13px] font-medium text-ink-2 outline-none focus:border-orange md:w-[210px]"
                      >
                        <option value="">Tất cả nhóm môn</option>
                        {faculties.map((faculty) => (
                          <option key={faculty} value={faculty}>{faculty}</option>
                        ))}
                      </select>
                    )}

                    {(searchQuery || selectedTerm || selectedFaculty) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedTerm(null);
                          setSelectedFaculty(null);
                        }}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[7px] border border-line bg-paper px-3 text-[12.5px] font-semibold text-ink-2 transition-colors hover:border-orange-border hover:bg-orange-soft hover:text-orange-dark"
                      >
                        <X size={14} aria-hidden="true" /> Xóa lọc
                      </button>
                    )}
                  </div>
                </div>

                {/* Subjects List */}
                {subjectsRes.error && !subjectsRes.data ? (
                  <div className="rounded-[10px] border border-line bg-paper"><SectionError message={subjectsRes.error} onRetry={subjectsRes.reload} /></div>
                ) : subjectsRes.loading ? (
                  <div className="rounded-[10px] border border-line bg-paper"><SectionLoading rows={4} /></div>
                ) : subjects.length === 0 ? (
                  <div className="rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
                    <SectionEmpty title="Trường của bạn chưa có môn học nào" />
                  </div>
                ) : filteredSubjects.length === 0 ? (
                  <div className="rounded-[10px] border border-line bg-paper p-10 text-center shadow-[var(--shadow-1)]">
                    <p className="text-[14.5px] font-medium text-ink">Không tìm thấy môn học nào phù hợp</p>
                    <p className="mt-1 text-[13px] text-ink-3">Thử thay đổi từ khóa tìm kiếm hoặc chọn chuyên ngành khác.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {visibleTermGroups.map((group) => (
                      <section key={group.term} aria-labelledby={`dashboard-term-${group.term}`}>
                        <button
                          type="button"
                          onClick={() => setExpandedTerms((current) => {
                            const next = new Set(current);
                            if (next.has(group.term)) next.delete(group.term);
                            else next.add(group.term);
                            return next;
                          })}
                          aria-expanded={expandedTerms.has(group.term)}
                          aria-controls={`dashboard-term-subjects-${group.term}`}
                          className="mb-3 flex w-full items-center gap-3 border-b-2 border-orange pb-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
                        >
                          <span className="tnum inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-orange text-[18px] font-bold text-white shadow-sm">
                            {group.term}
                          </span>
                          <span>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-orange-dark">Học kỳ</span>
                            <span id={`dashboard-term-${group.term}`} className="block font-display text-[22px] font-semibold leading-tight text-ink">
                              Kỳ {group.term}
                            </span>
                          </span>
                          <span className="tnum ml-auto rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-semibold text-ink-2">
                            {group.subjects.length} môn học
                          </span>
                          <ChevronDown
                            size={18}
                            aria-hidden="true"
                            className={`text-ink-3 transition-transform ${expandedTerms.has(group.term) ? "rotate-180" : ""}`}
                          />
                        </button>
                        {expandedTerms.has(group.term) && (
                          <div id={`dashboard-term-subjects-${group.term}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {group.subjects.map(renderSubjectCard)}
                          </div>
                        )}
                      </section>
                    ))}
                    {!selectedTerm && untermed.length > 0 && (
                      <section aria-label="Môn học chưa xếp kỳ">
                        {termGroups.length > 0 && (
                          <h2 className="mb-3 border-b-2 border-line pb-3 font-display text-[18px] font-semibold text-ink">Môn học khác</h2>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{untermed.map(renderSubjectCard)}</div>
                      </section>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Đọc tài liệu Tab Content */}
        {activeTab === "tai-lieu" && (
          <div className="dashboard-view space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="dashboard-title">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">{home.abbr} · Ôn tập</span>
                <h1 className="mt-1 font-display text-[26px] font-semibold text-ink">Tài liệu ôn tập</h1>
                <p className="mt-1 text-[15px] text-ink-2">Giáo trình và slide đang có trong ExamCure, sắp theo từng học phần.</p>
              </div>
              {materialsRes.data && (
                <span className="tnum rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-semibold text-ink-2">
                  {materialsRes.data.materials.length}{materialsRes.data.truncated ? "+" : ""} tài liệu
                </span>
              )}
            </div>

            {materialsRes.error && !materialsRes.data ? (
              <div className="rounded-[10px] border border-line bg-paper"><SectionError message={materialsRes.error} onRetry={materialsRes.reload} /></div>
            ) : materialsRes.loading ? (
              <div className="rounded-[10px] border border-line bg-paper"><SectionLoading rows={4} /></div>
            ) : (materialsRes.data?.materials ?? []).length === 0 ? (
              <div className="rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]"><SectionEmpty title="Chưa có tài liệu nào" /></div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {(materialsRes.data?.materials ?? []).map((doc) => {
                  const type = fileTypeLabel(doc.version.original_filename);
                  const typeTone = type === "PDF" ? "var(--color-danger)" : type === "PPTX" ? "var(--color-warning)" : "var(--color-blue)";
                  return (
                    <div key={doc.id} className="flex items-start gap-4 rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)] hover:border-orange transition-colors">
                      <div className="rounded-[6px] p-3" style={{ background: `color-mix(in srgb, ${typeTone} 12%, white)`, color: typeTone }}>
                        <FileText size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="rounded bg-paper-2 border border-line px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-3">{doc.subjectCode}</span>
                        <h3 className="mt-1.5 truncate text-[14.5px] font-semibold text-ink" title={doc.title}>{doc.title}</h3>
                        <p className="mt-1 text-[12px] text-ink-3">
                          <span className="font-semibold" style={{ color: typeTone }}>{type}</span> · {formatFileSize(doc.version.size_bytes)}
                        </p>
                        <Link
                          href={materialHref(schoolId, doc.subjectCode, doc.version.id)}
                          className="mt-3.5 inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-orange-border bg-orange-soft px-3 text-[12px] font-semibold text-orange-dark transition-colors hover:bg-orange hover:text-white"
                        >
                          <Eye size={13} aria-hidden="true" /> Mở tài liệu
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "flashcards" && (
          <ComingSoon abbr={home.abbr} title="Thẻ ghi nhớ" description="Ôn từ khóa và khái niệm bằng thẻ lật theo từng học phần." />
        )}

        {/* Luyện câu hỏi nhanh Tab Content */}
        {activeTab === "trac-nghiem" && (
          <ComingSoon abbr={home.abbr} title="Luyện câu hỏi trắc nghiệm nhanh" description="Trả lời các câu hỏi trắc nghiệm đơn lẻ có chấm điểm và giải thích tức thì." />
        )}

        {/* Sổ tay sửa sai Tab Content */}
        {activeTab === "so-tay-sai" && (
          <div className="dashboard-view space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="dashboard-title">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">{home.abbr} · Ôn tập</span>
                <h1 className="mt-1 font-display text-[26px] font-semibold text-ink">Sổ tay câu sai</h1>
                <p className="mt-1 text-[15px] text-ink-2">Xem lại những câu đã làm sai và lý do để tránh lặp lại lỗi cũ.</p>
              </div>
              {wrongRes.data && (
                <span className="tnum rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-semibold text-ink-2">
                  {wrongRes.data.length} câu cần xem lại
                </span>
              )}
            </div>

            {wrongRes.error && !wrongRes.data ? (
              <div className="rounded-[10px] border border-line bg-paper"><SectionError message={wrongRes.error} onRetry={wrongRes.reload} /></div>
            ) : wrongRes.loading ? (
              <div className="rounded-[10px] border border-line bg-paper"><SectionLoading rows={3} /></div>
            ) : (wrongRes.data ?? []).length === 0 ? (
              <div className="rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]"><SectionEmpty title="Chưa có câu sai nào" /></div>
            ) : (
              <div className="space-y-4">
                {(wrongRes.data ?? []).map((q) => (
                  <div key={q.questionId} className="rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)] space-y-3.5">
                    <div className="flex items-center justify-between border-b border-line pb-2.5">
                      <span className="font-mono text-[11px] font-bold text-orange bg-orange-soft border border-orange-border px-1.5 py-0.5 rounded">{q.subjectCode ?? "—"}</span>
                      <span className="text-[12px] text-ink-3">{q.subjectName}</span>
                    </div>

                    <p className="text-[15px] font-semibold text-ink leading-relaxed">
                      {q.prompt}
                    </p>

                    <div className="grid gap-2 text-[13px] md:grid-cols-2">
                      <div className="rounded-[6px] bg-danger-soft p-3 text-danger border border-danger-soft">
                        <span className="block text-[10.5px] font-bold uppercase tracking-wider opacity-85">Câu bạn chọn:</span>
                        <p className="mt-0.5 font-medium">{q.yourAnswer ?? "Bỏ trống"}</p>
                      </div>
                      <div className="rounded-[6px] bg-green-soft p-3 text-green border border-green-soft">
                        <span className="block text-[10.5px] font-bold uppercase tracking-wider opacity-85">Đáp án đúng:</span>
                        <p className="mt-0.5 font-medium">{q.correctAnswer ?? "—"}</p>
                      </div>
                    </div>

                    {q.explanation && (
                      <div className="rounded-[6px] bg-paper-2 p-3.5 border border-line text-[13px] text-ink-2 leading-relaxed">
                        <strong className="text-ink font-semibold block mb-0.5">Vì sao đáp án này đúng:</strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Đề thi gợi ý Tab Content */}
        {activeTab === "de-thi" && (
          <div className="dashboard-view space-y-6">
            <div className="dashboard-title">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">{home.abbr} · Thi thử</span>
              <h1 className="mt-1 font-display text-[26px] font-semibold text-ink">Đề luyện tập</h1>
              <p className="mt-1 text-[15px] text-ink-2">Toàn bộ học phần có đề luyện thi thử theo thời gian, mô phỏng đúng phần mềm thi của {home.abbr}.</p>
            </div>

            <section className="rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Toàn bộ học phần</h2>
                  {subjectsRes.data && <p className="text-[12.5px] text-ink-3">{examSubjects.length} học phần có đề luyện thi</p>}
                </div>
              </div>
              {subjectsGate(() =>
                examSubjects.length === 0
                  ? <SectionEmpty title="Chưa có đề thi nào — đề sẽ xuất hiện khi giảng viên/admin xuất bản" />
                  : <div className="divide-y divide-line">{examSubjects.map(renderExamRow)}</div>
              )}
            </section>
          </div>
        )}

        {/* Góp ý & báo lỗi Tab Content */}
        {activeTab === "gop-y" && <FeedbackPanel previousTab={tabBeforeFeedback} />}

        {/* Lịch sử thi Tab Content */}
        {activeTab === "lich-su" && (
          <div className="dashboard-view space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="dashboard-title">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">{home.abbr} · Thi thử</span>
                <h1 className="mt-1 font-display text-[26px] font-semibold text-ink">Lịch sử thi gần đây</h1>
                <p className="mt-1 text-[15px] text-ink-2">Kết quả thi thử và lưu trữ bài làm của bạn tại {home.name}.</p>
              </div>
              {historyRes.data && (
                <span className="tnum rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-semibold text-ink-2">
                  {historyItems.length} lượt thi{historyNext ? "+" : ""}
                </span>
              )}
            </div>

            <section className="rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
              {historyRes.error && !historyRes.data ? (
                <SectionError message={historyRes.error} onRetry={historyRes.reload} />
              ) : historyRes.loading ? (
                <SectionLoading rows={4} />
              ) : historyItems.length === 0 ? (
                <SectionEmpty title="Bạn chưa làm bài thi nào" />
              ) : (
                <>
                  <div className="divide-y divide-line">
                    {historyItems.map((h) => {
                      const grade = classify(h.score);
                      const href = resultHref(h);
                      const body = (
                        <>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded-[5px] border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-2">{h.subjectCode ?? "—"}</span>
                              <h3 className="truncate text-[14.5px] font-semibold text-ink">{h.subjectName ?? ""}</h3>
                            </div>
                            <p className="mt-0.5 text-[12.5px] text-ink-3">{h.examTitle ? `${h.examTitle} · ` : ""}{formatRelativeTime(h.submittedAt)}</p>
                          </div>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="tnum text-[15px] font-semibold" style={{ color: TONE_COLOR[grade.tone] }}>{h.score.toFixed(1)}</span>
                            <span className="rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: TONE_COLOR[grade.tone] }}>{grade.letter}</span>
                          </span>
                        </>
                      );
                      return href ? (
                        <Link key={h.id} href={href} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper-2">{body}</Link>
                      ) : (
                        <div key={h.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper-2">{body}</div>
                      );
                    })}
                  </div>
                  {(historyNext || moreError) && (
                    <div className="flex flex-col items-center gap-2 border-t border-line p-4">
                      {moreError && <p role="alert" className="text-[13px] text-danger">{moreError}</p>}
                      <button
                        type="button"
                        onClick={() => void loadMoreHistory()}
                        disabled={moreLoading || !historyNext}
                        className="inline-flex h-9 items-center rounded-[6px] border border-line bg-paper px-4 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-paper-2 disabled:opacity-50"
                      >
                        {moreLoading ? "Đang tải…" : moreError ? "Thử lại" : "Xem thêm"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}

      </main>

      {isAccountModalOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="presentation">
          <button type="button" aria-label="Đóng thông tin tài khoản" onClick={() => setIsAccountModalOpen(false)} className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
          <section role="dialog" aria-modal="true" aria-labelledby="account-modal-title" className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-[14px] border border-line bg-paper shadow-2xl">
            <div className="flex items-start justify-between gap-4 p-6 pb-0">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-orange">Tài khoản</p>
                <h2 id="account-modal-title" className="mt-1 text-[21px] font-bold text-ink">Thông tin tài khoản</h2>
              </div>
              <button type="button" onClick={() => setIsAccountModalOpen(false)} aria-label="Đóng" className="grid h-9 w-9 shrink-0 place-items-center rounded-[7px] text-ink-3 hover:bg-paper-2 hover:text-ink"><X size={18} /></button>
            </div>

            <div className="mt-5 flex items-center gap-4 px-6">
              <Avatar size={58} name={studentName} avatarUrl={avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-[17px] font-semibold text-ink">{studentName}</p>
                <p className="truncate text-[13px] text-ink-3">{user.email || "Chưa có email"}</p>
              </div>
            </div>

            <div className="mt-5 flex gap-5 border-b border-line px-6" role="tablist" aria-label="Mục tài khoản">
              <button
                type="button"
                role="tab"
                aria-selected={accountModalTab === "profile"}
                onClick={() => setAccountModalTab("profile")}
                className={`-mb-px border-b-2 pb-3 text-[13.5px] font-semibold transition-colors ${accountModalTab === "profile" ? "border-orange text-orange-dark" : "border-transparent text-ink-3 hover:text-ink"}`}
              >
                Hồ sơ
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={accountModalTab === "settings"}
                onClick={() => setAccountModalTab("settings")}
                className={`-mb-px border-b-2 pb-3 text-[13.5px] font-semibold transition-colors ${accountModalTab === "settings" ? "border-orange text-orange-dark" : "border-transparent text-ink-3 hover:text-ink"}`}
              >
                Cài đặt
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {accountModalTab === "profile" ? (
                <div className="space-y-5">
                  <dl className="divide-y divide-line rounded-[10px] border border-line px-4">
                    {[
                      ["Mã sinh viên", mssv],
                      ["Trường", home.name],
                      ["Khối ngành", home.field],
                      ["Khu vực", home.city],
                      ["Vai trò", capitalizeFirst(user.role || "student")],
                      ["Phần mềm thi mô phỏng", home.theme.systemName],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4 py-3">
                        <dt className="text-[13px] text-ink-3">{label}</dt>
                        <dd className="truncate text-right text-[13px] font-semibold text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">Tổng quan học tập</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="rounded-[9px] border border-line bg-paper-2 p-3 text-center">
                        <p className="tnum font-display text-[19px] font-semibold text-green">{dash?.stats.averageScore != null ? dash.stats.averageScore.toFixed(1) : "—"}</p>
                        <p className="mt-0.5 text-[11px] text-ink-3">Điểm TB</p>
                      </div>
                      <div className="rounded-[9px] border border-line bg-paper-2 p-3 text-center">
                        <p className="tnum font-display text-[19px] font-semibold text-ink">{dash ? dash.stats.totalAttempts : "—"}</p>
                        <p className="mt-0.5 text-[11px] text-ink-3">Đề đã làm</p>
                      </div>
                      <div className="rounded-[9px] border border-line bg-paper-2 p-3 text-center">
                        <p className="tnum font-display text-[19px] font-semibold text-blue">{dash ? dash.stats.subjectsInProgress : "—"}</p>
                        <p className="mt-0.5 text-[11px] text-ink-3">Môn đang luyện</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <SettingToggle
                      label="Nhắc ôn tập trên bảng điều khiển"
                      description="Hiển thị gợi ý môn cần ôn thêm ở đầu tab Tổng quan."
                      checked={showDailyNudge}
                      onChange={toggleDailyNudge}
                    />
                    <SettingToggle
                      label="Tự động mở tất cả kỳ học"
                      description="Mở sẵn toàn bộ 9 kỳ khi vào Danh mục môn học, thay vì thu gọn."
                      checked={autoExpandTerms}
                      onChange={toggleAutoExpandTerms}
                    />
                  </div>

                  <div className="space-y-2 border-t border-line pt-4">
                    <Link
                      href="/quen-mat-khau"
                      onClick={() => setIsAccountModalOpen(false)}
                      className="flex items-center justify-between rounded-[8px] border border-line px-3.5 py-3 text-[13.5px] font-medium text-ink-2 transition-colors hover:border-orange-border hover:bg-orange-soft/30 hover:text-orange-dark"
                    >
                      Đổi mật khẩu
                      <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={signOut}
                      className="flex w-full items-center justify-between rounded-[8px] border border-line px-3.5 py-3 text-[13.5px] font-medium text-danger transition-colors hover:bg-danger-soft"
                    >
                      Đăng xuất khỏi thiết bị này
                      <LogOut size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/** Tab chưa có dữ liệu thật — giữ tiêu đề, hiển thị trạng thái "Sắp ra mắt". */
function ComingSoon({ abbr, title, description }: { abbr: string; title: string; description: string }) {
  return (
    <div className="dashboard-view space-y-6">
      <div className="dashboard-title">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">{abbr} · Ôn tập</span>
        <h1 className="mt-1 font-display text-[26px] font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-[15px] text-ink-2">{description}</p>
      </div>
      <div className="rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
        <SectionEmpty title="Sắp ra mắt" hint="Tính năng này đang được hoàn thiện." />
      </div>
    </div>
  );
}

/** Giáo trình & slide của một môn: lấy từ API, mỗi tài liệu chỉ giữ phiên bản mới nhất. */
function SubjectMaterialsPanel({ subject }: { subject: CatalogSubject }) {
  const load = useCallback(
    async (signal: AbortSignal) => dedupeMaterials(await listSubjectMaterials(subject.schoolCode, subject.code, signal)),
    [subject.schoolCode, subject.code],
  );
  const res = useResource(load, true);
  return (
    <div className="space-y-4">
      <h3 className="text-[16px] font-bold text-ink">Giáo trình & Slide bài giảng</h3>
      {res.error && !res.data ? (
        <div className="rounded-[10px] border border-line bg-paper"><SectionError message={res.error} onRetry={res.reload} /></div>
      ) : res.loading ? (
        <div className="rounded-[10px] border border-line bg-paper"><SectionLoading rows={3} /></div>
      ) : (res.data ?? []).length === 0 ? (
        <div className="rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]"><SectionEmpty title="Môn này chưa có tài liệu" /></div>
      ) : (
        <div className="grid gap-4">
          {(res.data ?? []).map((m) => (
            <div key={m.id} className="rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)] hover:border-orange transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="rounded-[6px] bg-orange-soft p-3 text-orange shrink-0">
                  <Layers size={22} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-ink">{m.title}</h4>
                  {m.description && <p className="mt-1 text-[12.5px] text-ink-2">{m.description}</p>}
                  <p className="mt-1 text-[12.5px] text-ink-3">
                    <span className="block">{m.version.slide_count} slide · {formatFileSize(m.version.size_bytes)} · Cập nhật {formatDate(m.version.processed_at || m.createdAt)}</span>
                    <span className="mt-0.5 block font-semibold text-orange">{fileTypeLabel(m.version.original_filename)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center sm:self-start md:self-auto">
                <Link
                  href={materialHref(subject.schoolCode, subject.code, m.version.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-orange px-4 text-[13px] font-semibold text-white hover:bg-orange-dark transition-colors"
                >
                  <Eye size={14} /> Xem trực tiếp
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
