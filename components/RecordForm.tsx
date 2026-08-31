const MAX_CONTENT_LENGTH = 300;

type RecordFormProps = {
  content: string;
  isPostCreationUnavailable: boolean;
  isProfileLoading: boolean;
  userNickname: string | null;
  isDailyPostStatusLoading: boolean;
  hasPostedToday: boolean;
  submitErrorMessage: string | null;
  isSubmitting: boolean;
  onContentChange: (content: string) => void;
  onSubmit: () => void;
};

export default function RecordForm({
  content,
  isPostCreationUnavailable,
  isProfileLoading,
  userNickname,
  isDailyPostStatusLoading,
  hasPostedToday,
  submitErrorMessage,
  isSubmitting,
  onContentChange,
  onSubmit,
}: RecordFormProps) {
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