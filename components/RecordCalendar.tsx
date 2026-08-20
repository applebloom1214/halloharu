"use client";

import { useState } from "react";

type RecordCalendarProps = {
  recordedDates: string[];
  monthKey: string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function RecordCalendar({
  recordedDates,
  monthKey,
}: RecordCalendarProps) {
  const [displayedMonth, setDisplayedMonth] = useState(monthKey);

  const [year, month] = displayedMonth.split("-").map(Number);

  const isCurrentMonth = displayedMonth === monthKey;

  const changeMonth = (monthOffset: number) => {
    const changeDate = new Date(Date.UTC(year, month - 1 + monthOffset, 1));

    const changedMonth = `${changeDate.getUTCFullYear()}-${String(
      changeDate.getUTCMonth() + 1,
    ).padStart(2, "0")}`;

    setDisplayedMonth(changedMonth);
  };

  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const calendarDays = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const recordedDateSet = new Set(recordedDates);

  return (
    <section className="mx-auto mt-4 mb-4 w-full max-w-sm rounded-2xl border border-orange-100 bg-orange-50/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">나의 기록 달력</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="이전 달"
            className="rounded-full px-2 py-1 text-gray-500 hover:bg-orange-100"
          >
            ←
          </button>

          <p className="text-sm text-gray-500">
            {year}년 {month}월
          </p>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            disabled={isCurrentMonth}
            aria-label="다음 달"
            className="rounded-full px-2 py-1 text-gray-500 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            →
          </button>
        </div>
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
