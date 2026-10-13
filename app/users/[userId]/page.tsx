import Link from "next/link";

import AuthorPostList, {
  type AuthorPost,
} from "@/components/AuthorPostList";
import { createClient } from "@/lib/supabase/server";

type UserPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

const POSTS_PER_PAGE = 10;

export default async function UserPage({ params }: UserPageProps) {
  const { userId } = await params;

  const supabase = await createClient();

  const [
    { data: profile, error: profileError },
    { data: posts, error: postsError, count: totalPostCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("nickname")
      .eq("id", userId)
      .maybeSingle(),

    supabase
      .from("posts")
      .select("id, content, image_path, created_at", {
        count: "exact",
      })
      .eq("user_id", userId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(0, POSTS_PER_PAGE),
  ]);

  const fetchedPosts = (posts ?? []) as AuthorPost[];
  const initialPosts = fetchedPosts.slice(0, POSTS_PER_PAGE);
  const initialHasMore = fetchedPosts.length > POSTS_PER_PAGE;

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
              {postsError || totalPostCount === null
                ? "총 기록 수를 불러오지 못했습니다."
                : `총 ${totalPostCount}개의 하루를 남겼어요.`}
            </p>
          </header>

          <section className="mt-8">
            {postsError ? (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-500">
                기록을 불러오지 못했습니다.
              </p>
            ) : initialPosts.length === 0 ? (
              <p className="rounded-2xl border bg-white px-6 py-10 text-center text-sm text-gray-500">
                아직 작성한 기록이 없습니다.
              </p>
            ) : (
              <AuthorPostList
                key={userId}
                userId={userId}
                initialPosts={initialPosts}
                initialHasMore={initialHasMore}
              />
            )}
          </section>
        </>
      ) : (
        <p className="text-sm text-gray-500">
          작성자를 찾을 수 없습니다.
        </p>
      )}
    </main>
  );
}