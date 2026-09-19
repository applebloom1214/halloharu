"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const IMAGE_EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type HumorPromptFormProps = {
  currentUserId: string;
};

export default function HumorPromptForm({
  currentUserId,
}: HumorPromptFormProps) {
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(
    null,
  );
  const [altText, setAltText] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;

    setImageErrorMessage(null);
    setImagePreviewUrl(null);
    setSubmitErrorMessage(null);
    setSubmitMessage(null);

    if (file === null) {
      setSelectedImageFile(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setSelectedImageFile(null);
      setImageErrorMessage(
        "JPEG, PNG, WebP 형식의 사진만 등록할 수 있습니다.",
      );
      event.currentTarget.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      setSelectedImageFile(null);
      setImageErrorMessage("사진은 5MB 이하만 등록할 수 있습니다.");
      event.currentTarget.value = "";
      return;
    }

    setSelectedImageFile(file);
  };

  const handleImageRemove = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setImageErrorMessage(null);
    setSubmitErrorMessage(null);
    setSubmitMessage(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedAltText = altText.trim();

    setSubmitErrorMessage(null);
    setSubmitMessage(null);

    if (selectedImageFile === null) {
      setSubmitErrorMessage("등록할 사진을 선택해 주세요.");
      return;
    }

    if (trimmedAltText === "") {
      setSubmitErrorMessage("사진 설명을 입력해 주세요.");
      return;
    }

    if (startsAt === "" || endsAt === "") {
      setSubmitErrorMessage(
        "공개 시작과 참여 종료 시각을 입력해 주세요.",
      );
      return;
    }

    const startsAtDate = new Date(startsAt);
    const endsAtDate = new Date(endsAt);

    if (
      Number.isNaN(startsAtDate.getTime()) ||
      Number.isNaN(endsAtDate.getTime())
    ) {
      setSubmitErrorMessage("올바른 공개 기간을 입력해 주세요.");
      return;
    }

    if (endsAtDate <= startsAtDate) {
      setSubmitErrorMessage(
        "참여 종료 시각은 공개 시작 이후여야 합니다.",
      );
      return;
    }

    const imageExtension =
      IMAGE_EXTENSION_BY_TYPE[selectedImageFile.type];

    if (!imageExtension) {
      setSubmitErrorMessage("지원하지 않는 사진 형식입니다.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();

    const imagePath =
      `${currentUserId}/${crypto.randomUUID()}.${imageExtension}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("humor-images")
        .upload(imagePath, selectedImageFile, {
          contentType: selectedImageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("유머 사진 업로드 실패:", uploadError);
        setSubmitErrorMessage("사진을 업로드하지 못했습니다.");
        return;
      }

      const { error: insertError } = await supabase
        .from("humor_prompts")
        .insert({
          image_path: imagePath,
          alt_text: trimmedAltText,
          starts_at: startsAtDate.toISOString(),
          ends_at: endsAtDate.toISOString(),
          created_by: currentUserId,
        });

      if (insertError) {
        console.error("유머 주제 저장 실패:", insertError);

        const { error: cleanupError } = await supabase.storage
          .from("humor-images")
          .remove([imagePath]);

        if (cleanupError) {
          console.error(
            "업로드된 유머 사진 정리 실패:",
            cleanupError,
          );
        }

        setSubmitErrorMessage("유머 주제를 저장하지 못했습니다.");
        return;
      }

      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      setAltText("");
      setStartsAt("");
      setEndsAt("");
      setSubmitMessage("유머 주제가 등록되었습니다.");

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    selectedImageFile === null ||
    altText.trim() === "" ||
    startsAt === "" ||
    endsAt === "" ||
    isSubmitting;

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <div>
        <label
          htmlFor="humor-image"
          className="block text-sm font-medium text-gray-700"
        >
          제목짓기 사진
        </label>

        <input
          ref={imageInputRef}
          id="humor-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isSubmitting}
          onChange={handleImageFileChange}
          className="mt-2 block w-full text-sm text-gray-500 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
        />

        {selectedImageFile && imagePreviewUrl && (
          <div className="mt-3 rounded-xl border bg-gray-50 p-3">
            <div className="relative h-72 overflow-hidden rounded-lg bg-white">
              <Image
                src={imagePreviewUrl}
                alt="선택한 유머 주제 사진 미리보기"
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
                disabled={isSubmitting}
                className="shrink-0 text-sm text-gray-400 transition hover:text-red-500 disabled:cursor-not-allowed disabled:text-gray-300"
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

      <div>
        <label
          htmlFor="humor-alt-text"
          className="block text-sm font-medium text-gray-700"
        >
          사진 설명
        </label>

        <input
          id="humor-alt-text"
          type="text"
          value={altText}
          onChange={(event) => {
            setAltText(event.target.value);
            setSubmitErrorMessage(null);
            setSubmitMessage(null);
          }}
          maxLength={100}
          disabled={isSubmitting}
          placeholder="예: 소파 위에서 놀란 표정을 짓는 고양이"
          className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-emerald-400"
        />

        <p className="mt-2 text-right text-xs text-gray-400">
          {altText.length} / 100
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="humor-starts-at"
            className="block text-sm font-medium text-gray-700"
          >
            공개 시작
          </label>

          <input
            id="humor-starts-at"
            type="datetime-local"
            value={startsAt}
            onChange={(event) => {
              setStartsAt(event.target.value);
              setSubmitErrorMessage(null);
              setSubmitMessage(null);
            }}
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-emerald-400"
          />
        </div>

        <div>
          <label
            htmlFor="humor-ends-at"
            className="block text-sm font-medium text-gray-700"
          >
            참여 종료
          </label>

          <input
            id="humor-ends-at"
            type="datetime-local"
            value={endsAt}
            onChange={(event) => {
              setEndsAt(event.target.value);
              setSubmitErrorMessage(null);
              setSubmitMessage(null);
            }}
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-emerald-400"
          />
        </div>
      </div>

      {submitErrorMessage && (
        <p role="alert" className="text-sm text-red-500">
          {submitErrorMessage}
        </p>
      )}

      {submitMessage && (
        <p className="text-sm text-emerald-600">
          {submitMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitDisabled}
        className={`w-full rounded-xl px-4 py-3 font-semibold text-white transition ${
          isSubmitDisabled
            ? "cursor-not-allowed bg-gray-300"
            : "bg-emerald-400 hover:bg-emerald-500"
        }`}
      >
        {isSubmitting ? "등록 중..." : "유머 주제 등록"}
      </button>
    </form>
  );
}