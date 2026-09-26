import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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

  const { data: prompt, error } = await supabase
    .from("humor_prompts")
    .select("id, image_path, alt_text, ends_at")
    .eq("id", promptId)
    .lte("ends_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    return <p className="p-6 text-red-500">회차를 불러오지 못했습니다.</p>;
  }

  if (prompt === null) {
    notFound();
  }

  const { data: captions, error: captionsError } = await supabase
    .from("humor_caption_feed")
    .select("id, content, author_nickname, total_score, rating_count")
    .eq("prompt_id", promptId)
    .order("total_score", { ascending: false })
    .order("created_at", { ascending: false });

  const bestCaption =
    captions?.find((caption) => caption.rating_count > 0) ?? null;

  const imageUrl = supabase.storage
    .from("humor-images")
    .getPublicUrl(prompt.image_path).data.publicUrl;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
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

      <div className="relative mt-6 h-80 rounded-xl bg-gray-50">
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
          <ol className="mt-4 space-y-3">
            {captions.map((caption, index) => (
              <li key={caption.id} className="rounded-xl border p-4">
                <p className="text-sm font-semibold text-emerald-600">
                  {index + 1}위 ·{" "}
                  {caption.author_nickname ?? "알 수 없는 참가자"}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words">
                  {caption.content}
                </p>
                <p className="mt-2 text-sm text-amber-600">
                  총점 {caption.total_score}점 · {caption.rating_count}명 평가
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
