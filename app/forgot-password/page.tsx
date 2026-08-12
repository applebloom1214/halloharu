"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import Link from "next/link";
import { type SubmitEvent, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const handleResetPassword = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!captchaToken) {
      setMessage("사람 인증을 완료해 ㅈ세요.");
      setIsError(true);
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/confirm?next=/update-password`,
          captchaToken,
        },
      );

      if (error) {
        console.error("비밀번호 재설정 이메일 요청 실패 : ", error);

        setMessage(
          "재설정 이메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
        setIsError(true);
        return;
      }

      setMessage(
        "입력한 이메일이 가입되어 있다면 비밀번호 재설정 메일을 보냈씁니다.",
      );
      setEmail("");
    } finally {
      setIsSubmitting(false);
      setCaptchaToken("");
      turnstileRef.current?.reset();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-6 text-[#333333]">
      <section className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-center text-2xl font-bold">비밀번호 재설정</h1>

        <p className="mt-2 text-center text-sm text-gray-500">
          가입한 이메일 주소를 입력해 주세요.
        </p>

        <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              이메일
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-400"
              placeholder="example@email.com"
            />
          </div>

          <div className="flex justify-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken("")}
              onError={() => setCaptchaToken("")}
              options={{
                theme: "light",
                size: "flexible",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !captchaToken}
            className={`w-full rounded-full py-3 font-semibold text-white transition ${
              isSubmitting || !captchaToken
                ? "cursor-not-allowed bg-gray-300"
                : "bg-emerald-400 hover:bg-emerald-500"
            }`}
          >
            {isSubmitting ? "전송 중..." : "재설정 이메일 보내기"}
          </button>
        </form>

        {message &&(
            <p
                aria-live="polite"
                className={`mt-4 text-center text-sm ${
                    isError ? "text-red-500" : "text-emerald-600"
                }`}
            >
                {message}
            </p>    
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-emerald-600"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
