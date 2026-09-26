import Image from "next/image";
import Link from "next/link";
import HumorCaptionForm from "@/components/HumorCaptionForm";
import HumorRatingButtons from "@/components/HumorRatingButtons";
import HumorCaptionDeleteButton from "@/components/HumorCaptionDeleteButton";

import { createClient } from "@/lib/supabase/server";

type HumorCaption = {
  id: number;
  content: string;
  created_at: string;
  is_own: boolean;
  author_nickname: string | null;
  total_score: number;
  rating_count: number;
  current_user_score: number | null;
};

const formatEndsAt = (endsAt: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(endsAt));

const formatCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));

export default async function HumorPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: prompt, error: promptError } = await supabase
    .from("humor_prompts")
    .select("id, image_path, alt_text, starts_at, ends_at")
    .lte("starts_at", now)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (promptError) {
    console.error("현재 유머 주제 조회 실패:", promptError);

    return (
      <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
        <section className="mx-auto max-w-2xl rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-red-500">
            유머 주제를 불러오지 못했습니다.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block text-sm font-semibold text-emerald-600"
          >
            ← 하루 기록으로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  if (prompt === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-6 text-[#333333]">
        <section className="w-full max-w-lg rounded-3xl border bg-white px-8 py-14 text-center shadow-sm">
          <div className="text-5xl" aria-hidden="true">
            😄
          </div>

          <h1 className="mt-6 text-3xl font-bold">
            새로운 사진을 준비하고 있어요
          </h1>

          <p className="mt-4 leading-7 text-gray-500">
            다음 제목짓기 사진이 공개되면 다시 만나요.
          </p>

          <Link
            href="/"
            className="mt-8 inline-block rounded-full bg-emerald-400 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-500"
          >
            하루 기록으로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  const currentTime = new Date(now).getTime();
  const endsAtTime = new Date(prompt.ends_at).getTime();

  const isParticipationOpen = currentTime < endsAtTime;

  const imageUrl = supabase.storage
    .from("humor-images")
    .getPublicUrl(prompt.image_path).data.publicUrl;

  const { data: claimsData } = await supabase.auth.getClaims();

  const currentUserId =
    typeof claimsData?.claims.sub === "string" ? claimsData.claims.sub : null;

  const { data: captionData, error: captionsError } = await supabase
    .from("humor_caption_feed")
    .select(
      `id, 
      content, 
      created_at, 
      is_own,
      author_nickname,
      total_score,
      rating_count,
      current_user_score`,
    )
    .eq("prompt_id", prompt.id)
    .order("total_score", { ascending: true })
    .order("created_at", { ascending: true });

  const captionList = (captionData ?? []) as HumorCaption[];

  const sortedCaptionList = [...captionList].sort(
    (firstCaption, secondCaption) => {
      const scoreDifference =
        secondCaption.total_score - firstCaption.total_score;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return (
        new Date(secondCaption.created_at).getTime() -
        new Date(firstCaption.created_at).getTime()
      );
    },
  );

  const bestCaption =
    sortedCaptionList.find((caption) => caption.rating_count > 0) ?? null;

  const hasSubmittedCaption = captionList.some((caption) => caption.is_own);

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-4 py-10 text-[#333333] sm:px-6">
      <section className="mx-auto max-w-2xl">
        <nav className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-emerald-600"
          >
            ← 하루 기록
          </Link>

          <Link
            href="/humor/archive"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            지난 회차 →
          </Link>
        </nav>

        <div className="mt-6 rounded-3xl border bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-emerald-500">
            이번 주 제목짓기
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-800 sm:text-3xl">
            이 사진에 센스 있는 한마디를 남겨보세요
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            {isParticipationOpen
              ? `참여 종료 : ${formatEndsAt(prompt.ends_at)}`
              : "참여가 종료되어 최종 결과가 공개되었습니다."}
          </p>

          <div className="relative mt-6 h-80 overflow-hidden rounded-2xl bg-gray-50 sm:h-[32rem]">
            <Image
              src={imageUrl}
              alt={prompt.alt_text}
              fill
              unoptimized
              loading="eager"
              sizes="(max-width: 672px) 100vw, 672px"
              className="object-contain"
            />
          </div>

          <p className="mt-3 text-sm text-gray-400">{prompt.alt_text}</p>

          {captionsError ? (
            <p className="mt-8 rounded-2xl bg-red-50 px-4 py-5 text-center text-sm text-red-500">
              한마디 목록을 불러오지 못했습니다.
            </p>
          ) : (
            <>
              <section className="mt-6 rounded-2xl border-2 border-amber-200 bg-amber-50 px-5 py-6 text-center">
                {bestCaption === null ? (
                  <>
                    <p className="text-sm font-bold text-amber-600">BEST 1</p>

                    <p className="mt-3 text-sm text-gray-500">
                      첫 번째 평가를 기다리고 있어요.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-amber-600">
                      🏆 BEST 1
                    </p>

                    <p className="mt-4 whitespace-pre-wrap break-words text-xl font-bold leading-8 text-gray-800 sm:text-2xl">
                      {bestCaption.content}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
                      <span className="font-semibold text-gray-500">
                        {isParticipationOpen
                          ? bestCaption.is_own
                            ? "나의 한마디"
                            : "익명 참가자"
                          : (bestCaption.author_nickname ??
                            "알 수 없는 참가자")}
                      </span>

                      <span className="text-amber-600">
                        총점 {bestCaption.total_score}점 ·{" "}
                        {bestCaption.rating_count}명 평가
                      </span>
                    </div>
                  </>
                )}
              </section>

              {isParticipationOpen ? (
                <HumorCaptionForm
                  key={`${prompt.id}-${hasSubmittedCaption ? "submitted" : "open"}`}
                  promptId={prompt.id}
                  currentUserId={currentUserId}
                  hasSubmittedCaption={hasSubmittedCaption}
                />
              ) : (
                <div className="mt-8 rounded-2xl bg-gray-50 px-4 py-5 text-center">
                  <p className="text-sm text-gray-500">
                    한마디 등록과 별점 평가가 모두 종료되었습니다.
                  </p>
                </div>
              )}
              <section className="mt-8 border-t pt-8">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    등록된 한마디
                  </h2>

                  <span className="text-sm text-gray-400">
                    {captionList.length}개
                  </span>
                </div>

                {captionList.length === 0 ? (
                  <p className="mt-6 rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                    아직 등록된 한마디가 없습니다. 첫 번째 한마디를 남겨보세요.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {sortedCaptionList.map((caption) => (
                      <li
                        key={caption.id}
                        className="rounded-2xl border bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p
                            className={`text-sm font-semibold ${
                              caption.is_own
                                ? "text-emerald-600"
                                : "text-gray-500"
                            }`}
                          >
                            {isParticipationOpen
                              ? caption.is_own
                                ? "나의 한마디"
                                : "익명 참가자"
                              : (caption.author_nickname ??
                                "알 수 없는 참가자")}
                          </p>
                          <time
                            dateTime={caption.created_at}
                            className="shrink-0 text-xs text-gray-400"
                          >
                            {formatCreatedAt(caption.created_at)}
                          </time>
                        </div>

                        <p className="mt-3 whitespace-pre-wrap break-words text-gray-700">
                          {caption.content}
                        </p>

                        <p className="mt-3 text-sm font-medium text-amber-500">
                          총점 {caption.total_score}점 · {caption.rating_count}
                          명 평가
                        </p>

                        {isParticipationOpen && (
                          <HumorRatingButtons
                            captionId={caption.id}
                            currentUserId={currentUserId}
                            isOwn={caption.is_own}
                            initialScore={caption.current_user_score}
                          />
                        )}

                        {isParticipationOpen && caption.is_own && (
                          <HumorCaptionDeleteButton captionId={caption.id} />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
