"use client";

import Link from "next/link";
import {
  type SubmitEvent,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");

  const [isSessionLoading, setIsSessionLoading] =
    useState(true);
  const [hasValidSession, setHasValidSession] =
    useState(false);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        setMessage(
          "비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.",
        );
        setIsError(true);
      } else {
        setHasValidSession(true);
      }

      setIsSessionLoading(false);
    };

    checkSession();
  }, []);

  const handleUpdatePassword = async (
    event: SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting || !hasValidSession) {
      return;
    }

    if (password !== passwordConfirmation) {
      setMessage("비밀번호가 서로 일치하지 않습니다.");
      setIsError(true);
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("비밀번호 변경 실패:", error);

        setMessage(
          "비밀번호를 변경하지 못했습니다. 다시 시도해 주세요.",
        );
        setIsError(true);
        return;
      }

      const { error: signOutError } =
        await supabase.auth.signOut({
          scope: "local",
        });

      if (signOutError) {
        console.error(
          "비밀번호 변경 후 로그아웃 실패:",
          signOutError,
        );
      }

      setPassword("");
      setPasswordConfirmation("");
      setIsComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-6 text-[#333333]">
        <section className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-bold">
            비밀번호 변경 완료
          </h1>

          <p className="mt-4 text-sm text-emerald-600">
            새 비밀번호가 저장되었습니다.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-emerald-400 px-5 py-2 font-semibold text-white transition hover:bg-emerald-500"
          >
            새 비밀번호로 로그인
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-6 text-[#333333]">
      <section className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-center text-2xl font-bold">
          새 비밀번호 설정
        </h1>

        <p className="mt-2 text-center text-sm text-gray-500">
          앞으로 사용할 새 비밀번호를 입력해 주세요.
        </p>

        <form
          onSubmit={handleUpdatePassword}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              새 비밀번호
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
              disabled={
                isSessionLoading || !hasValidSession
              }
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-400 disabled:bg-gray-100"
              placeholder="8자 이상 입력"
            />
          </div>

          <div>
            <label
              htmlFor="password-confirmation"
              className="mb-2 block text-sm font-medium"
            >
              새 비밀번호 확인
            </label>

            <input
              id="password-confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(event) =>
                setPasswordConfirmation(event.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
              disabled={
                isSessionLoading || !hasValidSession
              }
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-400 disabled:bg-gray-100"
              placeholder="새 비밀번호 다시 입력"
            />
          </div>

          <button
            type="submit"
            disabled={
              isSessionLoading ||
              !hasValidSession ||
              isSubmitting
            }
            className={`w-full rounded-full py-3 font-semibold text-white transition ${
              isSessionLoading ||
              !hasValidSession ||
              isSubmitting
                ? "cursor-not-allowed bg-gray-300"
                : "bg-emerald-400 hover:bg-emerald-500"
            }`}
          >
            {isSessionLoading
              ? "인증 확인 중..."
              : isSubmitting
                ? "변경 중..."
                : "비밀번호 변경"}
          </button>
        </form>

        {message && (
          <p
            aria-live="polite"
            className={`mt-4 text-center text-sm ${
              isError
                ? "text-red-500"
                : "text-emerald-600"
            }`}
          >
            {message}
          </p>
        )}

        {!isSessionLoading && !hasValidSession && (
          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-gray-500 hover:text-emerald-600"
            >
              재설정 이메일 다시 받기
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}