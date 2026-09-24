"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type HumorCaptionDeleteButtonProps = {
  captionId: number;
};

export default function HumorCaptionDeleteButton({
  captionId,
}: HumorCaptionDeleteButtonProps) {
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (isDeleting) {
      return;
    }

    const shouldDelete = window.confirm(
      "한마디를 삭제하면 받은 별점도 모두 사라집니다. 삭제하시겠습니까?",
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("humor_captions")
        .delete()
        .eq("id", captionId)
        .select("id")
        .maybeSingle();

      if (error || data === null) {
        console.error("유머 한마디 삭제 실패 : ", error);
        setErrorMessage("한마디를 삭제하지 못했습니다.");
        return;
      }

      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => {
          void handleDelete();
        }}
        disabled={isDeleting}
        className="text-xs font-medium text-gray-400 transition hover:text-red-500 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        {isDeleting ? "삭제 중..." : "한마디 삭제"}
      </button>

      {errorMessage && (
        <p role="alert" className="mt-2 text-xs text-red-500">
            {errorMessage}
        </p>
      )}
    </div>
  );
}
