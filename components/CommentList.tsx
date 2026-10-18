"use client";

import CommentForm from "@/components/CommentForm";
import CommentDeleteButton from "@/components/CommentDeleteButton";
import CommentEditForm from "@/components/CommentEditForm";
import CommentReportButton from "@/components/CommentReportButton";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type CommentAuthor = {
  nickname: string;
};

export type CommentWithAuthor = {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  author: CommentAuthor | CommentAuthor[] | null;
};

type CommentListProps = {
  postId: number;
  postAuthorId: string | null;
  currentUserId: string | null;
  commentsEnabled: boolean;
  initialComments: CommentWithAuthor[];
  initialReportedCommentIds: number[];
  totalCount: number;
  initialHasMore: boolean;
  pageSize: number;
};

const getCommentAuthorNickname = (author: CommentWithAuthor["author"]) => {
  if (Array.isArray(author)) {
    return author[0]?.nickname ?? "알 수 없는 사용자";
  }

  return author?.nickname ?? "알 수 없는 사용자";
};

const formatCommentCreatedAt = (createdAt: string): string => {
  const koreaTime = new Date(
    new Date(createdAt).getTime() + 9 * 60 * 60 * 1000,
  );

  return koreaTime.toISOString().slice(0, 19).replace("T", " ");
};

