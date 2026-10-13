"use client";

import Image from "next/image";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type AuthorPost = {
  id: number;
  content: string;
  image_path: string | null;
  created_at: string;
};

type AuthorPostListProps = {
  userId: string;
  initialPosts: AuthorPost[];
  initialHasMore: boolean;
};

const POSTS_PER_PAGE = 10;

const formatCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));

export default function AuthorPostList({
  userId,
  initialPosts,
  initialHasMore,
}: AuthorPostListProps) {
  const [posts, setPosts] = useState<AuthorPost[]>(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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

    const lastPost = posts[posts.length - 1];

    if (!lastPost) {
      return;
    }

    isRequestPendingRef.current = true;
    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .select("id, content, image_path, created_at")
        .eq("user_id", userId)
        .eq("is_hidden", false)
        .or(
          `created_at.lt.${lastPost.created_at},and(created_at.eq.${lastPost.created_at},id.lt.${lastPost.id})`,
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(POSTS_PER_PAGE + 1);

      if (!isMountedRef.current) {
        return;
      }

      if (error) {
        throw error;
      }

      const fetchedPosts = (data ?? []) as AuthorPost[];
      const nextPosts = fetchedPosts.slice(0, POSTS_PER_PAGE);

      setPosts((previousPosts) => {
        const existingIds = new Set(previousPosts.map((post) => post.id));

        return [
          ...previousPosts,
          ...nextPosts.filter((post) => !existingIds.has(post.id)),
        ];
      });

      setHasMore(fetchedPosts.length > POSTS_PER_PAGE);
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      console.error("작성자 추가 기록 조회 실패:", error);
      setLoadError("추가 기록을 불러오지 못했습니다.");
    } finally {
      isRequestPendingRef.current = false;

      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, posts, userId]);

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
    <div className="space-y-3">
      {posts.map((post) => (
        <article key={post.id} className="rounded-2xl border bg-white p-4">
          <p className="whitespace-pre-wrap break-words text-gray-700">
            {post.content}
          </p>

          {post.image_path && (
            <div className="relative mt-4 h-72 overflow-hidden rounded-xl bg-gray-50 sm:h-95">
              <Image
                src={`/api/posts/${post.id}/image`}
                alt="게시글 첨부 사진"
                fill
                unoptimized
                sizes="(max-width: 672px) 100vw, 672px"
                className="object-contain"
              />
            </div>
          )}

          <time
            dateTime={post.created_at}
            className="mt-2 block text-xs text-gray-400"
          >
            {formatCreatedAt(post.created_at)}
          </time>
        </article>
      ))}
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
            다시 시도
          </button>
        </div>
      ) : hasMore ? (
        <div
          ref={loadMoreRef}
          className="flex min-h-12 items-center justify-center"
          aria-live="polite"
        >
          {isLoadingMore && (
            <p className="text-sm text-gray-400">
              기록을 불러오는 중...
            </p>
          )}
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-gray-400">
          모든 기록을 불러왔습니다.
        </p>
      )}
    </div>
  );
}
