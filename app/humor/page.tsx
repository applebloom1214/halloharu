import Image from "next/image";
import Link from "next/link";
import HumorCaptionForm from "@/components/HumorCaptionForm";

import { createClient } from "@/lib/supabase/server";

type HumorCaption = {
  id: number;
  content: string;
  created_at: string;
  is_own : boolean;
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
    .gt("ends_at", now)
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

  const imageUrl = supabase.storage
    .from("humor-images")
    .getPublicUrl(prompt.image_path).data.publicUrl;

  const { data: claimsData } = await supabase.auth.getClaims();

  const currentUserId =
    typeof claimsData?.claims.sub === "string" ? claimsData.claims.sub : null;

  const { data: captionData, error: captionsError } = await supabase
    .from("humor_caption_feed")
    .select("id, content, created_at, is_own")
    .eq("prompt_id", prompt.id)
    .order("created_at", { ascending: true });

  const captionList = (captionData ?? []) as HumorCaption[];

  const hasSubmittedCaption =
    captionList.some((caption) => caption.is_own,);

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-4 py-10 text-[#333333] sm:px-6">
      <section className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm text-gray-500 transition hover:text-emerald-600"
        >
          ← 하루 기록으로 돌아가기
        </Link>

        <div className="mt-6 rounded-3xl border bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-emerald-500">
            이번 주 제목짓기
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-800 sm:text-3xl">
            이 사진에 센스 있는 한마디를 남겨보세요
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            참여 마감: {formatEndsAt(prompt.ends_at)}
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
              <HumorCaptionForm
                promptId={prompt.id}
                currentUserId={currentUserId}
                hasSubmittedCaption={hasSubmittedCaption}
              />

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
                    {captionList.map((caption) => (
                      <li
                        key={caption.id}
                        className="rounded-2xl border bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-emerald-600">
                            익명 참가자
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
