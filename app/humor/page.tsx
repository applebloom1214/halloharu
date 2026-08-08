import Link from "next/link";

export default function HumorPage(){
    return(
        <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-6 text-[#333333]">
            <section className="w-full max-w-lg rounded-3xl border bg-white px-8 py-14 text-center shadow-sm">
                <div className="text-5xl" aria-hidden="true">
                    😄
                </div>

                <p className="mt-6 text-sm font-semibold text-emerald-500">
                    COMING SOON
                </p>

                <h1 className="mt-2 text-3xl font-bold">
                    유머 공간을 준비하고 있어요
                </h1>

                <p className="mt-4 leading-7 text-gray-500">
                    평범한 하루에 가벼운 웃음을 더할 수 있는 공간으로 찾아올게요.
                </p>

                <Link
                    href="/"
                    className="mt-8 inline-block rounded-full bg-emerald-400 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-500"
                >
                    하루 기록으로 돌아가기     
                </Link>
            </section>
        </main>
    );
}