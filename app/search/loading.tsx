export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
      <section
        role="status"
        aria-live="polite"
        className="mx-auto max-w-2xl"
      >
        <span className="sr-only">
          검색 결과를 불러오는 중입니다.
        </span>

        <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />

        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="h-8 w-28 animate-pulse rounded bg-gray-200" />

          <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-gray-100" />

          <div className="mt-6 flex gap-2">
            <div className="h-10 flex-1 animate-pulse rounded-full bg-gray-100" />

            <div className="h-10 w-20 animate-pulse rounded-full bg-emerald-200" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <div className="flex justify-between gap-3">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
              </div>

              <div className="mt-4 h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
       </div>
      </section>
    </main>
  );
}