"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type SelectedRecordCardProps = {
  postId: number | null;
  selectedDate: string;
  content: string | null;
  imageUrl: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  onUpdate: (postId: number, updatedContent: string) => Promise<boolean>;
};

export default function SelectedRecordCard({
  postId,
  selectedDate,
  content,
  imageUrl,
  isLoading,
  errorMessage,
  onUpdate,
}: SelectedRecordCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isSavePendingRef = useRef(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSave = async () => {
    if (postId === null || isSavePendingRef.current) {
      return;
    }

    const trimmedContent = editedContent.trim();

    if (trimmedContent === "" || trimmedContent.length > 300) {
      setSaveError("기록은 공백을 제외한 내용이 있어야 하며, 300자 이하여야 합니다.");
      return;
    }

    isSavePendingRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    try {
      const isUpdated = await onUpdate(postId, trimmedContent);

      if (!isMountedRef.current) {
        return;
      }

      if (!isUpdated) {
        setSaveError(
          "기록을 수정하지 못했습니다. 연결 상태와 기록 상태를 확인한 뒤 다시 시도해 주세요.",
        );
        return;
      }

      setIsEditing(false);
    } catch (error) {
      console.error("달력 기록 수정 실패:", error);

      if (isMountedRef.current) {
        setSaveError("기록을 수정하지 못했습니다. 다시 시도해 주세요.");
      }
    } finally {
      isSavePendingRef.current = false;

      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    if (isSavePendingRef.current) {
      return;
    }

    setEditedContent(content ?? "");
    setSaveError(null);
    setIsEditing(false);
  };

  return (
    <section className="mx-auto mt-3 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 text-left">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-700">
          {selectedDate}의 기록
        </p>

        {!isLoading &&
          errorMessage === null &&
          postId !== null &&
          content !== null &&
          !isEditing && (
            <button
              type="button"
              onClick={() => {
                setEditedContent(content);
                setSaveError(null);
                setIsEditing(true);
              }}
              className="shrink-0 text-sm text-gray-500 transition hover:text-emerald-600"
            >
              수정
            </button>
          )}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">기록을 불러오는 중...</p>
      ) : errorMessage ? (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      ) : content !== null ? (
        <>
          {isEditing ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              <textarea
                aria-label="선택한 기록 내용 수정"
                value={editedContent}
                onChange={(event) => setEditedContent(event.target.value)}
                maxLength={300}
                disabled={isSaving}
                className="h-32 w-full resize-none rounded-xl border p-3 text-sm leading-6 outline-none focus:border-emerald-400 disabled:bg-gray-50 disabled:text-gray-500"
              />

              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400">
                  {editedContent.length} / 300
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="rounded-full border px-3 py-1 text-sm text-gray-500 disabled:cursor-wait disabled:opacity-50"
                  >
                    취소
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isSaving ||
                      editedContent.trim() === "" ||
                      editedContent.length > 300
                    }
                    className="rounded-full bg-emerald-500 px-3 py-1 text-sm text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>

              {saveError !== null && (
                <p role="alert" className="mt-3 text-sm text-red-500">
                  {saveError}
                </p>
              )}
            </form>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
              {content}
            </p>
          )}

          {imageUrl && (
            <div className="relative mt-3 h-56 overflow-hidden rounded-xl bg-gray-50">
              <Image
                src={imageUrl}
                alt="선택한 날짜의 기록 사진"
                fill
                unoptimized
                sizes="(max-width: 384px) 100vw, 384px"
                className="object-contain"
              />
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}