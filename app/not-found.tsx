import Link from "next/link";

export default function NotFound(){
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-12 text-gray-800">
            <section className="w-full max-w-lg rounded-3xl border bg-white px-6 py-12 text-center shadow-sm">
                <p className="text-sm font-semibold text-emerald-600">
                    할로하루 · 404
                </p>

                <h1 className="mt-4 text-2xl font-bold">
                    페이지를 찾을 수 없어요
                </h1>

                <p className="mt-4 text-sm leading-6 text-gray-500">
                    주소가 올바르지 않거나,
                    <br/>
                    현재 확인할 수 없는 페이지예요.
                </p>

                <Link
                    href="/"
                    className="mt-8 inline-block rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                    하루 기록으로 돌아가기
                </Link>
            </section>
        </main>
    );
}