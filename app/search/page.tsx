import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import {
  escapeLikePattern,
  SEARCH_RESULTS_PER_PAGE,
  type SearchPost,
} from "@/lib/search/posts";

import SearchResultList from "@/components/SearchResultList";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
  }>;
};

type DatabaseProfile = {
  id: string;
  nickname: string;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, page } = await searchParams;
  const keyword = typeof q === "string" ? q.trim().slice(0, 50) : "";

  const escapedKeyword = escapeLikePattern(keyword);

  const requestedPage = typeof page === "string" ? Number(page) : 1;

  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const rangeStart = (currentPage - 1) * SEARCH_RESULTS_PER_PAGE;

  const rangeEnd = rangeStart + SEARCH_RESULTS_PER_PAGE - 1;

  let searchResults: SearchPost[] = [];
  let totalSearchResultCount = 0;
  let hasSearchError = false;
  let hasNextPage = false;

  const authorNicknameById = new Map<string, string>();

  if (keyword !== "") {
    const supabase = await createClient();

    const { data, error, count } = await supabase
      .from("posts")
      .select("id, user_id, content, created_at", { count: "exact" })
      .eq("is_hidden", false)
      .ilike("content", `%${escapedKeyword}%`)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(rangeStart, rangeEnd);

    if (error) {
      console.error("기록 검색 실패:", error);
      hasSearchError = true;
    } else {
      searchResults = (data ?? []) as SearchPost[];
      totalSearchResultCount = count ?? 0;

      hasNextPage =
        currentPage * SEARCH_RESULTS_PER_PAGE < totalSearchResultCount;

      const authorIds = [
        ...new Set(
          searchResults
            .map((post) => post.user_id)
            .filter((id): id is string => id !== null),
        ),
      ];

      if (authorIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, nickname")
          .in("id", authorIds);

        if (profileError) {
          console.error("검색 결과 작성자 프로필 조회 실패:", profileError);
        } else {
          const databaseProfiles = (profileData ?? []) as DatabaseProfile[];

          databaseProfiles.forEach((profile) => {
            authorNicknameById.set(profile.id, profile.nickname);
          });
        }
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
      <section className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm text-gray-500 transition hover:text-emerald-600"
        >
          ← 기록 목록으로
        </Link>

        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">기록 검색</h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            기록 내용에 포함된 단어를 검색할 수 있습니다.
          </p>

          <form action="/search" method="get" className="mt-6 flex gap-2">
            <label htmlFor="search-keyword" className="sr-only">
              검색어
            </label>

            <input
              id="search-keyword"
              name="q"
              type="search"
              defaultValue={keyword}
              maxLength={50}
              required
              placeholder="검색어를 입력해 주세요."
              className="min-w-0 flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:border-emerald-400"
            />

            <button
              type="submit"
              className="shrink-0 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              검색
            </button>
          </form>
        </div>

        {hasSearchError ? (
          <div className="mt-6 rounded-2xl border bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-red-500">
              검색 결과를 불러오지 못했습니다. 다시 시도해 주세요.
            </p>
          </div>
        ) : keyword === "" ? (
          <div className="mt-6 rounded-2xl border bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-400">검색어를 입력해 주세요.</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="mt-6 rounded-2xl border bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-400">
              {currentPage === 1
                ? `“${keyword}”와 일치하는 기록이 없습니다.`
                : `${currentPage}페이지에는 검색 결과가 없습니다.`}
            </p>

            {currentPage > 1 && (
              <Link
                href={`/search?q=${encodeURIComponent(keyword)}&page=1`}
                className="mt-4 inline-block text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                첫 페이지로 돌아가기
              </Link>
            )}
          </div>
        ) : (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-600">
              “{keyword}” 검색 결과 총 {totalSearchResultCount}개
            </h2>

            <SearchResultList
              key={`${keyword}:${currentPage}`}
              keyword={keyword}
              currentPage={currentPage}
              initialHasMore={hasNextPage}
              initialPosts={searchResults.map((post) => ({
                ...post,
                author_nickname:
                  post.user_id !== null
                    ? (authorNicknameById.get(post.user_id) ??
                      "알 수 없는 사용자")
                    : "알 수 없는 사용자",
              }))}
            />
          </section>
        )}
      </section>
    </main>
  );
}
