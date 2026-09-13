"use client";

import Image from "next/image";
import { useState, useRef, useEffect, type ChangeEvent } from "react";

const MAX_CONTENT_LENGTH = 300;

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type RecordFormProps = {
  content: string;
  selectedImageFile: File | null;
  onImageFileChange: (file: File | null) => void;
  onContentChange: (content: string) => void;
  commentsEnabled: boolean;
  onCommentsEnabledChange: (enabled: boolean) => void;
  isPostCreationUnavailable: boolean;
  isProfileLoading: boolean;
  userNickname: string | null;
  isDailyPostStatusLoading: boolean;
  hasPostedToday: boolean;
  submitErrorMessage: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
};

export default function RecordForm({
  content,
  selectedImageFile,
  onImageFileChange,
  commentsEnabled,
  onContentChange,
  onCommentsEnabledChange,
  isPostCreationUnavailable,
  isProfileLoading,
  userNickname,
  isDailyPostStatusLoading,
  hasPostedToday,
  submitErrorMessage,
  isSubmitting,
  onSubmit,
}: RecordFormProps) {
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(
    null,
  );

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  //선택한 사진을 브라우저에서 볼 수 있는 임시 주소로 변환합니다
  useEffect(() => {
    if (selectedImageFile === null) {
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = () => {
      if (typeof fileReader.result === "string") {
        setImagePreviewUrl(fileReader.result);
      }
    };

    fileReader.readAsDataURL(selectedImageFile);

    return () => {
      fileReader.abort();
    };
  }, [selectedImageFile]);

  //사진 선택을 취소하거나 나중에 게시글 저장이 끝났을 때 파일 입력창을 비웁니다.
  useEffect(() => {
    if (selectedImageFile === null && imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, [selectedImageFile]);

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;

    setImageErrorMessage(null);
    setImagePreviewUrl(null);

    if (file === null) {
      onImageFileChange(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      onImageFileChange(null);
      setImageErrorMessage("JPEG, PNG, Webp 형식의 사진만 첨부할 수 있습니다.");
      event.currentTarget.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      onImageFileChange(null);
      setImageErrorMessage("사진은 5MB 이하만 첨부할 수 있습니다.");
      event.currentTarget.value = "";
      return;
    }

    onImageFileChange(file);
  };

  const handleImageRemove = () => {
    setImageErrorMessage(null);
    setImagePreviewUrl(null);
    onImageFileChange(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const isSubmitDisabled =
    content.trim() === "" || isSubmitting || isPostCreationUnavailable;

  return (
    <>
      <textarea
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
        maxLength={MAX_CONTENT_LENGTH}
        disabled={isPostCreationUnavailable}
        className={`h-32 w-full resize-none rounded-xl border p-4 outline-none ${
          isPostCreationUnavailable
            ? "cursor-not-allowed bg-gray-50 text-gray-400"
            : "focus:border-emerald-400"
        }`}
        placeholder={
          isProfileLoading
            ? "프로필을 확인하고 있습니다..."
            : userNickname === null
              ? "닉네임을 먼저 설정해 주세요."
              : isDailyPostStatusLoading
                ? "오늘 기록을 확인하고 있습니다..."
                : hasPostedToday
                  ? "오늘의 기록을 이미 남겼습니다."
                  : "오늘은 어떤 하루였나요? ^^"
        }
      />

      <div className="mt-3 text-left">
        <label
          htmlFor="post-image"
          className={`block text-sm font-medium ${
            isPostCreationUnavailable ? "text-gray-300" : "text-gray-600"
          }`}
        >
          사진 1장 첨부
        </label>

        <input
          ref={imageInputRef}
          id="post-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isPostCreationUnavailable}
          onChange={handleImageFileChange}
          className="mt-2 block w-full text-sm text-gray-500 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 disabled:cursor-not-allowed"
        />

        {selectedImageFile && imagePreviewUrl && (
          <div className="mt-3 rounded-xl border bg-gray-50 p-3">
            <div className="relative h-64 overflow-hidden rounded-lg bg-white">
              <Image
                src={imagePreviewUrl}
                alt="선택한 게시글 사진 미리보기"
                fill
                unoptimized
                sizes="(max-width: 672px) 100vw, 672px"
                className="object-contain"
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs text-gray-500">
                {selectedImageFile.name}
              </p>

              <button
                type="button"
                onClick={handleImageRemove}
                disabled={isPostCreationUnavailable}
                className="shrink-0 text-sm text-gray-400 transition hover:text-red-500 disabled:cursor-not-allowed"
              >
                선택 취소
              </button>
            </div>
          </div>
        )}

        {imageErrorMessage && (
          <p role="alert" className="mt-2 text-sm text-red-500">
            {imageErrorMessage}
          </p>
        )}
      </div>

      <label
        className={`mt-3 flex items-start gap-2 text-left text-sm ${
          isPostCreationUnavailable ? "text-gray-300" : "text-gray-600"
        }`}
      >
        <input
          type="checkbox"
          checked={commentsEnabled}
          onChange={(event) => onCommentsEnabledChange(event.target.checked)}
          disabled={isPostCreationUnavailable}
          className="mt-0.5 h-4 w-4 accent-emerald-500"
        />

        <span>
          <span className="font-medium">댓글 받기</span>
          <span className="mt-1 block text-xs text-gray-400">
            다른 사용자가 이 기록에 댓글을 남길 수 있습니다.
          </span>
        </span>
      </label>

      {hasPostedToday && (
        <p className="mt-2 text-left text-sm text-emerald-600">
          오늘의 기록을 완료했습니다. 내일 다시 만나요.
        </p>
      )}

      {submitErrorMessage && (
        <p role="alert" className="mt-2 text-left text-sm text-red-500">
          {submitErrorMessage}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {content.length} / {MAX_CONTENT_LENGTH}
        </span>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className={`rounded-full px-5 py-2 font-semibold text-white transition ${
            isSubmitDisabled
              ? "cursor-not-allowed bg-gray-300"
              : "bg-emerald-400 hover:bg-emerald-500"
          }`}
        >
          {isProfileLoading
            ? "프로필 확인 중..."
            : userNickname === null
              ? "닉네임 설정 필요"
              : isDailyPostStatusLoading
                ? "확인 중..."
                : hasPostedToday
                  ? "오늘 기록 완료"
                  : isSubmitting
                    ? "저장 중..."
                    : "하루 남기기"}
        </button>
      </div>
    </>
  );
}
