"use client";

import Link from "next/link";
import { BookOpen, ClipboardCheck, FileQuestion, Users } from "lucide-react";
import { adminApi, fmtDate, fmtScore, type Overview } from "@/lib/admin";
import { Badge, Card, Empty, ErrorBanner, PageHeader, Spinner, Table, Td, useLoader } from "./ui";

export function OverviewPanel() {
  const { data, error, loading, reload } = useLoader(adminApi.overview, "overview");

  return (
    <>
      <PageHeader title="Tổng quan" description="Tình hình hệ thống thi thử theo thời gian thực." />
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {loading && !data && <Spinner />}
      {data && <OverviewBody d={data} />}
    </>
  );
}

function OverviewBody({ d }: { d: Overview }) {
  const tiles = [
    {
      label: "Người dùng",
      value: d.users.total,
      sub: `+${d.users.new7d} trong 7 ngày · ${d.users.admins} quản trị`,
      icon: Users,
      href: "/admin/nguoi-dung",
    },
    {
      label: "Trường · Học phần",
      value: `${d.catalog.schools} · ${d.catalog.subjects}`,
      sub: "Đang mở thi thử",
      icon: BookOpen,
      href: "/admin/hoc-phan",
    },
    {
      label: "Câu hỏi",
      value: d.catalog.questions,
      sub: "Trong ngân hàng đề",
      icon: FileQuestion,
      href: "/admin/cau-hoi",
    },
    {
      label: "Bài thi đã nộp",
      value: d.exams.total,
      sub: `${d.exams.last7d} trong 7 ngày · TB ${fmtScore(d.exams.avgScore)}/10`,
      icon: ClipboardCheck,
      href: "/admin/bai-thi",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ label, value, sub, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)] transition-colors hover:border-orange-border"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink-2">{label}</span>
              <Icon size={18} className="text-ink-3 transition-colors group-hover:text-orange" />
            </div>
            <p className="mt-2 text-[28px] font-bold tabular-nums text-ink">
              {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink-3">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold text-ink">Lượt nộp bài 14 ngày qua</h2>
            <span className="text-[12.5px] text-ink-3">{d.series.reduce((a, s) => a + s.count, 0)} lượt</span>
          </div>
          <DailyBars series={d.series} />
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-bold text-ink">Học phần được thi nhiều nhất</h2>
          {d.topSubjects.length === 0 ? (
            <Empty title="Chưa có lượt thi nào" />
          ) : (
            <ol className="mt-4 space-y-3.5">
              {d.topSubjects.map((s, i) => {
                const max = d.topSubjects[0].count;
                return (
                  <li key={s.id}>
                    <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                      <span className="min-w-0 truncate text-ink">
                        <span className="mr-2 text-ink-3 tabular-nums">{i + 1}.</span>
                        {s.name} <span className="text-ink-3">· {s.code}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-ink-2">
                        {s.count} lượt · TB {fmtScore(s.avgScore)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-paper-3">
                      <div className="h-full rounded-full bg-orange" style={{ width: `${(s.count / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h2 className="text-[15px] font-bold text-ink">Bài nộp gần đây</h2>
          <Link href="/admin/bai-thi" className="text-[13px] font-medium text-orange hover:underline">
            Xem tất cả
          </Link>
        </div>
        {d.recent.length === 0 ? (
          <Empty title="Chưa có bài nộp" hint="Khi sinh viên hoàn thành bài thi thử, bài nộp sẽ xuất hiện ở đây." />
        ) : (
          <Table head={["Sinh viên", "Học phần", "Điểm", "Đúng", "Thời điểm"]}>
            {d.recent.map((r) => (
              <tr key={r.id}>
                <Td>
                  <p className="font-medium text-ink">{r.user.fullName || r.user.email}</p>
                  <p className="text-[12.5px] text-ink-3">{r.user.email}</p>
                </Td>
                <Td>
                  {r.subject.name} <span className="text-ink-3">· {r.subject.code}</span>
                </Td>
                <Td>
                  <ScoreBadge score={r.score} grade={r.grade} />
                </Td>
                <Td className="tabular-nums text-ink-2">
                  {r.correct}/{r.total}
                </Td>
                <Td className="whitespace-nowrap text-ink-2">{fmtDate(r.createdAt, true)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

function DailyBars({ series }: { series: Overview["series"] }) {
  const max = Math.max(1, ...series.map((s) => s.count));
  return (
    <div className="mt-5">
      <div className="flex h-[180px] items-end gap-1.5" role="img" aria-label="Biểu đồ lượt nộp bài theo ngày">
        {series.map((s) => (
          <div key={s.date} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              className={`rounded-t-[4px] transition-colors ${s.count ? "bg-orange group-hover:bg-orange-dark" : "bg-paper-3"}`}
              style={{ height: s.count ? `${Math.max(6, (s.count / max) * 100)}%` : "3px" }}
            />
            <div className="pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-ink px-2.5 py-1.5 text-[12px] text-white group-hover:block">
              {s.date.slice(8)}/{s.date.slice(5, 7)}: {s.count} lượt
              {s.avgScore != null && ` · TB ${fmtScore(s.avgScore)}`}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 text-[11px] tabular-nums text-ink-3">
        {series.map((s, i) => (
          <span key={s.date} className="flex-1 text-center">
            {i % 2 === 0 ? `${s.date.slice(8)}/${s.date.slice(5, 7)}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ScoreBadge({ score, grade }: { score: number; grade: string }) {
  const tone = score >= 8 ? "green" : score >= 5 ? "blue" : score >= 4 ? "warning" : "danger";
  return (
    <Badge tone={tone}>
      {fmtScore(score)} · {grade}
    </Badge>
  );
}
