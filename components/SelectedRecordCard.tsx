type SelectedRecordCardProps = {
  selectedDate: string;
  content: string | null;
  isLoading: boolean;
  errorMessage: string | null;
};

export default function SelectedRecordCard({
  selectedDate,
  content,
  isLoading,
  errorMessage,
}: SelectedRecordCardProps) {
  return (
    <section className="mx-auto mt-3 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-2 text-sm font-semibold text-gray-700">
        {selectedDate}의 기록
      </p>

      {isLoading ? (
        <p className="text-sm text-gray-400">기록을 불러오는 중...</p>
      ) : errorMessage ? (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      ) : content !== null ? (
        <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
          {content}
        </p>
      ) : null}
    </section>
  );
}