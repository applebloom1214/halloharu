import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import AdminReportActions from "@/components/AdminReportAction";

type ReportedPost = {
  id: number;
  content: string;
  user_id: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  nickname: string;
};

type AdminReportsPageProps = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

type ReportFilter = "all" | "pending" | "resolved" | "dismissed";

const isReportFilter = (value: string): value is ReportFilter => {
  return (
    value === "all" ||
    value === "pending" ||
    value === "resolved" ||
    value === "dismissed"
  );
};

const REPORT_REASON_LABELS: Record<string, string> = {
  spam: "스팸",
  harassment: "괴롭힘",
  inappropriate: "부적절한 내용",
  other: "기타",
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: "검토 대기",
  resolved: "조치 완료",
  dismissed: "문제없음",
};

const REPORT_FILTER_OPTIONS = [
  {
    value: "all",
    label: "전체",
  },
  {
    value: "pending",
    label: "검토 대기",
  },
  {
    value: "resolved",
    label: "조치 완료",
  },
  {
    value: "dismissed",
    label: "문제없음",
  },
] as const;

const formatCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));

export default async function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  const { status } = await searchParams;

  const requestedStatus = typeof status === "string" ? status : "all";

  const selectedStatus: ReportFilter = isReportFilter(requestedStatus)
    ? requestedStatus
    : "all";
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();

  const currentUserId =
    typeof claimsData?.claims.sub === "string" ? claimsData.claims.sub : null;

  if (currentUserId === null) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
        <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">신고 관리</h1>

          <p className="mt-4 text-sm text-gray-500">
            관리자 로그인이 필요합니다.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block font-semibold text-emerald-600"
          >
            로그인하기 →
          </Link>
        </section>
      </main>
    );
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (adminError) {
    console.error("관리자 권한 확인 실패:", adminError);

    return (
      <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
        <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-red-500">
            관리자 권한을 확인하지 못했습니다.
          </p>
        </section>
      </main>
    );
  }

  if (admin === null) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
        <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">접근 권한 없음</h1>

          <p className="mt-4 text-sm text-gray-500">
            관리자만 신고 관리 페이지를 볼 수 있습니다.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block font-semibold text-emerald-600"
          >
            홈으로 돌아가기 →
          </Link>
        </section>
      </main>
    );
  }

  let reportsQuery = supabase
    .from("reports")
    .select("post_id, reporter_id, reason, created_at, status, reviewed_at");

  if (selectedStatus !== "all") {
    reportsQuery = reportsQuery.eq("status", selectedStatus);
  }

  const { data: reports, error: reportsError } = await reportsQuery.order(
    "created_at",
    { ascending: false },
  );

  if (reportsError) {
    console.error("신고 목록 조회 실패:", reportsError);

    return (
      <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
        <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-red-500">
            신고 목록을 불러오지 못했습니다.
          </p>
        </section>
      </main>
    );
  }

  const reportList = reports ?? [];
  const reportCount = reportList.length;

  const reportedPostIds = [
    ...new Set(reportList.map((report) => report.post_id)),
  ];

  const reportedPostById = new Map<number, ReportedPost>();

  if (reportedPostIds.length > 0) {
    const { data: postData, error: postsError } = await supabase
      .from("posts")
      .select("id, content, user_id, created_at")
      .in("id", reportedPostIds);

    if (postsError) {
      console.error("신고된 게시글 조회 실패:", postsError);

      return (
        <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
          <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-red-500">
              신고된 게시글을 불러오지 못했습니다.
            </p>
          </section>
        </main>
      );
    }

    const reportedPosts = (postData ?? []) as ReportedPost[];

    reportedPosts.forEach((post) => {
      reportedPostById.set(post.id, post);
    });
  }

  const postAuthorIds = [...reportedPostById.values()]
    .map((post) => post.user_id)
    .filter((id): id is string => id !== null);

  const repoterIds = reportList.map((report) => report.reporter_id);

  const profileIds = [...new Set([...postAuthorIds, ...repoterIds])];

  const nicknameByUserId = new Map<string, string>();

  if (profileIds.length > 0) {
    const { data: profileData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, nickname")
      .in("id", profileIds);

    if (profilesError) {
      console.error("신고 관련 프로필 조회 실패 :", profilesError);
    } else {
      const profiles = (profileData ?? []) as Profile[];

      profiles.forEach((profile) => {
        nicknameByUserId.set(profile.id, profile.nickname);
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
      <section className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm text-gray-500 transition hover:text-emerald-600"
        >
          ← 홈으로 돌아가기
        </Link>

        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">신고 관리</h1>

          <p className="mt-2 text-sm text-emerald-600">
            관리자 권한이 확인되었습니다.
          </p>

          <p className="mt-4 text-sm text-gray-600">
            현재 조회된 신고는 총 {reportCount}건입니다.
          </p>

          <nav
            aria-label="신고 상태 필터"
            className="mt-5 flex flex-wrap gap-2"
          >
            {REPORT_FILTER_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={
                  option.value === "all"
                    ? "/admin/reports"
                    : `/admin/reports?status=${option.value}`
                }
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selectedStatus === option.value
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </nav>

          {reportList.length === 0 ? (
            <div className="mt-6 rounded-2xl border bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-gray-400">
                현재 접수된 신고가 없습니다.
              </p>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {reportList.map((report) => {
                const reportedPost = reportedPostById.get(report.post_id);

                const postAuthorNickname =
                  reportedPost?.user_id !== null &&
                  reportedPost?.user_id !== undefined
                    ? (nicknameByUserId.get(reportedPost.user_id) ??
                      "알 수 없는 사용자")
                    : "알 수 없는 사용자";

                const reporterNickname =
                  nicknameByUserId.get(report.reporter_id) ??
                  "알 수 없는 사용자";

                return (
                  <li
                    key={`${report.post_id}-${report.reporter_id}`}
                    className="rounded-2xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-700">
                        게시글 #{report.post_id}
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">
                          {REPORT_REASON_LABELS[report.reason] ?? report.reason}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            report.status === "resolved"
                              ? "bg-emerald-50 text-emerald-600"
                              : report.status === "dismissed"
                                ? "bg-gray-100 text-gray-500"
                                : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {REPORT_STATUS_LABELS[report.status] ?? report.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                      <p>
                        작성자:{" "}
                        <span className="font-semibold text-gray-700">
                          {postAuthorNickname}
                        </span>
                      </p>

                      <p>
                        신고자:{" "}
                        <span className="font-semibold text-gray-700">
                          {reporterNickname}
                        </span>
                      </p>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                      {reportedPost?.content ??
                        "게시글 내용을 찾을 수 없습니다."}
                    </p>

                    <Link
                      href={`/posts/${report.post_id}`}
                      className="mt-4 inline-block text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                    >
                      게시글 상세 보기 →
                    </Link>

                    <time
                      dateTime={report.created_at}
                      className="mt-3 block text-xs text-gray-400"
                    >
                      접수: {formatCreatedAt(report.created_at)}
                    </time>

                    <AdminReportActions
                      postId={report.post_id}
                      reporterId={report.reporter_id}
                      currentStatus={report.status}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