export default function CommentList({
  postId,
  postAuthorId,
  currentUserId,
  commentsEnabled,
  initialComments,
  initialReportedCommentIds,
  totalCount,
  initialHasMore,
  pageSize,
}: CommentListProps) {
  const [comments, setComments] =
    useState<CommentWithAuthor[]>(initialComments);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [commentCount, setCommentCount] = useState(totalCount);
  const [recentComments, setRecentComments] = useState<CommentWithAuthor[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [reportedCommentIds, setReportedCommentIds] = useState(
    () => new Set(initialReportedCommentIds),
  );

  const lastLoadedCommentRef = useRef<CommentWithAuthor | null>(
    initialComments[initialComments.length - 1] ?? null,
  );
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const deletedCommentIdsRef = useRef(new Set<number>());
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

    const lastComment = lastLoadedCommentRef.current;

    if (!lastComment) {
      return;
    }

    isRequestPendingRef.current = true;
    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("comments")
        .select(
          `
            id,
            user_id,
            content,
            created_at,
            author:profiles!comments_user_id_fkey(
              nickname
            )
          `,
        )
        .eq("post_id", postId)
        .eq("is_hidden", false)
        .or(
          `created_at.gt.${lastComment.created_at},and(created_at.eq.${lastComment.created_at},id.gt.${lastComment.id})`,
        )
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(pageSize + 1);

      if (error) {
        throw error;
      }

      if (!isMountedRef.current) {
        return;
      }

      const fetchedComments = (data ?? []) as CommentWithAuthor[];
      const nextComments = fetchedComments.slice(0, pageSize);

      let nextReportedIds: number[] = [];

      if (currentUserId !== null && nextComments.length > 0) {
        const { data: ownReports, error: ownReportsError } = await supabase
          .from("comment_reports")
          .select("comment_id")
          .eq("reporter_id", currentUserId)
          .in(
            "comment_id",
            nextComments.map((comment) => comment.id),
          );

        if (ownReportsError) {
          throw ownReportsError;
        }

        nextReportedIds = (ownReports ?? []).map((report) => report.comment_id);
      }

      if (!isMountedRef.current) {
        return;
      }

      lastLoadedCommentRef.current =
        nextComments[nextComments.length - 1] ?? lastLoadedCommentRef.current;

      setComments((previousComments) => {
        const existingIds = new Set(
          previousComments.map((comment) => comment.id),
        );

        return [
          ...previousComments,
          ...nextComments.filter(
            (comment) =>
              !existingIds.has(comment.id) &&
              !deletedCommentIdsRef.current.has(comment.id),
          ),
        ];
      });

      setReportedCommentIds(
        (previousIds) => new Set([...previousIds, ...nextReportedIds]),
      );

      setHasMore(fetchedComments.length > pageSize);
    } catch (error) {
      console.error("댓글 추가 조회 실패:", error);

      if (isMountedRef.current) {
        setLoadError("댓글을 더 불러오지 못했습니다. 다시 시도해 주세요.");
      }
    } finally {
      isRequestPendingRef.current = false;

      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [currentUserId, hasMore, pageSize, postId]);

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

  const handleCommentDeleted = (commentId: number) => {
    deletedCommentIdsRef.current.add(commentId);

    setComments((previousComments) =>
      previousComments.filter((comment) => comment.id !== commentId),
    );

    setRecentComments((previousComments) =>
      previousComments.filter((comment) => comment.id !== commentId),
    );

    setCommentCount((previousCount) => Math.max(0, previousCount - 1));
  };

  const handleCommentCreated = (comment: CommentWithAuthor) => {
    setRecentComments((previousComments) => [...previousComments, comment]);

    setCommentCount((previousCount) => previousCount + 1);
  };

  const recentCommentIds = new Set(recentComments.map((comment) => comment.id));

  return (
    <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-700">
        댓글 {commentCount}
      </h2>

      {commentsEnabled && (
        <CommentForm 
          postId={postId} 
          currentUserId={currentUserId} 
          onCreated={handleCommentCreated}
        />
      )}

      {recentComments.length > 0 && (
        <section className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
          <h3 className="text-sm font-semibold text-emerald-700">
            방금 작성한 댓글
          </h3>

          <ul className="mt-3 divide-y divide-emerald-100">
            {recentComments.map((comment) => (
              <li key={comment.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-emerald-600">
                  {getCommentAuthorNickname(comment.author)}
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <time
                    dateTime={comment.created_at}
                    className="text-xs text-gray-400"
                  >
                    {formatCommentCreatedAt(comment.created_at)}
                  </time>

                  <CommentDeleteButton
                    commentId={comment.id}
                    onDeleted={handleCommentDeleted}
                  />
                </div>

                <CommentEditForm
                  commentId={comment.id}
                  initialContent={comment.content}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {comments.length === 0 && recentComments.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">
          {commentCount > 0
            ? "현재 표시된 댓글이 없습니다."
            : commentsEnabled
              ? "아직 댓글이 없습니다."
              : "작성자가 댓글을 받지 않는 기록입니다."}
        </p>
      ) : (
        <ul className="mt-4 divide-y">
          {comments
            .filter((comment) => !recentCommentIds.has(comment.id))
            .map((comment) => (
              <li key={comment.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-emerald-600">
                    {getCommentAuthorNickname(comment.author)}
                  </p>

                  <div className="flex shrink-0 items-center gap-3">
                    <time
                      dateTime={comment.created_at}
                      className="text-xs text-gray-400"
                    >
                      {formatCommentCreatedAt(comment.created_at)}
                    </time>

                    {currentUserId !== null &&
                      (currentUserId === comment.user_id ||
                        currentUserId === postAuthorId) && (
                        <CommentDeleteButton
                          commentId={comment.id}
                          onDeleted={handleCommentDeleted}
                        />
                      )}
                  </div>
                </div>

                {currentUserId === comment.user_id ? (
                  <CommentEditForm
                    commentId={comment.id}
                    initialContent={comment.content}
                  />
                ) : (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                    {comment.content}
                  </p>
                )}

                {currentUserId !== null &&
                  currentUserId !== comment.user_id && (
                    <CommentReportButton
                      commentId={comment.id}
                      currentUserId={currentUserId}
                      initialReported={reportedCommentIds.has(comment.id)}
                    />
                  )}
              </li>
            ))}
        </ul>
      )}

      <div ref={loadMoreRef} aria-hidden="true" className="h-1" />

      {(comments.length > 0 || recentComments.length > 0 || hasMore) && (
        <div className="mt-4 text-center">
          {isLoadingMore && (
            <p role="status" className="text-sm text-gray-400">
              댓글을 더 불러오는 중...
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
            <p className="text-sm text-gray-400">모든 댓글을 불러왔습니다.</p>
          )}
        </div>
      )}

      
    </section>
  );
}
