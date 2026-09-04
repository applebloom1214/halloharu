"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

const MAX_COMMENT_LENGTH = 200;

type CommentFormProps = {
  postId: number;
  currentUserId: string | null;
};

export default function CommentForm({
  postId,
  currentUserId,
}: CommentFormProps) {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedContent = content.trim();

    if (
      currentUserId === null ||
      trimmedContent === "" ||
      isSubmitting
    ) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: currentUserId,
        content: trimmedContent,
      });

      if (error) {
        console.error("댓글 작성 실패:", error);

        if (error.code === "42501") {
          setErrorMessage(
            "댓글을 작성할 권한이 없거나 댓글 작성이 중지된 기록입니다.",
          );
        } else {
          setErrorMessage("댓글을 저장하지 못했습니다. 다시 시도해 주세요.");
        }

        return;
      }

      setContent("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentUserId === null) {
    return (
      <div className="mt-5 rounded-xl bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">
          댓글을 작성하려면 로그인이 필요합니다.
        </p>

        <Link
          href="/login"
          className="mt-2 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  return (
    <form
      className="mt-5 border-t pt-5"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <label
        htmlFor="comment-content"
        className="text-sm font-semibold text-gray-700"
      >
        댓글 작성
      </label>

      <textarea
        id="comment-content"
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setErrorMessage(null);
        }}
        maxLength={MAX_COMMENT_LENGTH}
        disabled={isSubmitting}
        placeholder="따뜻한 댓글을 남겨주세요."
        className="mt-2 h-24 w-full resize-none rounded-xl border p-3 text-sm outline-none focus:border-emerald-400 disabled:bg-gray-100"
      />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {content.length} / {MAX_COMMENT_LENGTH}
        </span>

        <button
          type="submit"
          disabled={content.trim() === "" || isSubmitting}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? "등록 중..." : "댓글 등록"}
        </button>
      </div>

      {errorMessage && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </form>
  );
}