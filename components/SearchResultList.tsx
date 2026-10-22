"use client";

import Link from "next/link";

import {
  SEARCH_RESULTS_PER_PAGE,
  type SearchResultPost,
} from "@/lib/search/posts";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchNextSearchPosts } from "@/lib/search/fetch-next-posts";

type SearchResultListProps = {
  keyword: string;
  currentPage: number;
  initialPosts: SearchResultPost[];
  initialHasMore: boolean;
};

const formatCreatedAt = (createdAt: string) => {
  const date = new Date(createdAt);
  const koreaDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  const year = koreaDate.getUTCFullYear();
  const month = koreaDate.getUTCMonth() + 1;
  const day = koreaDate.getUTCDate();
  const hour = koreaDate.getUTCHours();
  const minute = koreaDate.getUTCMinutes().toString().padStart(2, "0");

  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;

  return `${year}년 ${month}월 ${day}일 ${period} ${displayHour}:${minute}`;
};

export default function SearchResultList({
  keyword,
  currentPage,
  initialPosts,
  initialHasMore,
}: SearchResultListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const cursorRef = useRef<Pick<SearchResultPost, "id" | "created_at"> | null>(
    initialPosts[initialPosts.length - 1] ?? null,
  );

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isRequestPendingRef = useRef(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (!isMountedRef.current || isRequestPendingRef.current || !hasMore) {
      return;
    }

    const cursor = cursorRef.current;

    if (cursor === null) {
      return;
    }

    isRequestPendingRef.current = true;
    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const result = await fetchNextSearchPosts({
        keyword,
        cursor,
      });

      if (!isMountedRef.current) {
        return;
      }

      setPosts((previousPosts) => {
        const existingIds = new Set(previousPosts.map((post) => post.id));

        const newPosts = result.posts.filter(
          (post) => !existingIds.has(post.id),
        );

        return [...previousPosts, ...newPosts];
      });

      const lastPost = result.posts[result.posts.length - 1];

      if (lastPost) {
        cursorRef.current = {
          id: lastPost.id,
          created_at: lastPost.created_at,
        };
      }

      setHasMore(result.hasMore);
    } catch (error) {
      console.error("검색 결과 추가 로딩 실패:", error);

      if (isMountedRef.current) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "검색 결과를 추가로 불러오지 못했습니다.",
        );
      }
    } finally {
      isRequestPendingRef.current = false;

      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, keyword]);
  useEffect(() => {
    if (!hasMore || isLoadingMore || loadError !== null) {
      return;
    }

    const loadMoreElement = loadMoreRef.current;

    if (loadMoreElement === null) {
      return;
    }

    let isActive = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!isActive || !entry?.isIntersecting) {
          return;
        }

        observer.unobserve(loadMoreElement);
        void loadMore();
      },
      {
        rootMargin: "0px 0px 200px 0px",
        threshold: 0,
      },
    );

    observer.observe(loadMoreElement);

    return () => {
      isActive = false;
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadError, loadMore]);
  return (
    <>
      <ul className="mt-3 space-y-3">
        {posts.map((post, index) => (
          <li key={post.id}>
            <Link
              href={`/posts/${post.id}?q=${encodeURIComponent(keyword)}&page=${
                currentPage + Math.floor(index / SEARCH_RESULTS_PER_PAGE)
              }`}
              className="block rounded-2xl border bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 break-words text-sm font-semibold text-emerald-600">
                  {post.author_nickname}
                </p>

                <time
                  dateTime={post.created_at}
                  className="shrink-0 text-xs text-gray-400"
                >
                  {formatCreatedAt(post.created_at)}
                </time>
              </div>

              <p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                {post.content}
              </p>

              <p className="mt-3 text-right text-xs font-semibold text-emerald-600">
                상세 보기 →
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {loadError !== null ? (
        <div className="py-4 text-center">
          <p role="alert" className="text-sm text-red-500">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={isLoadingMore}
            className="mt-3 rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-500 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
          >
            {isLoadingMore ? "다시 불러오는 중..." : "다시 시도"}
          </button>
        </div>
      ) : hasMore ? (
        <div
          ref={loadMoreRef}
          className="flex min-h-12 items-center justify-center"
          aria-live="polite"
        >
          {isLoadingMore && (
            <p className="text-sm text-gray-400">검색 결과를 불러오는 중...</p>
          )}
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-gray-400">
          모든 검색 결과를 불러왔습니다.
        </p>
      )}
    </>
  );
}
