import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type UserPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

type AuthorPost = {
  id: number;
  content: string;
  created_at: string;
};

const formatCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));

export default async function UserPage({ params }: UserPageProps) {
  const { userId } = await params;

  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", userId)
    .maybeSingle();

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const AuthorPosts = (posts ?? []) as AuthorPost[];

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-gray-500 transition hover:text-emerald-500"
      >
        ← 홈으로 돌아가기
      </Link>

      {profileError ? (
        <p className="text-sm text-red-500">
          작성자 정보를 불러오지 못했습니다.
        </p>
      ) : profile ? (
        <>
          <header className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {profile.nickname}의 기록
            </h1>

            <p className="mt-2 text-sm text-emerald-700">
                총 {AuthorPosts.length}개의 하루를 남겼어요.
            </p>
          </header>

          <section className="mt-8">
            {postsError ? (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-500">
                기록을 불러오지 못했습니다.
              </p>
            ) : AuthorPosts.length === 0 ? (
              <p className="rounded-2xl border bg-white px-6 py-10 text-center text-sm text-gray-500">
                아직 작성한 기록이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {AuthorPosts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-2xl border bg-white p-4"
                  >
                    <p className="whitespace-pre-wrap break-words text-gray-700">
                      {post.content}
                    </p>

                    <time
                      dateTime={post.created_at}
                      className="mt-2 block text-xs text-gray-400"
                    >
                      {formatCreatedAt(post.created_at)}
                    </time>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <p className="text-sm text-gray-500">작성자를 찾을 수 없습니다.</p>
      )}
    </main>
  );
}
