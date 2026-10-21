"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  fetchNextHumorCaptions,
  type HumorCaption,
  type HumorCaptionCursor,
} from "@/lib/humor/captions";

type UseHumorCaptionListParams = {
  promptId: number;
  initialCaptions: HumorCaption[];
  initialHasMore: boolean;
  feedVersion: number;
  endsAt: string;
  currentUserId: string | null;
  initialReportedCaptionIds: number[];
};

export function useHumorCaptionList({
  promptId,
  initialCaptions,
  initialHasMore,
  feedVersion,
  endsAt,
  currentUserId,
  initialReportedCaptionIds,
}: UseHumorCaptionListParams) {
  const router = useRouter();

  const [captions, setCaptions] = useState(initialCaptions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [isRefreshPending, startRefresh] = useTransition();

  const [reportedCaptionIds, setReportedCaptionIds] = useState(
    () => new Set(initialReportedCaptionIds),
  );

  const cursorRef = useRef<HumorCaptionCursor | null>(
    initialCaptions[initialCaptions.length - 1] ?? null,
  );
  const isRequestPendingRef = useRef(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshFeed = useCallback(() => {
    setNeedsRefresh(true);

    startRefresh(() => {
      router.refresh();
    });
  }, [router, startRefresh]);

  const loadMore = useCallback(async () => {
    if (
      !isMountedRef.current ||
      isRequestPendingRef.current ||
      !hasMore ||
      needsRefresh
    ) {
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
      const result = await fetchNextHumorCaptions({
        promptId,
        currentUserId,
        cursor,
        expectedVersion: feedVersion,
        expectedEndsAt: endsAt,
      });

      if (!isMountedRef.current) {
        return;
      }

      if (result.status === "changed") {
        refreshFeed();
        return;
      }

      setCaptions((previousCaptions) => {
        const existingIds = new Set(
          previousCaptions.map((caption) => caption.id),
        );

        const newCaptions = result.captions.filter(
          (caption) => !existingIds.has(caption.id),
        );

        return [...previousCaptions, ...newCaptions];
      });

      setReportedCaptionIds(
        (previousIds) =>
          new Set([...previousIds, ...result.reportedCaptionIds]),
      );

      const lastCaption = result.captions[result.captions.length - 1];

      if (lastCaption) {
        cursorRef.current = lastCaption;
      }

      setHasMore(result.hasMore);
    } catch (error) {
      console.error("유머 한마디 추가 로딩 실패:", error);

      if (isMountedRef.current) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "한마디를 추가로 불러오지 못했습니다.",
        );
      }
    } finally {
      isRequestPendingRef.current = false;

      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [
    promptId,
    currentUserId,
    feedVersion,
    endsAt,
    hasMore,
    needsRefresh,
    refreshFeed,
  ]);

  return {
    captions,
    reportedCaptionIds,
    hasMore,
    isLoadingMore,
    loadError,
    needsRefresh,
    isRefreshPending,
    loadMore,
    refreshFeed,
  };
}