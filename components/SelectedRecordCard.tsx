import Image from "next/image";

type SelectedRecordCardProps = {
  selectedDate: string;
  content: string | null;
  imageUrl : string | null;
  isLoading: boolean;
  errorMessage: string | null;
};

export default function SelectedRecordCard({
  selectedDate,
  content,
  imageUrl,
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
        <>
        <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
          {content}
        </p>

        {imageUrl && (
          <div className="relative mt-3 h-56 overflow-hidden rounded-xl bg-gray-50">
            <Image
              src={imageUrl}
              alt="선택한 날짜의 기록 사진"
              fill
              unoptimized
              sizes="(max-width:384px) 100vw, 384px"
              className="object-contain"
            />
          </div>
        )}
        </>
      ) : null}
    </section>
  );
}