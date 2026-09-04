import Link from "next/link";
import { useState } from "react";

export type ReportReason = "sapm" | "harassment" | "inappropriate" | "other";

type PostCardProps = {
  authorUserId: string | null;
  postId : number;
  authorNickname: string | null;
  content: string;
  commentsEnabled : boolean;
  createdAt: string;
  empathyCount: number;
  cheerCount: number;
  smileCount: number;
  isEmpathized: boolean;
  isCheered: boolean;
  isSmiled: boolean;
  // true - 이 게시글을 수정,삭제할 수 있음 false - 수정,삭제할 수 없음
  canManage: boolean;
  canReport: boolean;
  isReported : boolean;
  isDeleting: boolean;

  isEmpathyPending: boolean;
  isCheerPending: boolean;
  isSmilePending: boolean;


  onEmpathyClick: () => void;
  onCheerClick: () => void;
  onSmileClick: () => void;
  onDeleteClick: () => void;
  onUpdate: (updatedContent: string) => Promise<boolean>;
  onReport: (reportReason: ReportReason) => Promise<boolean>;
};

export default function PostCard({
  authorUserId,
  postId,
  authorNickname,
  content,
  commentsEnabled,
  createdAt,
  empathyCount,
  cheerCount,
  smileCount,
  isEmpathized,
  isCheered,
  isSmiled,
  canManage,
  canReport,
  isReported,
  isDeleting,
  isEmpathyPending,
  isCheerPending,
  isSmilePending,
  onEmpathyClick,
  onCheerClick,
  onSmileClick,
  onDeleteClick,
  onUpdate,
  onReport,
}: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  //신고 사유 선택창이 열렸는지 저장
  const [isReportOpen, setIsReportOpen] = useState(false);
  // 선택한 신고 사유 저장
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmedContent = editedContent.trim();

    if (trimmedContent === "" || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const isUpdated = await onUpdate(trimmedContent);

      if (!isUpdated) {
        return;
      }

      setEditedContent(trimmedContent);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleReportSubmit = async () => {
    if (reportReason === "" || isReporting) {
      return;
    }

    setReportError(null);
    setIsReporting(true);

    try {
      const wasReported = await onReport(reportReason as ReportReason);

      if (!wasReported) {
        setReportError("신고를 접수하지 못했습니다. 다시 시도해 주세요.");
        return;
      }

      setIsReportOpen(false);
      setReportReason("");
    } finally {
      setIsReporting(false);
    }
  };

  const date = new Date(createdAt);

  const koreaDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  const year = koreaDate.getUTCFullYear();
  const month = koreaDate.getUTCMonth() + 1;
  const day = koreaDate.getUTCDate();
  const hour = koreaDate.getUTCHours();
  const minute = koreaDate.getUTCMinutes().toString().padStart(2, "0");

  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;

  const formattedCreatedAt = `${year}년 ${month}월 ${day}일 ${period} ${displayHour}:${minute}`;

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {authorUserId ? (
            <Link
              href={`/users/${authorUserId}`}
              className="mb-2 inline-block text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline"
            >
              {authorNickname ?? "익명"}
            </Link>
          ) : (
            <p className="mb-2 text-xs font-semibold text-emerald-600">익명</p>
          )}

          {isEditing ? (
            <div>
              <textarea
                value={editedContent}
                onChange={(event) => setEditedContent(event.target.value)}
                maxLength={300}
                className="h-28 w-full resize-none rounded-xl border p-3 outline-none focus:border-emerald-400"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {editedContent.length} / 300
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="rounded-full border px-3 py-1 text-sm text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    취소
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={editedContent.trim() === "" || isSaving}
                    className={`rounded-full px-3 py-1 text-sm text-white transition-colors ${
                      editedContent.trim() === "" || isSaving
                        ? "cursor-not-allowed bg-gray-300"
                        : "bg-emerald-400 hover:bg-emerald-500"
                    }`}
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="min-w-0 whitespace-pre-wrap break-words">
                {content}
              </p>

              <time
                dateTime={createdAt}
                className="mt-2 block text-xs text-gray-400"
              >
                {formattedCreatedAt}
              </time>
            </>
          )}
        </div>

        {!isEditing && (canManage || canReport) && (
          <div className="flex shrink-0 gap-2">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditedContent(content);
                    setIsEditing(true);
                  }}
                  className="whitespace-nowrap text-sm text-gray-400 transition-colors hover:text-emerald-600"
                >
                  수정
                </button>

                <button
                  type="button"
                  onClick={onDeleteClick}
                  disabled={isDeleting}
                  className="whitespace-nowrap text-sm text-gray-400 transition-colors hover:text-red-500 disabled:cursor-wait disabled:text-gray-300"
                >
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
              </>
            )}

            {canReport && !isReported && (
              <button
                type="button"
                onClick={() => {
                  setReportError(null);
                  setIsReportOpen(true);
                }}
                aria-expanded={isReportOpen}
                className="whitespace-nowrap text-sm text-gray-400 transition-colors hover:text-red-500"
              >
                신고
              </button>
            )}
          </div>
        )}
      </div>

      {isReportOpen && (
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">
          <label className="block text-sm font-medium text-gray-700">
            신고 사유
            <select
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-red-300"
            >
              <option value="">신고 사유를 선택해 주세요.</option>
              <option value="spam">스팸 또는 광고</option>
              <option value="harassment">괴롭힘 또는 비방</option>
              <option value="inappropriate">부적절한 내용</option>
              <option value="other">기타</option>
            </select>
          </label>

          {reportError && (
            <p role="alert" className="mt-2 text-sm text-red-500">
              {reportError}
            </p>
          )}

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setReportReason("");
                setReportError(null);
                setIsReportOpen(false);
              }}
              disabled={isReporting}
              className="rounded-full border bg-white px-3 py-1 text-sm text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              취소
            </button>

            <button
              type="button"
              onClick={handleReportSubmit}
              disabled={reportReason === "" || isReporting}
              className="rounded-full bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isReporting ? "신고 중..." : "신고하기"}
            </button>
          </div>
        </div>
      )}

      {isReported && (
        <p className="mt-3 text-sm text-emerald-600">신고한 게시글입니다.</p>
      )}

      <div className="mt-3 text-sm text-gray-500">
        <button
          type="button"
          onClick={onEmpathyClick}
          disabled={isEmpathyPending}
          aria-busy={isEmpathyPending}
          className={`rounded-full px-2 py-1 transition disabled:cursor-wait disabled:opacity-50 ${
            isEmpathized
              ? "bg-emerald-100 text-emerald-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          🌱 공감 {empathyCount}
        </button>

        <span>·</span>

        <button
          type="button"
          onClick={onCheerClick}
          disabled={isCheerPending}
          aria-busy={isCheerPending}
          className={`rounded-full px-2 py-1 transition disabled:cursor-wait disabled:opacity-50 ${
            isCheered
              ? "bg-blue-100 text-blue-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          💪 응원 {cheerCount}
        </button>

        <span>·</span>

        <button
          type="button"
          onClick={onSmileClick}
          disabled={isSmilePending}
          aria-busy={isSmilePending}
          className={`rounded-full px-2 py-1 transition disabled:cursor-wait disabled:opacity-50 ${
            isSmiled
              ? "bg-yellow-100 text-yellow-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          😊 미소 {smileCount}
        </button>
      </div>

      {!isEditing && commentsEnabled && (
        <Link
          href={`/posts/${postId}`}
          className="mt-3 inline-block text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
        >
          댓글 보기 →
        </Link>
      )}
    </div>
  );
}
