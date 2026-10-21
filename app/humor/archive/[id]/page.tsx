import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import HumorArchiveCaptionList from "@/components/HumorArchiveCaptionList";

import { HUMOR_CAPTION_PAGE_SIZE } from "@/lib/humor/captions";

type ArchiveDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ArchiveDetailPage({
  params,
}: ArchiveDetailPageProps) {
  const { id } = await params;
  const promptId = Number(id);

  if (!Number.isSafeInteger(promptId) || promptId <= 0) {
    notFound();
  }

  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();

  const currentUserId =
    typeof claimsData?.claims.sub === "string" ? claimsData.claims.sub : null;

  const { data: prompt, error } = await supabase
    .from("humor_prompts")
    .select("id, image_path, alt_text, ends_at, caption_feed_version")
    .eq("id", promptId)
    .lte("ends_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    return <p className="p-6 text-red-500">회차를 불러오지 못했습니다.</p>;
  }

  if (prompt === null) {
    notFound();
  }

  const { data: captionRows, error: captionsError } = await supabase
    .from("humor_caption_feed")
    .select(
      "id, content, created_at, is_own, author_nickname, total_score, rating_count, current_user_score",
    )
    .eq("prompt_id", promptId)
    .order("total_score", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(HUMOR_CAPTION_PAGE_SIZE + 1);

  const captions = (captionRows ?? []).slice(0, HUMOR_CAPTION_PAGE_SIZE);

  const initialHasMore = (captionRows?.length ?? 0) > HUMOR_CAPTION_PAGE_SIZE;

  const reportedCaptionIds = new Set<number>();

  if (currentUserId !== null && captions && captions.length > 0) {
    const { data: reports, error: reportsError } = await supabase
      .from("humor_caption_reports")
      .select("caption_id")
      .eq("reporter_id", currentUserId)
      .in(
        "caption_id",
        captions.map((caption) => caption.id),
      );

    if (reportsError) {
      console.error("지난 회차 신고 내역 조회 실패:", reportsError);
      throw new Error("지난 회차의 신고 상태를 불러오지 못했습니다.");
    } else {
      for (const report of reports ?? []) {
        reportedCaptionIds.add(report.caption_id);
      }
    }
  }

  const bestCaption =
    captions?.find((caption) => caption.rating_count > 0) ?? null;

  const imageUrl = supabase.storage
    .from("humor-images")
    .getPublicUrl(prompt.image_path).data.publicUrl;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/humor/archive" className="text-sm text-emerald-600">
        ← 지난 회차 목록
      </Link>

      <h1 className="mt-6 text-2xl font-bold">{prompt.alt_text}</h1>

      <p className="mt-2 text-sm text-gray-500">
        종료:{" "}
        {new Date(prompt.ends_at).toLocaleString("ko-KR", {
          timeZone: "Asia/Seoul",
        })}
      </p>

      <div className="relative mt-6 h-80 overflow-hidden rounded-2xl bg-gray-50 sm:h-[32rem]">
        <Image
          src={imageUrl}
          alt={prompt.alt_text}
          fill
          sizes="(max-width: 672px) 100vw, 672px"
          loading="eager"
          unoptimized
          className="object-contain"
        />
      </div>

      {!captionsError && bestCaption && (
        <section className="mt-8 rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="font-bold text-amber-600">🏆 BEST 1</h2>

          <p className="mt-4 whitespace-pre-wrap break-words text-xl font-bold">
            {bestCaption.content}
          </p>

          <p className="mt-3 text-sm text-gray-600">
            {bestCaption.author_nickname ?? "알 수 없는 참가자"} · 총점{" "}
            {bestCaption.total_score}점 · {bestCaption.rating_count}명 평가
          </p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-bold">최종 결과</h2>

        {captionsError ? (
          <p className="mt-4 text-red-500">한마디를 불러오지 못했습니다.</p>
        ) : !captions || captions.length === 0 ? (
          <p className="mt-4 text-gray-500">등록된 한마디가 없습니다.</p>
        ) : (
          <HumorArchiveCaptionList
            key={`${promptId}-${prompt.caption_feed_version}-${prompt.ends_at}-${currentUserId ?? "guest"}`}
            promptId={promptId}
            initialCaptions={captions}
            initialHasMore={initialHasMore}
            feedVersion={prompt.caption_feed_version}
            endsAt={prompt.ends_at}
            currentUserId={currentUserId}
            initialReportedCaptionIds={Array.from(reportedCaptionIds)}
          />
        )}
      </section>
    </main>
  );
}
