"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type CommentDeleteButtonProps = {
  commentId: number;
  onDeleted?: (commentId: number) => void;
};

export default function CommentDeleteButton({
  commentId,
  onDeleted,
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

      const { data, error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("댓글 삭제 실패:", error);
        window.alert("댓글을 삭제하지 못했습니다.");
        return;
      }

      if (data === null) {
        window.alert(
          "이미 삭제되었거나 삭제 권한이 없는 댓글입니다. 새로고침 후 확인해 주세요.",
        );
        return;
      }

      if (onDeleted) {
        onDeleted(data.id);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("댓글 삭제 요청 실패:", error);
      window.alert(
        "댓글을 삭제하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleDelete()}
      disabled={isDeleting}
      className="shrink-0 text-xs text-gray-400 transition hover:text-red-500 disabled:cursor-wait disabled:text-gray-300"
    >
      {isDeleting ? "삭제 중..." : "삭제"}
    </button>
  );
}