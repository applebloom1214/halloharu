import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import AdminHumorReportActions from "@/components/AdminHumorReportActions";

const REASON_LABELS: Record<string, string> = {
  spam: "스팸",
  harassment: "괴롭힘",
  inappropriate: "부적절한 내용",
  other: "기타",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "검토 대기",
  resolved: "조치 완료",
  dismissed: "문제없음",
};

export default async function AdminHumorReportsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  const currentUserId =
    typeof claimsData?.claims.sub === "string"
      ? claimsData.claims.sub
      : null;

  if (currentUserId === null) {
    return (
      <main className="w-full px-6 py-12">
        <p>관리자 로그인이 필요합니다.</p>
        <Link href="/login" className="text-emerald-600">
          로그인하기 →
        </Link>
      </main>
    );
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (adminError || admin === null) {
    return (
      <main className="w-full px-6 py-12">
        <p>
          {adminError
            ? "관리자 권한을 확인하지 못했습니다."
            : "관리자만 볼 수 있습니다."}
        </p>
      </main>
    );
  }

  const { data: reports, error: reportsError } = await supabase
    .from("humor_caption_reports")
    .select("caption_id, reporter_id, reason, status, created_at")
    .order("created_at", { ascending: false });

  const captionIds = [
    ...new Set((reports ?? []).map((report) => report.caption_id)),
  ];
  
  const {data : captions, error : captionsError} =
    captionIds.length > 0
        ? await supabase
            .from("humor_captions")
            .select("id, content")
            .in("id", captionIds)
        : {data : [], error:null};
        
  const captionContentById = new Map(
    (captions ?? []).map((caption) => [caption.id, caption.content] as const),
  );

  return (
    <main className="w-full px-6 py-12">
      <section className="mx-auto max-w-2xl">
        <Link href="/admin/humor" className="text-sm text-emerald-600">
          ← 유머 주제 관리
        </Link>

        <h1 className="mt-6 text-2xl font-bold">유머 한마디 신고 관리</h1>

        {reportsError || captionsError ? (
          <p className="mt-6 text-red-600">신고 목록을 불러오지 못했습니다.</p>
        ) : reports?.length === 0 ? (
          <p className="mt-6 text-gray-500">접수된 신고가 없습니다.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {reports?.map((report) => (
              <li
                key={`${report.caption_id}:${report.reporter_id}`}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <p className="font-semibold">한마디 #{report.caption_id}</p>
                <p className="mt-2 whitespace-pre-wrap">
                    {captionContentById.get(report.caption_id) ?? "한마디를 찾을 수 없습니다."}
                </p>
                <p className="mt-2 text-sm">
                  사유: {REASON_LABELS[report.reason] ?? report.reason}
                </p>
                <p className="text-sm">
                  상태: {STATUS_LABELS[report.status] ?? report.status}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {new Intl.DateTimeFormat("ko-KR", {
                    timeZone: "Asia/Seoul",
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(report.created_at))}
                </p>
                <AdminHumorReportActions
                  captionId={report.caption_id}
                  reporterId={report.reporter_id}
                  currentStatus={report.status}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}