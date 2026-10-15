"use client";

import Image from "next/image";
import Link from "next/link";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type HumorArchivePrompt = {
  id: number;
  imageUrl: string;
  altText: string;
  endsAt: string;
};

type HumorArchiveListProps = {
  initialPrompts: HumorArchivePrompt[];
  initialHasMore: boolean;
  pageSize: number;
};

const formatArchiveEndsAt = (endsAt: string): string => {
  const koreaTime = new Date(new Date(endsAt).getTime() + 9 * 60 * 60 * 1000);

  return koreaTime.toISOString().slice(0, 19).replace("T", " ");
};

export default function HumorArchiveList({
  initialPrompts,
  initialHasMore,
  pageSize,
}: HumorArchiveListProps) {
  const [prompts, setPrompts] = useState<HumorArchivePrompt[]>(initialPrompts);
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

    const lastPrompt = prompts[prompts.length - 1];

    if (!lastPrompt) {
      return;
    }

    isRequestPendingRef.current = true;
    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("humor_prompts")
        .select("id, image_path, alt_text, ends_at")
        .or(
          `ends_at.lt.${lastPrompt.endsAt},and(ends_at.eq.${lastPrompt.endsAt},id.lt.${lastPrompt.id})`,
        )
        .order("ends_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(pageSize + 1);

      if (error) {
        throw error;
      }

      if (!isMountedRef.current) {
        return;
      }

      const fetchedPrompts = data ?? [];

      const nextPrompts: HumorArchivePrompt[] = fetchedPrompts
        .slice(0, pageSize)
        .map((prompt) => ({
          id: prompt.id,
          imageUrl: supabase.storage
            .from("humor-images")
            .getPublicUrl(prompt.image_path).data.publicUrl,
          altText: prompt.alt_text,
          endsAt: prompt.ends_at,
        }));

      setPrompts((previousPrompts) => {
        const existingIds = new Set(previousPrompts.map((prompt) => prompt.id));

        return [
          ...previousPrompts,
          ...nextPrompts.filter((prompt) => !existingIds.has(prompt.id)),
        ];
      });

      setHasMore(fetchedPrompts.length > pageSize);
    } catch (error) {
      console.error("지난 회차 추가 조회 실패:", error);

      if (isMountedRef.current) {
        setLoadError("이전 회차를 불러오지 못했습니다. 다시 시도해 주세요.");
      }
    } finally {
      isRequestPendingRef.current = false;

      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, pageSize, prompts]);

  useEffect(() => {
    if (!hasMore || isLoadingMore || loadError !== null) {
      return;
    }

    const target = loadMoreRef.current;

    if (target === null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      {
        rootMargin: "0px 0px 200px 0px",
        threshold: 0,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadError, loadMore]);

  if (prompts.length === 0) {
    return <p className="mt-6">아직 종료된 회차가 없습니다.</p>;
  }

  return (
    <>
      <ul className="mt-6 space-y-4">
        {prompts.map((prompt, index) => (
          <li key={prompt.id} className="rounded-xl border p-4">
            <div className="relative mb-4 h-56 w-full rounded-lg bg-gray-50 sm:h-64 sm:w-64">
              <Image
                src={prompt.imageUrl}
                alt={prompt.altText}
                fill
                sizes="(max-width:640px) 100vw, 256px"
                loading={index === 0 ? "eager" : "lazy"}
                unoptimized
                className="object-contain"
              />
            </div>

            <p>{prompt.altText}</p>

            <p className="mt-2 text-sm text-gray-500">
              종료 :{" "}
              <time dateTime={prompt.endsAt}>
                {formatArchiveEndsAt(prompt.endsAt)}
              </time>
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

      <div ref={loadMoreRef} aria-hidden="true" className="h-1" />

      <div className="mt-6 text-center">
        {isLoadingMore && (
          <p role="status" className="text-sm text-gray-400">
            이전 회차를 불러오는 중...
          </p>
        )}

        {loadError && (
          <div>
            <p role="alert" className="text-sm text-red-500">
              {loadError}
            </p>

            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={isLoadingMore}
              className="mt-3 rounded-full border px-5 py-2 text-sm font-semibold text-emerald-600 disabled:cursor-wait disabled:text-gray-400"
            >
              다시 시도
            </button>
          </div>
        )}

        {!hasMore && (
          <p className="text-sm text-gray-400">모든 회차를 불러왔습니다.</p>
        )}
      </div>
    </>
  );
}
