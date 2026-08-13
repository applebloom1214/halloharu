"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!captchaToken) {
      setMessage("사람 인증을 완료해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        options: {
          captchaToken,
        },
      });

      if (error) {
        console.error("로그인 실패:", error);

        setMessage("이메일 또는 비밀번호를 확인해 주세요.");
        return;
      }

      router.replace("/");
      router.refresh();
    } finally {
      setIsSubmitting(false);
      setCaptchaToken("");
      turnstileRef.current?.reset();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-6 text-[#333333]">
      <section className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-center text-2xl font-bold">할로하루 로그인</h1>

        <p className="mt-2 text-center text-sm text-gray-500">
          가입한 이메일과 비밀번호를 입력해 주세요.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
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

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              비밀번호
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-400"
              placeholder="비밀번호 입력"
            />

            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-gray-400 hover:text-emerald-600">
                  비밀번호를 잊으셨나요 ?
              </Link>
            </div>
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
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {message && (
          <p
            aria-live="polite"
            className="mt-4 text-center text-sm text-red-500"
          >
            {message}
          </p>
        )}

        <div className="mt-6 flex justify-center gap-4 text-sm">
          <Link href="/signup" className="text-gray-500 hover:text-emerald-600">
            회원가입
          </Link>

          <Link href="/" className="text-gray-500 hover:text-emerald-600">
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
