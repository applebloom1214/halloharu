import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import AdminReportActions from "@/components/AdminReportAction";
import AdminHumorReportActions from "@/components/AdminHumorReportActions";
import AdminCommentReportActions from "@/components/AdminCommentReportActions";

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

type UnifiedReport = {
  kind: "post" | "comment" | "humor";
  targetId: number;
  reporterId: string;
  reason: string;
  status: string;
  createdAt: string;
};

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

  let commentReportQuery = supabase
    .from("comment_reports")
    .select("comment_id, reporter_id, reason, status, created_at");

  if (selectedStatus !== "all") {
    commentReportQuery = commentReportQuery.eq("status", selectedStatus);
  }

  const { data: commentReports, error: commentReportsError } =
    await commentReportQuery.order("created_at", { ascending: false });

  if (commentReportsError) {
    console.error("댓글 신고 목록 조회 실패 : ", commentReportsError);
    throw new Error("댓글 신고 목록을 불러오지 못했씁니다.");
  }

  const commentReportList = commentReports ?? [];

  let humorReportsQuery = supabase
    .from("humor_caption_reports")
    .select("caption_id, reporter_id, reason, status, created_at");

  if (selectedStatus !== "all") {
    humorReportsQuery = humorReportsQuery.eq("status", selectedStatus);
  }

  const { data: humorReports, error: humorReportsError } =
    await humorReportsQuery.order("created_at", { ascending: false });

  if (humorReportsError) {
    console.error("유머 한마디 신고 목록 조회 실패:", humorReportsError);
    throw new Error("유머 한마디 신고 목록을 불러오지 못했습니다.");
  }

  const humorReportList = humorReports ?? [];

  const reportedCaptionIds = [
    ...new Set(humorReportList.map((report) => report.caption_id)),
  ];

  const { data: reportedCaptions, error: reportedCaptionsError } =
    reportedCaptionIds.length > 0
      ? await supabase
          .from("humor_captions")
          .select("id, content")
          .in("id", reportedCaptionIds)
      : { data: [], error: null };

  if (reportedCaptionsError) {
    console.error("신고된 한마디 조회 실패 : ", reportedCaptionsError);
    throw new Error("신고된 한마디를 불러오지 못했습니다.");
  }

  const reportedCaptionById = new Map(
    (reportedCaptions ?? []).map((caption) => [caption.id, caption] as const),
  );

  const reportedCommentIds = [
    ...new Set(commentReportList.map((report) => report.comment_id)),
  ];

  const { data: reportedComments, error: reportedCommentsError } =
    reportedCommentIds.length > 0
      ? await supabase
          .from("comments")
          .select("id, post_id, content")
          .in("id", reportedCommentIds)
      : { data: [], error: null };

  if (reportedCommentsError) {
    console.error("신고된 댓글 조회 실패 : ", reportedCommentsError);
    throw new Error("신고된 댓글을 불러오지 못했습니다.");
  }

  const reportedCommentById = new Map(
    (reportedComments ?? []).map((comment) => [comment.id, comment] as const),
  );

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

  const unifiedReportList: UnifiedReport[] = [
    ...reportList.map((report) => ({
      kind: "post" as const,
      targetId: report.post_id,
      reporterId: report.reporter_id,
      reason: report.reason,
      status: report.status,
      createdAt: report.created_at,
    })),
    ...commentReportList.map((report) => ({
      kind: "comment" as const,
      targetId: report.comment_id,
      reporterId: report.reporter_id,
      reason: report.reason,
      status: report.status,
      createdAt: report.created_at,
    })),
    ...humorReportList.map((report) => ({
      kind: "humor" as const,
      targetId: report.caption_id,
      reporterId: report.reporter_id,
      reason: report.reason,
      status: report.status,
      createdAt: report.created_at,
    })),
  ].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );

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
            현재 조회된 게시글 신고는 총 {unifiedReportList.length}건입니다.
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

          {unifiedReportList.length === 0 ? (
            <p className="mt-6 text-sm text-gray-400">
              현재 조회된 신고가 없습니다.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {unifiedReportList.map((report) => {
                const post =
                  report.kind === "post"
                    ? reportedPostById.get(report.targetId)
                    : null;

                const comment =
                  report.kind === "comment"
                    ? reportedCommentById.get(report.targetId)
                    : null;

                const caption =
                  report.kind === "humor"
                    ? reportedCaptionById.get(report.targetId)
                    : null;

                const kindLabel =
                  report.kind === "post"
                    ? "게시글"
                    : report.kind === "comment"
                      ? "댓글"
                      : "유머 한마디";

                const content =
                  report.kind === "post"
                    ? (post?.content ?? "게시글 내용을 찾을 수 없습니다.")
                    : report.kind === "comment"
                      ? (comment?.content ?? "댓글 내용을 찾을 수 없습니다.")
                      : (caption?.content ?? "한마디 내용을 찾을 수 없습니다.");

                const detailHref =
                  report.kind === "post"
                    ? `/posts/${report.targetId}`
                    : comment
                      ? `/posts/${comment.post_id}`
                      : null;

                const postAuthorNickname = post?.user_id
                  ? (nicknameByUserId.get(post.user_id) ?? "알 수 없는 사용자")
                  : "알 수 없는 사용자";

                const reporterNickname =
                  nicknameByUserId.get(report.reporterId) ??
                  "알 수 없는 사용자";

                return (
                  <li
                    key={`${report.kind}:${report.targetId}:${report.reporterId}`}
                    className="rounded-2xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {kindLabel} #{report.targetId}
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">
                          {REPORT_REASON_LABELS[report.reason] ?? report.reason}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                          {REPORT_STATUS_LABELS[report.status] ?? report.status}
                        </span>
                      </div>
                    </div>

                    {report.kind === "post" && (
                      <p className="mt-3 text-xs text-gray-500">
                        작성자: {postAuthorNickname} · 신고자:{" "}
                        {reporterNickname}
                      </p>
                    )}

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                      {content}
                    </p>

                    {detailHref && (
                      <Link
                        href={detailHref}
                        className="mt-3 inline-block text-sm font-semibold text-emerald-600"
                      >
                        {report.kind === "post"
                          ? "게시글 상세 보기 →"
                          : "댓글이 달린 게시글 보기 →"}
                      </Link>
                    )}

                    <time
                      dateTime={report.createdAt}
                      className="mt-3 block text-xs text-gray-400"
                    >
                      접수: {formatCreatedAt(report.createdAt)}
                    </time>

                    {report.kind === "post" ? (
                      <AdminReportActions
                        postId={report.targetId}
                        reporterId={report.reporterId}
                        currentStatus={report.status}
                      />
                    ) : report.kind === "comment" ? (
                      <AdminCommentReportActions
                        commentId={report.targetId}
                        reporterId={report.reporterId}
                        currentStatus={report.status}
                      />
                    ) : (
                      <AdminHumorReportActions
                        captionId={report.targetId}
                        reporterId={report.reporterId}
                        currentStatus={report.status}
                      />
                    )}
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
