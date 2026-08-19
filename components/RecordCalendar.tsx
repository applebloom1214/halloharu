type RecordCalendarProps = {
  recordedDates: string[];
  monthKey: string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function RecordCalendar({
  recordedDates,
  monthKey,
}: RecordCalendarProps) {
  const [year, month] = monthKey.split("-").map(Number);

  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const calendarDays = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const recordedDateSet = new Set(recordedDates);

  return (
    <section className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">나의 기록 달력</h2>
        <p className="text-sm text-gray-500">
          {year}년 {month}월
        </p>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-gray-400">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="py-2">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} aria-hidden="true" />;
          }

          const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(
            day,
          ).padStart(2, "0")}`;

          const isRecorded = recordedDateSet.has(dateKey);

          return (
            <div
              key={dateKey}
              title={isRecorded ? `${dateKey} 기록 완료` : undefined}
              className={`flex aspect-square items-center justify-center rounded-full text-sm ${
                isRecorded
                  ? "bg-orange-500 font-semibold text-white"
                  : "text-gray-600"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </section>
  );
}
