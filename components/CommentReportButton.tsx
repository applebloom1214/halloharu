"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ReportReason = "spam" | "harassment" | "inappropriate" | "other";

type Props = {
  commentId: number;
  currentUserId: string;
  initialReported: boolean;
};

export default function CommentReportButton({
  commentId,
  currentUserId,
  initialReported,
}: Props) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [isReported, setIsReported] = useState(initialReported);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReport = async () => {
    if (isSaving || isReported || reason === "") return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.from("comment_reports").insert({
        comment_id: commentId,
        reporter_id: currentUserId,
        reason,
      });

      if (error) {
        if (error.code === "23505") {
          setIsReported(true);
          return;
        }

        console.error("댓글 신고 실패:", error);
        setErrorMessage("신고를 접수하지 못했습니다.");
        return;
      }

      setIsReported(true);
    } catch (error) {
      console.error("댓글 신고 실패:", error);
      setErrorMessage("신고를 접수하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isReported) {
    return <p className="mt-2 text-xs text-gray-500">신고 접수됨</p>;
  }

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs text-gray-400 hover:text-red-500">
        신고
      </summary>

      <form
        className="mt-2 flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void handleReport();
        }}
      >
        <select
          aria-label="댓글 신고 사유"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value as ReportReason | "");
          }}
          className="rounded-lg border px-2 py-1 text-sm"
        >
          <option value="">신고 사유 선택</option>
          <option value="spam">스팸</option>
          <option value="harassment">괴롭힘</option>
          <option value="inappropriate">부적절한 내용</option>
          <option value="other">기타</option>
        </select>

        <button
          type="submit"
          disabled={isSaving || reason === ""}
          className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
        >
          {isSaving ? "접수 중..." : "신고 접수"}
        </button>
      </form>

      {errorMessage && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {errorMessage}
        </p>
      )}
    </details>
  );
}