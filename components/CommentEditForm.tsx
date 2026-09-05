"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

const MAX_COMMENT_LENGTH = 200;

type CommentEditFormProps = {
  commentId: number;
  initialContent: string;
};

export default function CommentEditForm({
  commentId,
  initialContent,
}: CommentEditFormProps) {
  const [content, setContent] = useState(initialContent);
  const [editedContent, setEditedContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdate = async () => {
    const trimmedContent = editedContent.trim();

    if (trimmedContent === "" || isUpdating) {
      return;
    }

    setErrorMessage(null);
    setIsUpdating(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("comments")
        .update({
          content: trimmedContent,
        })
        .eq("id", commentId)
        .select("content")
        .single();

      if (error) {
        console.error("댓글 수정 실패:", error);
        setErrorMessage(
          "댓글을 수정하지 못했습니다. 다시 시도해 주세요.",
        );
        return;
      }

      setContent(data.content);
      setEditedContent(data.content);
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="mt-2">
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
          {content}
        </p>

        <button
          type="button"
          onClick={() => {
            setEditedContent(content);
            setErrorMessage(null);
            setIsEditing(true);
          }}
          className="mt-2 text-xs text-gray-400 transition hover:text-emerald-600"
        >
          수정
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-3"
      onSubmit={(event) => {
        event.preventDefault();
        void handleUpdate();
      }}
    >
      <textarea
        value={editedContent}
        onChange={(event) => {
          setEditedContent(event.target.value);
          setErrorMessage(null);
        }}
        maxLength={MAX_COMMENT_LENGTH}
        disabled={isUpdating}
        className="h-24 w-full resize-none rounded-xl border p-3 text-sm outline-none focus:border-emerald-400 disabled:bg-gray-100"
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400">
          {editedContent.length} / {MAX_COMMENT_LENGTH}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditedContent(content);
              setErrorMessage(null);
              setIsEditing(false);
            }}
            disabled={isUpdating}
            className="rounded-full border px-3 py-1.5 text-xs text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
          >
            취소
          </button>

          <button
            type="submit"
            disabled={editedContent.trim() === "" || isUpdating}
            className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isUpdating ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </form>
  );
}