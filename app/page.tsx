export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#333333]">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-emerald-400">할로하루</h1>

        <div className="flex gap-2">
          <button className="rounded-full border px-4 py-2 text-sm">
            로그인
          </button>
          <button className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-white">
            회원가입
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold">
          오늘 하루, 가볍게 남겨보세요.
        </h2>

        <p className="mt-4 text-gray-600">
          부담 없이 기록하고, 가볍게 공감받는 하루 기록 공간
        </p>

        <div className="mt-10 rounded-2xl border bg-white p-5 shadow-sm">
          <textarea
            className="h-32 w-full resize-none rounded-xl border p-4 outline-none focus:border-emerald-400"
            placeholder="오늘은 어떤 하루였나요?"
          />

          <div className="mt-4 flex justify-end">
            <button className="rounded-full bg-emerald-400 px-5 py-2 font-semibold text-white">
              하루 남기기
            </button>
          </div>
        </div>

        <div className="mt-12 text-left">
          <h3 className="mb-4 text-lg font-semibold">최근 올라온 하루</h3>

          <div className="space-y-3">
            <div className="rounded-2xl border bg-white p-4">
              <p>오늘은 별일 없었지만 퇴근길 바람이 좋았다.</p>
              <div className="mt-3 text-sm text-gray-500">
                🌱 공감 12 · 💪 응원 3 · 😊 미소 5
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p>아무것도 안 한 것 같지만 그래도 하루를 버텼다.</p>
              <div className="mt-3 text-sm text-gray-500">
                🌱 공감 8 · 💪 응원 6 · 😊 미소 2
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}