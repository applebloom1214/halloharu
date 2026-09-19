import Link from "next/link";
import HumorPromptForm from "@/components/HumorPromptForm";

import { createClient } from "@/lib/supabase/server";

export default async function AdminHumorPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();

  const currentUserId =
    typeof claimsData?.claims.sub === "string"
      ? claimsData.claims.sub
      : null;

  if (currentUserId === null) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
        <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">
            유머 주제 관리
          </h1>

          <p className="mt-4 text-sm text-gray-500">
            관리자 로그인이 필요합니다.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block font-semibold text-emerald-600"
          >
            로그인하기 →
          </Link>
        </section>
      </main>
    );
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (adminError) {
    console.error("관리자 권한 확인 실패:", adminError);

    return (
      <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
        <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-red-500">
            관리자 권한을 확인하지 못했습니다.
          </p>
        </section>
      </main>
    );
  }

  if (admin === null) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
        <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">
            접근 권한 없음
          </h1>

          <p className="mt-4 text-sm text-gray-500">
            관리자만 유머 주제를 관리할 수 있습니다.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block font-semibold text-emerald-600"
          >
            홈으로 돌아가기 →
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
      <section className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm text-gray-500 transition hover:text-emerald-600"
        >
          ← 홈으로 돌아가기
        </Link>

        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">
            유머 주제 관리
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            이번 주 제목짓기에 사용할 사진을 등록하는 관리자 페이지입니다.
          </p>

          <HumorPromptForm currentUserId={currentUserId}/>
        </div>
      </section>
    </main>
  );
}