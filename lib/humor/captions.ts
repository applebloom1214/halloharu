import { createClient } from "@/lib/supabase/client";

export const HUMOR_CAPTION_PAGE_SIZE = 10;

export type HumorCaption = {
  id: number;
  content: string;
  created_at: string;
  is_own: boolean;
  author_nickname: string | null;
  total_score: number;
  rating_count: number;
  current_user_score: number | null;
};

export type HumorCaptionCursor = Pick<
  HumorCaption,
  "id" | "total_score" | "created_at"
>;

type FetchNextHumorCaptionsParams = {
  promptId: number;
  currentUserId: string | null;
  cursor: HumorCaptionCursor;
  expectedVersion: number;
  expectedEndsAt: string;
};

export async function fetchNextHumorCaptions({
  promptId,
  currentUserId,
  cursor,
  expectedVersion,
  expectedEndsAt,
}: FetchNextHumorCaptionsParams) {
  const supabase = createClient();

  const isFeedUnchanged = async () => {
    const { data: prompt, error } = await supabase
      .from("humor_prompts")
      .select("caption_feed_version, ends_at")
      .eq("id", promptId)
      .maybeSingle();

    if (error) {
      console.error("유머 한마디 변경 상태 조회 실패:", error);
      throw new Error("한마디 목록의 최신 상태를 확인하지 못했습니다.");
    }

    return (
      prompt !== null &&
      prompt.caption_feed_version === expectedVersion &&
      prompt.ends_at === expectedEndsAt
    );
  };

  if (!(await isFeedUnchanged())) {
    return { status: "changed" as const };
  }

  const { data, error } = await supabase
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
    .eq("prompt_id", promptId)
    .or(
      [
        `total_score.lt.${cursor.total_score}`,
        `and(total_score.eq.${cursor.total_score},created_at.lt.${cursor.created_at})`,
        `and(total_score.eq.${cursor.total_score},created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
      ].join(","),
    )
    .order("total_score", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(HUMOR_CAPTION_PAGE_SIZE + 1);

  if (error) {
    console.error("유머 한마디 추가 조회 실패:", error);
    throw new Error("한마디를 추가로 불러오지 못했습니다.");
  }

  const rows = (data ?? []) as HumorCaption[];
  const captions = rows.slice(0, HUMOR_CAPTION_PAGE_SIZE);

  let reportedCaptionIds: number[] = [];

  if (currentUserId !== null && captions.length > 0) {
    const { data: reports, error: reportsError } = await supabase
      .from("humor_caption_reports")
      .select("caption_id")
      .eq("reporter_id", currentUserId)
      .in(
        "caption_id",
        captions.map((caption) => caption.id),
      );

    if (reportsError) {
      console.error("유머 한마디 신고 상태 조회 실패:", reportsError);
      throw new Error("한마디의 신고 상태를 불러오지 못했습니다.");
    }

    reportedCaptionIds = (reports ?? []).map((report) => report.caption_id);
  }

  if (!(await isFeedUnchanged())) {
    return { status: "changed" as const };
  }

  return {
    status: "success" as const,
    captions,
    reportedCaptionIds,
    hasMore: rows.length > HUMOR_CAPTION_PAGE_SIZE,
  };
}