"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type CommentDeleteButtonProps = {
  commentId: number;
};

export default function CommentDeleteButton({
  commentId,
}: CommentDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) {
      return;
    }

    const shouldDelete = window.confirm(
      "이 댓글을 정말 삭제하시겠습니까?",
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) {
        console.error("댓글 삭제 실패:", error);
        window.alert("댓글을 삭제하지 못했습니다.");
        return;
      }

      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="shrink-0 text-xs text-gray-400 transition hover:text-red-500 disabled:cursor-wait disabled:text-gray-300"
    >
      {isDeleting ? "삭제 중..." : "삭제"}
    </button>
  );
}