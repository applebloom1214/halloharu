"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type HumorRatingButtonsProps = {
  captionId: number;
  currentUserId: string | null;
  isOwn: boolean;
  initialScore: number | null;
};

export default function HumorRatingButtons({
  captionId,
  currentUserId,
  isOwn,
  initialScore,
}: HumorRatingButtonsProps) {
  const router = useRouter();

  const [selectedScore, setSelectedScore] = useState(initialScore);

  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const displayedScore = hoveredScore ?? selectedScore ?? 0;

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleScore = async (score: number) => {
    if (currentUserId === null || isOwn || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      if (selectedScore === null) {
        const { error } = await supabase.from("humor_caption_ratings").insert({
          caption_id: captionId,
          user_id: currentUserId,
          score,
        });

        if (error) {
          console.error("유머 별점 등록 실패:", error);
          setErrorMessage("별점을 등록하지 못했습니다.");
          return;
        }
      } else {
        const { error } = await supabase
          .from("humor_caption_ratings")
          .update({
            score,
            updated_at: new Date().toISOString(),
          })
          .eq("caption_id", captionId)
          .eq("user_id", currentUserId);

        if (error) {
          console.error("유머 별점 변경 실패 : ", error);
          setErrorMessage("별점을 변경하지 못했습니다.");
          return;
        }
      }

      setSelectedScore(score);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (currentUserId === null || selectedScore === null || isOwn || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("humor_caption_ratings")
        .delete()
        .eq("caption_id", captionId)
        .eq("user_id", currentUserId);

      if (error) {
        console.error("유머 별점 취소 실패 : ", error);
        setErrorMessage("별점을 취소하지 못했습니다.");
        return;
      }

      setSelectedScore(null);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  if (isOwn) {
    return (
      <p className="mt-3 text-xs text-gray-400">
        내 한마디에는 별점을 줄 수 없습니다.
      </p>
    );
  }

  if (currentUserId === null) {
    return (
      <p className="mt-3 text-xs text-gray-400">
        <Link
          href="/login?next=/humor"
          className="font-semibold text-emerald-600"
        >
          로그인
        </Link>
        하고 별점을 남겨주세요.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <div
        className="flex items-center gap-1"
        aria-label="한마디 별점"
        onMouseLeave={() => {
          setHoveredScore(null);
        }}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const score = index + 1;
          const isHighlighted = score <= displayedScore;

          return (
            <button
              key={score}
              type="button"
              onMouseEnter={() => {
                setHoveredScore(score);
              }}
              onFocus={() => {
                setHoveredScore(score);
              }}
              onBlur={() => {
                setHoveredScore(null);
              }}
              onClick={() => {
                void handleScore(score);
              }}
              disabled={isSaving}
              aria-label={`${score}점 주기`}
              aria-pressed={selectedScore === score}
              className={`text-2xl transition ${
                isHighlighted
                  ? "text-amber-400"
                  : "text-gray-300 hover:text-amber-300"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {isHighlighted ? "★" : "☆"}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <p className="text-xs text-gray-400">
          {isSaving
            ? "저장 중..."
            : hoveredScore !== null
              ? `${hoveredScore}점을 줄 수 있습니다.`
              : selectedScore === null
                ? "1점부터 5점까지 평가할 수 있습니다."
                : `${selectedScore}점을 선택했습니다.`}
        </p>

        {selectedScore !== null && !isSaving && (
          <button
            type="button"
            onClick={() => {
              void handleCancel();
            }}
            className="text-xs font-medium text-gray-400 transition hover:text-red-500"
          >
            평가 취소
          </button>
        )}
      </div>

      {errorMessage && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
