export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#333333]">
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <h1 className="text-2xl font-bold text-emerald-400">할로하루</h1>
        <button className="rounded-full border px-4 py-2 text-sm">
          로그인
        </button>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold">
          오늘 하루, 가볍게 남겨보세요.
        </h2>

        <p className="mt-4 text-gray-600">
          부담 없이 기록하고, 가볍게 공감받는 하루 기록 공간
        </p>

        <div className="mt-10 rounded-2xl bg-white p-5 shadow-sm border">
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
      </section>
    </main>
  );
}