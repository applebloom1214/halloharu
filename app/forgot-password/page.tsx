import Link from "next/link";

export default function ForgotPasswordPage(){
    return(
        <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-6 text-[#333333]">
            <section className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
                <h1 className="text-center text-2xl font-bold">
                    비밀번호 재설정
                </h1>

                <p className="mt-2 text-center text-sm text-gray-500">
                    가입한 이메일 주소를 입력해 주세요.
                </p>

                <form className="mt-8 space-y-5">
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
                            autoComplete="email"
                            required
                            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-400"
                            placeholder="example@email.com"
                        />
                    </div>

                    <button
                        type="button"
                        disabled
                        className="w-full cursor-not-allowed rounded-full bg-gray-300 py-3 font-semibold text-white"
                    >
                        재설정 이메일 보내기
                    </button>
                </form>

                <p className="mt-4 text-center text-xs text-gray-400">
                    이메일 발송 기능은 다음 단계에서 연결합니다.
                </p>

                <div className="mt-6 text-center">
                    <Link
                        href="/login"
                        className="text-sm text-gray-500 hover:text-emerald-600">
                            로그인으로 돌아가기
                    </Link>
                </div>
            </section>
        </main>

    );
}