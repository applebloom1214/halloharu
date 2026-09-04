import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CommentForm from "@/components/CommentForm";
import CommentDeleteButton from "@/components/CommentDeleteButton";

type PostDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type CommentAuthor = {
  nickname: string;
};

type CommentWithAuthor = {
  id : number;
  user_id : string;
  content : string;
  created_at : string;
  author : CommentAuthor | CommentAuthor[] | null;
};

const getCommentAuthorNickname = (
  author: CommentWithAuthor["author"],
) => {
  if (Array.isArray(author)) {
    return author[0]?.nickname ?? "알 수 없는 사용자";
  }

  return author?.nickname ?? "알 수 없는 사용자";
};


export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const postId = Number(id);

  if (!Number.isInteger(postId) || postId <= 0) {
    notFound();
  }

  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();

  const currentUserId = claimsData?.claims.sub ?? null;

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(
      `
        id,
        user_id,
        content,
        comments_enabled,
        created_at
      `,
    )
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    console.error("게시글 상세 조회 실패:", postError);
    throw new Error("게시글을 불러오지 못했습니다.");
  }

  if (post === null) {
    notFound();
  }

  let authorNickname = "알 수 없는 사용자";

  if (post.user_id !== null) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", post.user_id)
      .maybeSingle();

    if (profileError) {
      console.error("게시글 작성자 조회 실패:", profileError);
    } else if (profile !== null) {
      authorNickname = profile.nickname;
    }
  }

  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select(
      `
        id,
        user_id,
        content,
        created_at,
        author:profiles!comments_user_id_fkey(
          nickname
        )
      `,
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (commentsError) {
    console.error("댓글 목록 조회 실패 : ", commentsError);
    throw new Error("댓글을 불러오지 못했습니다.");
  }

  const commentList = (comments ?? []) as CommentWithAuthor[];

  const formattedCreatedAt = new Date(post.created_at).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-6 py-12 text-[#333333]">
      <section className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm text-gray-500 transition hover:text-emerald-600"
        >
          ← 기록 목록으로
        </Link>

        <article className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="font-semibold text-emerald-600">{authorNickname}</p>

            <time className="text-xs text-gray-400">{formattedCreatedAt}</time>
          </div>

          <p className="mt-5 whitespace-pre-wrap break-words leading-7 text-gray-700">
            {post.content}
          </p>

          <div className="mt-6 border-t pt-4">
            <p className="text-sm text-gray-500">
              {post.comments_enabled
                ? "댓글을 작성할 수 있는 기록입니다."
                : "작성자가 댓글을 받지 않는 기록입니다."}
            </p>
          </div>
        </article>

        <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">
            댓글 {commentList.length}
          </h2>

          {commentList.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">
              {post.comments_enabled
                ? "아직 댓글이 없습니다."
                : "작성자가 댓글을 받지 않는 기록입니다."}
            </p>
          ) : (
            <ul className="mt-4 divide-y">
              {commentList.map((comment) => (
                <li key={comment.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-emerald-600">
                      {getCommentAuthorNickname(comment.author)}
                    </p>

                    <div className="flex shrink-0 items-center gap-3">
                      <time className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleString("ko-KR", {
                          timeZone: "Asia/Seoul",
                        })}
                      </time>

                      {currentUserId !== null &&
                        (currentUserId === comment.user_id ||
                          currentUserId === post.user_id) && (
                          <CommentDeleteButton commentId={comment.id} />
                        )}
                    </div>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                    {comment.content}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {post.comments_enabled && (
            <CommentForm postId={post.id} currentUserId={currentUserId} />
          )}
        </section>
      </section>
    </main>
  );
}
