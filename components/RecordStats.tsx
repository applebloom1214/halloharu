type RecordStatsProps = {
  currentStreak: number;
  totalRecordCount: number;
  hasPostedToday: boolean;
};

export default function RecordStats({
  currentStreak,
  totalRecordCount,
  hasPostedToday,
}: RecordStatsProps) {
  return (
    <div className="mx-auto mb-4 w-full max-w-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-3 text-center">
          <p className="text-xs font-medium text-orange-600">🔥 연속 기록</p>

          <p className="mt-1 text-orange-700">
            <span className="text-2xl font-bold">{currentStreak}</span>
            <span className="ml-1 text-sm">일</span>
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-center">
          <p className="text-xs font-medium text-emerald-600">📝 총 기록</p>

          <p className="mt-1 text-emerald-700">
            <span className="text-2xl font-bold">{totalRecordCount}</span>
            <span className="ml-1 text-sm">일</span>
          </p>
        </div>
      </div>

      <p
        className={`mt-2 text-center text-xs font-medium ${
          hasPostedToday ? "text-orange-600" : "text-gray-400"
        }`}
      >
        {hasPostedToday
          ? "✓ 오늘의 기록을 완료했어요."
          : "오늘의 기록을 남겨 연속 기록을 이어가세요."}
      </p>
    </div>
  );
}