import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

export default async function HumorArchivePage() {
  const supabase = await createClient();

  const { data: prompt, error } = await supabase
    .from("humor_prompts")
    .select("id, image_path, alt_text, ends_at")
    .lte("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <nav className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <Link href="/" className="text-gray-500 hover:text-emerald-600">
          하루 기록
        </Link>
        <Link href="/humor" className="font-semibold text-emerald-600">
          ← 유머 공간
        </Link>
      </nav>
      <h1 className="text-2xl font-bold">지난 회차</h1>

      {error ? (
        <p className="mt-6 text-red-500">지난 회차를 불러오지 못했습니다.</p>
      ) : !prompt || prompt.length === 0 ? (
        <p className="mt-6">아직 종료된 회차가 없습니다.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {prompt.map((prompt, index) => (
            <li key={prompt.id} className="rounded-xl border p-4">
              <div className="relative mb-4 h-56 w-full rounded-lg bg-gray-50 sm:h-64 sm:w-64">
                <Image
                  src={
                    supabase.storage
                      .from("humor-images")
                      .getPublicUrl(prompt.image_path).data.publicUrl
                  }
                  alt={prompt.alt_text}
                  fill
                  sizes="(max-width:640px) 100vw, 256px"
                  loading={index === 0 ? "eager" : "lazy"}
                  unoptimized
                  className="object-contain"
                />
              </div>

              <p>{prompt.alt_text}</p>
              <p className="mt-2 text-sm text-gray-500">
                종료 :{" "}
                {new Date(prompt.ends_at).toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}
              </p>
              <Link
                href={`/humor/archive/${prompt.id}`}
                className="mt-3 inline-block text-sm font-semibold text-emerald-600"
              >
                결과 보기 →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
