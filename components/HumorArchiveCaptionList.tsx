"use client";

import { useEffect, useRef } from "react";

import HumorCaptionReportButton from "@/components/HumorCaptionReportButton";

import type { HumorCaption } from "@/lib/humor/captions";
import { useHumorCaptionList } from "@/lib/humor/use-humor-caption-list";

type HumorArchiveCaptionListProps = {
  promptId: number;
  initialCaptions: HumorCaption[];
  initialHasMore: boolean;
  feedVersion: number;
  endsAt: string;
  currentUserId: string | null;
  initialReportedCaptionIds: number[];
};

export default function HumorArchiveCaptionList({
  promptId,
  initialCaptions,
  initialHasMore,
  feedVersion,
  endsAt,
  currentUserId,
  initialReportedCaptionIds,
}: HumorArchiveCaptionListProps) {
  const {
    captions,
    reportedCaptionIds,
    hasMore,
    isLoadingMore,
    loadError,
    needsRefresh,
    isRefreshPending,
    loadMore,
    refreshFeed,
  } = useHumorCaptionList({
    promptId,
    initialCaptions,
    initialHasMore,
    feedVersion,
    endsAt,
    currentUserId,
    initialReportedCaptionIds,
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (
      target === null ||
      !hasMore ||
      isLoadingMore ||
      needsRefresh ||
      isRefreshPending ||
      loadError !== null
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      {
        rootMargin: "200px 0px",
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [
    hasMore,
    isLoadingMore,
    needsRefresh,
    isRefreshPending,
    loadError,
    loadMore,
  ]);

  return (
    <>
      <ol
        className="mt-4 space-y-3"
        aria-busy={isLoadingMore || isRefreshPending}
      >
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

            <HumorCaptionReportButton
              captionId={caption.id}
              currentUserId={currentUserId}
              isOwn={caption.is_own}
              initialReported={reportedCaptionIds.has(caption.id)}
            />
          </li>
        ))}
      </ol>

      <div ref={loadMoreRef} aria-hidden="true" className="h-px" />

      <div className="mt-6 text-center">
        {needsRefresh ? (
          <>
            <p role="status" className="text-sm text-gray-500">
              {isRefreshPending
                ? "최신 순위를 불러오는 중..."
                : "목록이 변경되었습니다. 최신 순위를 다시 불러와 주세요."}
            </p>

            {!isRefreshPending && (
              <button
                type="button"
                onClick={refreshFeed}
                className="mt-3 rounded-full border px-4 py-2 text-sm"
              >
                최신 순위 다시 불러오기
              </button>
            )}
          </>
        ) : loadError ? (
          <>
            <p role="alert" className="text-sm text-red-500">
              {loadError}
            </p>

            <button
              type="button"
              onClick={() => void loadMore()}
              className="mt-3 rounded-full border px-4 py-2 text-sm"
            >
              다시 시도
            </button>
          </>
        ) : hasMore ? (
          <p role="status" className="text-sm text-gray-400">
            {isLoadingMore
              ? "불러오는 중..."
              : "아래로 내리면 다음 한마디를 불러옵니다."}
          </p>
        ) : (
          <p className="text-sm text-gray-400">
            모든 한마디를 불러왔습니다.
          </p>
        )}
      </div>
    </>
  );
}