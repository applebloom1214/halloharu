import Link from "next/link";

import HumorArchiveList, {
  type HumorArchivePrompt,
} from "@/components/HumorArchiveList";

import { createClient } from "@/lib/supabase/server";

const ARCHIVE_PAGE_SIZE = 10;

export default async function HumorArchivePage() {
  const supabase = await createClient();

  const archiveCutoff = new Date().toISOString();

    const { data: prompts, error } = await supabase
    .from("humor_prompts")
    .select("id, image_path, alt_text, ends_at")
    .lte("ends_at", archiveCutoff)
    .order("ends_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(ARCHIVE_PAGE_SIZE + 1);

  if (error) {
    console.error("지난 회차 조회 실패:", error);
    throw new Error("지난 회차를 불러오지 못했습니다.");
  }

  const fetchedPrompts = prompts ?? [];

  const initialHasMore = fetchedPrompts.length > ARCHIVE_PAGE_SIZE;

  const promptList: HumorArchivePrompt[] = fetchedPrompts
    .slice(0, ARCHIVE_PAGE_SIZE)
    .map((prompt) => ({
      id: prompt.id,
      imageUrl: supabase.storage
        .from("humor-images")
        .getPublicUrl(prompt.image_path).data.publicUrl,
      altText: prompt.alt_text,
      endsAt: prompt.ends_at,
    }));

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

      <HumorArchiveList
        key={archiveCutoff}
        initialPrompts={promptList}
        initialHasMore={initialHasMore}
        pageSize={ARCHIVE_PAGE_SIZE}
      />
    </main>
  );
}