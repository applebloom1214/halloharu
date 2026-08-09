"use client";

import Link from "next/link";
import { type SubmitEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function SignupPage(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation]= useState("");

    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSignUp = async(
        event : SubmitEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if(isSubmitting){
            return;
        }

        if (password !== passwordConfirmation){
            setMessage("비밀번호가 서로 일치하지 않습니다.");
            setIsError(true);
            return;
        }

        setIsSubmitting(true);
        setMessage("");
        setIsError(false);

        try{
            const supabase = createClient();

            const {data, error} = await supabase.auth.signUp({
                email : email.trim(),
                password,
                options : {
                    emailRedirectTo : `${window.location.origin}/auth/confirm`,
                },
            });

            if(error){
                console.error("회원가입 실패:" , error);

                setMessage(`회원가입 실퍠: ${error.message}`);
                setIsError(true);
                return;
            }

            if(data.session){
                setMessage(
                    "회원가입이 완료되었습니다. 현재 로그인 상태입니다.",
                );
            }else{
                setMessage(
                    "회원가입 요청이 완료되었습니다. 이메일을 확인해 주세요.",
                );
            }

            setEmail("");
            setPassword("");
            setPasswordConfirmation("");
        }finally{
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-6 text-[#333333]">
            <section className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
                <h1 className="text-center text-2xl font-bold">
                    할로하루 회원가입
                </h1>

                <p className="mt-2 text-center text-sm text-gray-500">
                    이메일과 비밀번호로 가입해 주세요.
                </p>          
                
                <form
                    onSubmit={handleSignUp}
                    className="mt-8 space-y-5"
                >
                    <div>
                        <label 
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium"
                        >
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
                            autoComplete="new-password"
                            minLength={8}
                            required
                            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-400"
                            placeholder="8자 이상 입력"
                        />
                    </div>


                    <div>
                        <label
                          htmlFor="password-confirmation"
                          className="mb-2 block text-sm font-medium"
                        >
                             비밀번호 확인
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
                          className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-400"
                          placeholder="비밀번호 다시 입력"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full rounded-full py-3 font-semibold text-white transition ${
                          isSubmitting
                            ? "cursor-not-allowed bg-gray-300"
                            : "bg-emerald-400 hover:bg-emerald-500"
                        }`}
                    >
                        {isSubmitting ? "가입 중..." : "회원 가입"}
                    </button>
                </form>
                
                {message && (
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
                        href="/"
                        className="text-sm text-gray-500 hover:text-emerald-600"
                    >
                        홈으로 돌아가기    
                    </Link>    
                </div>
            </section>        
        </main>
    );
}