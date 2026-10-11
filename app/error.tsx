"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
};

export default function ErrorPage({ error }: ErrorPageProps) {
  useEffect(() => {
    console.error("페이지 오류 : ", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-12 text-gray-800">
      <section className="w-full max-w-lg rounded-3xl border bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-semibold text-emerald-600">할로하루</p>

        <h1 className="mt-4 text-2xl font-bold">페이지를 불러오지 못했어요</h1>

        <p className="mt-4 text-sm leading-6 text-gray-500">
          일시적인 문제가 발생했어요.
          <br />
          잠시 후 다시 시도해 주세요.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            다시 시도
          </button>

          <Link
            href="/"
            className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            하루 기록으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
