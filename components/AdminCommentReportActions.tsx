"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateCommentReportStatus } from "@/app/admin/reports/actions";

type ReportStatus = "resolved" | "dismissed";

type Props = {
  commentId: number;
  reporterId: string;
  currentStatus: string;
};

export default function AdminCommentReportActions({
  commentId,
  reporterId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<ReportStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdate = async (nextStatus: ReportStatus) => {
    if (pendingStatus !== null) return;

    const label = nextStatus === "resolved" ? "조치 완료" : "문제없음";

    if (!window.confirm(`이 신고를 '${label}' 상태로 변경할까요?`)) {
      return;
    }

    setErrorMessage(null);
    setPendingStatus(nextStatus);

    try {
      const result = await updateCommentReportStatus(
        commentId,
        reporterId,
        nextStatus,
      );

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("댓글 신고 상태 변경 요청 실패:", error);
      setErrorMessage("신고 상태를 변경하지 못했습니다.");
    } finally {
      setPendingStatus(null);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleUpdate("resolved")}
          disabled={pendingStatus !== null || currentStatus === "resolved"}
          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {pendingStatus === "resolved" ? "변경 중..." : "조치 완료"}
        </button>

        <button
          type="button"
          onClick={() => void handleUpdate("dismissed")}
          disabled={pendingStatus !== null || currentStatus === "dismissed"}
          className="rounded-full border px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:text-gray-300"
        >
          {pendingStatus === "dismissed" ? "변경 중..." : "문제없음"}
        </button>
      </div>

      {errorMessage && (
        <p role="alert" className="mt-3 text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
}