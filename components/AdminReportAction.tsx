"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateReportStatus } from "@/app/admin/reports/actions";

type AdminReportActionsProps = {
  postId: number;
  reporterId: string;
  currentStatus: string;
};

type NextReportStatus = "resolved" | "dismissed";

export default function AdminReportActions({
  postId,
  reporterId,
  currentStatus,
}: AdminReportActionsProps) {
  const router = useRouter();

  const [pendingStatus, setPendingStatus] =
    useState<NextReportStatus | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStatusUpdate = async (nextStatus: NextReportStatus) => {
    if (pendingStatus !== null) {
      return;
    }

    const nextStatusLabel =
      nextStatus === "resolved" ? "조치 완료" : "문제없음";

    const shouldUpdate = window.confirm(
      `이 신고를 '${nextStatusLabel}' 상태로 변경할까요?`,
    );

    if (!shouldUpdate) {
      return;
    }

    setErrorMessage(null);
    setPendingStatus(nextStatus);

    try {
      const result = await updateReportStatus(
        postId,
        reporterId,
        nextStatus,
      );

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("신고 상태 변경 요청 실패:", error);
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
          onClick={() => handleStatusUpdate("resolved")}
          disabled={
            pendingStatus !== null || currentStatus === "resolved"
          }
          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {pendingStatus === "resolved" ? "변경 중..." : "조치 완료"}
        </button>

        <button
          type="button"
          onClick={() => handleStatusUpdate("dismissed")}
          disabled={
            pendingStatus !== null || currentStatus === "dismissed"
          }
          className="rounded-full border px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:text-gray-300"
        >
          {pendingStatus === "dismissed" ? "변경 중..." : "문제없음"}
        </button>
      </div>

      {errorMessage !== null && (
        <p role="alert" className="mt-3 text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
}