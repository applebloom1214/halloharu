import Link from "next/link";

export default function AuthErrorPage(){
    return(
        <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-6 text-[#333333]">
            <section className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
               <h1 className="text-2xl font-bold">이메일 인증 실패</h1>

               <p className="mt-4 text-sm leading-6 text-gray-500">
                인증 링크가 만료되었거나 이미 사용된 링크일 수 있습니다.
                <br/>
                회원가입을 다시 시도해 주세요. 
               </p> 

               <div className="mt-8 flex flex-col gap-3">
                    <Link
                        href="/signup"
                        className="rounded-full bg-emerald-400 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500"
                    >
                        회원가입 다시 시도    
                    </Link>    

                    <Link
                        href="/login"
                        className="rounded-full border px-4 py-3 text-sm text-gray-600 transition hover:border-emerald-400 hover:text-emerald-600"
                    >
                        로그인으로 이동
                    </Link>
               </div>
            </section>
        </main>
    );
}