"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const MAX_CAPTION_LENGTH = 100;

type HumorCaptionFormProps = {
  promptId: number;
  currentUserId: string | null;
  hasSubmittedCaption: boolean;
};

export default function HumorCaptionForm({
  promptId,
  currentUserId,
  hasSubmittedCaption,
}: HumorCaptionFormProps) {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(hasSubmittedCaption);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (currentUserId === null) {
    return (
      <div className="mt-8 rounded-2xl bg-emerald-50 px-4 py-5 text-center">
        <p className="text-sm text-emerald-700">
          로그인하고 센스 있는 한마디를 남겨보세요.
        </p>

        <Link
          href="/login?next=/humor"
          className="mt-3 inline-block rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="mt-8 rounded-2xl bg-emerald-50 px-4 py-5 text-center text-sm text-emerald-700">
        {successMessage ?? "이 사진에 한마디를 등록했습니다."}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedContent = content.trim();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (trimmedContent === "") {
      setErrorMessage("한마디를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("humor_captions")
        .insert({
          prompt_id: promptId,
          user_id: currentUserId,
          content: trimmedContent,
        });

      if (error) {
        console.error("유머 한마디 등록 실패:", error);

        if (error.code === "23505") {
          setHasSubmitted(true);
          setSuccessMessage(
            "이 사진에는 이미 한마디를 등록했습니다.",
          );
        } else {
          setErrorMessage("한마디를 등록하지 못했습니다.");
        }

        return;
      }

      setContent("");
      setSuccessMessage("한마디가 등록되었습니다.");
      setHasSubmitted(true);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="mt-8 rounded-2xl border bg-gray-50 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <label
        htmlFor="humor-caption"
        className="block text-sm font-semibold text-gray-700"
      >
        나의 한마디
      </label>

      <textarea
        id="humor-caption"
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setErrorMessage(null);
        }}
        maxLength={MAX_CAPTION_LENGTH}
        disabled={isSubmitting}
        placeholder="사진을 보고 떠오른 한마디를 적어보세요."
        className="mt-3 h-24 w-full resize-none rounded-xl border bg-white p-3 outline-none transition focus:border-emerald-400 disabled:bg-gray-100"
      />

      <div className="mt-2 flex items-center justify-between gap-4">
        <span className="text-xs text-gray-400">
          {content.length} / {MAX_CAPTION_LENGTH}
        </span>

        <button
          type="submit"
          disabled={content.trim() === "" || isSubmitting}
          className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition ${
            content.trim() === "" || isSubmitting
              ? "cursor-not-allowed bg-gray-300"
              : "bg-emerald-400 hover:bg-emerald-500"
          }`}
        >
          {isSubmitting ? "등록 중..." : "한마디 등록"}
        </button>
      </div>

      {errorMessage && (
        <p role="alert" className="mt-3 text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </form>
  );
}