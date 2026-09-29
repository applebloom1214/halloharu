"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ReportReason = "spam" | "harassment" | "inappropriate" | "other";

type Props = {
  captionId: number;
  currentUserId: string | null;
  isOwn: boolean;
  initialReported : boolean;
};

export default function HumorCaptionReportButton({
  captionId,
  currentUserId,
  isOwn,
  initialReported,
}: Props) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [isSaving, setIsSaving] = useState(false);
  const [isReported, setIsReported] = useState(initialReported);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (currentUserId === null || isOwn) {
    return null;
  }

  const handleReport = async () => {
    if (isSaving || isReported) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("humor_caption_reports")
        .insert({
          caption_id: captionId,
          reporter_id: currentUserId,
          reason,
        });

      if (error) {
        if (error.code === "23505") {
          setIsReported(true);
          return;
        }

        console.error("유머 한마디 신고 실패:", error);
        setErrorMessage("신고를 접수하지 못했습니다.");
        return;
      }

      setIsReported(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-3">
      {isReported ? (
        <p className="text-xs text-gray-500">신고 접수됨</p>
      ) : (
        <details>
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
              aria-label="신고 사유"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value as ReportReason);
              }}
              className="rounded-lg border px-2 py-1 text-sm"
            >
              <option value="spam">스팸</option>
              <option value="harassment">괴롭힘</option>
              <option value="inappropriate">부적절한 내용</option>
              <option value="other">기타</option>
            </select>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
            >
              {isSaving ? "접수 중..." : "신고 접수"}
            </button>
          </form>
        </details>
      )}

      {errorMessage && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
}