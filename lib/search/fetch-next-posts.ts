import { createClient } from "@/lib/supabase/client";

import {
  escapeLikePattern,
  SEARCH_RESULTS_PER_PAGE,
  type SearchPost,
  type SearchResultPost,
} from "@/lib/search/posts";

type SearchCursor = Pick<SearchPost, "id" | "created_at">;

type FetchNextSearchPostsParams = {
  keyword: string;
  cursor: SearchCursor;
};

type DatabaseProfile = {
  id: string;
  nickname: string;
};

export async function fetchNextSearchPosts({
  keyword,
  cursor,
}: FetchNextSearchPostsParams) {
  const supabase = createClient();
  const escapedKeyword = escapeLikePattern(keyword);

  const { data, error } = await supabase
    .from("posts")
    .select("id, user_id, content, created_at")
    .eq("is_hidden", false)
    .ilike("content", `%${escapedKeyword}%`)
    .or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(SEARCH_RESULTS_PER_PAGE + 1);

  if (error) {
    console.error("추가 검색 결과 조회 실패:", error);
    throw new Error("검색 결과를 추가로 불러오지 못했습니다.");
  }

  const rows = (data ?? []) as SearchPost[];
  const nextPosts = rows.slice(0, SEARCH_RESULTS_PER_PAGE);

  const authorIds = [
    ...new Set(
      nextPosts
        .map((post) => post.user_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  const authorNicknameById = new Map<string, string>();

  if (authorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, nickname")
      .in("id", authorIds);

    if (profileError) {
      console.error("추가 검색 결과 작성자 조회 실패:", profileError);
      throw new Error("검색 결과의 작성자 정보를 불러오지 못했습니다.");
    }

    const databaseProfiles = (profiles ?? []) as DatabaseProfile[];

    databaseProfiles.forEach((profile) => {
      authorNicknameById.set(profile.id, profile.nickname);
    });
  }

  const posts: SearchResultPost[] = nextPosts.map((post) => ({
    ...post,
    author_nickname:
      post.user_id !== null
        ? (authorNicknameById.get(post.user_id) ?? "알 수 없는 사용자")
        : "알 수 없는 사용자",
  }));

  return {
    posts,
    hasMore: rows.length > SEARCH_RESULTS_PER_PAGE,
  };
}