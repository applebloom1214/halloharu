"use client";
import Image from "next/image";
import Link from "next/link";

import { useEffect, useState } from "react";

import PostCard from "../components/PostCard";
import { createClient } from "@/lib/supabase/client";

type Post = {
  id: number;
  content: string;
  empathyCount: number;
  cheerCount: number;
  smileCount: number;
  isEmpathized: boolean;
  isCheered: boolean;
  isSmiled: boolean;
  createdAt: string;
};

type DatabasePost = {
  id: number;
  content: string;
  empathy_count: number;
  cheer_count: number;
  smile_count: number;
  created_at: string;
};

type ReactionType = "empathy" | "cheer" | "smile";

const MAX_CONTENT_LENGTH = 300;

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          id,
          content,
          empathy_count,
          cheer_count,
          smile_count,
          created_at
          `,
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });

      if (error) {
        console.error("게시글 불러오기 실퍠:", error);
        return;
      }

      const databasePosts = (data ?? []) as DatabasePost[];

      const convertedPosts: Post[] = databasePosts.map((post) => ({
        id: post.id,
        content: post.content,
        empathyCount: post.empathy_count,
        cheerCount: post.cheer_count,
        smileCount: post.smile_count,
        isEmpathized: false,
        isCheered: false,
        isSmiled: false,
        createdAt: post.created_at,
      }));

      setPosts(convertedPosts);
    };

    fetchPosts();
  }, []);

  const handleSubmit = async () => {
    const trimmedContent = content.trim();

    if (trimmedContent === "" || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .insert({
          content: trimmedContent,
        })
        .select(
          `
          id,
          content,
          empathy_count,
          cheer_count,
          smile_count,
          created_at
        `,
        )
        .single();

      if (error) {
        console.error("저장된 게시글을 받지 못했습니다.");
        return;
      }

      if (!data) {
        console.error("저장된 게시글을 받지 못했습니다.");
        return;
      }

      const databasePost = data as DatabasePost;

      const newPost: Post = {
        id: databasePost.id,
        content: databasePost.content,
        empathyCount: databasePost.empathy_count,
        cheerCount: databasePost.cheer_count,
        smileCount: databasePost.smile_count,
        isEmpathized: false,
        isCheered: false,
        isSmiled: false,
        createdAt: databasePost.created_at,
      };

      setPosts((previousPosts) => [newPost, ...previousPosts]);

      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (postId: number, reactionType: ReactionType) => {
    const targetPost = posts.find((post) => post.id === postId);

    if (!targetPost) {
      return;
    }

    let reactionColumn: "empathy_count" | "cheer_count" | "smile_count";

    let nextCount: number;

    if (reactionType === "empathy") {
      reactionColumn = "empathy_count";

      nextCount = targetPost.isEmpathized
        ? Math.max(targetPost.empathyCount - 1, 0)
        : targetPost.empathyCount + 1;
    } else if (reactionType === "cheer") {
      reactionColumn = "cheer_count";

      nextCount = targetPost.isCheered
        ? Math.max(targetPost.cheerCount - 1, 0)
        : targetPost.cheerCount + 1;
    } else {
      reactionColumn = "smile_count";

      nextCount = targetPost.isSmiled
        ? Math.max(targetPost.smileCount - 1, 0)
        : targetPost.smileCount + 1;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("posts")
      .update({
        [reactionColumn]: nextCount,
      })
      .eq("id", postId)
      .select(
        `
          empathy_count,
          cheer_count,
          smile_count
        `,
      )
      .single();

    if (error) {
      console.error("리액션 변경 실패:", error);
      return;
    }

    setPosts((previousPosts) =>
      previousPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              empathyCount: data.empathy_count,
              cheerCount: data.cheer_count,
              smileCount: data.smile_count,

              isEmpathized:
                reactionType === "empathy"
                  ? !post.isEmpathized
                  : post.isEmpathized,

              isCheered:
                reactionType === "cheer" ? !post.isCheered : post.isCheered,

              isSmiled:
                reactionType === "smile" ? !post.isSmiled : post.isSmiled,
            }
          : post,
      ),
    );
  };

  const handleDelete = async (postId: number) => {
    const shouldDelete = window.confirm("이 게시글을 정말 삭제하시겠습니까 ?");

    if (!shouldDelete) {
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      console.error("게시글 삭제 실퍠:", error);
      return;
    }

    setPosts((previousPosts) =>
      previousPosts.filter((post) => post.id !== postId),
    );
  };

  const handleUpdate = async (
    postId: number,
    updatedContent: string,
  ): Promise<boolean> => {
    const trimmedContent = updatedContent.trim();

    if (trimmedContent === "") {
      return false;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("posts")
      .update({
        content: trimmedContent,
      })
      .eq("id", postId)
      .select("content")
      .single();

    if (error) {
      console.error("게시글 수정 실패:", error);
      return false;
    }

    setPosts((previousPosts) =>
      previousPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              content: trimmedContent,
            }
          : post,
      ),
    );

    return true;
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#333333]">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <Image
          src="/halloharu-logo.png"
          alt="할로하루 로고"
          height={40}
          width={200}
          className="h-11 w-auto"
        />

        <div className="flex gap-2">
          <Link href="/login" className="rounded-full border px-4 py-2 text-sm">
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-white"
          >
            회원가입
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold">오늘 하루, 가볍게 남겨보세요.</h2>

        <p className="mt-4 text-gray-600">
          부담 없이 기록하고, 가볍게 공감받는 하루 기록 공간
        </p>

        <div className="mt-10 rounded-2xl border bg-white p-5 shadow-sm">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={MAX_CONTENT_LENGTH}
            className="h-32 w-full resize-none rounded-xl border p-4 outline-none focus:border-emerald-400"
            placeholder="오늘은 어떤 하루였나요? ^^"
          />

          <div className="mt-4 flex item-center justify-between">
            <span className="text-sm text-gray-400">
              {content.length} / {MAX_CONTENT_LENGTH}
            </span>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={content.trim() === "" || isSubmitting}
              className={`rounded-full px-5 py-2 font-semibold text-white transition ${
                content.trim() === "" || isSubmitting
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-emerald-400 hover:bg-emerald-500"
              }`}
            >
              {isSubmitting ? "저장 중..." : "하루 남기기"}
            </button>
          </div>
        </div>

        <div className="mt-12 text-left">
          <h3 className="mb-4 text-lg font-semibold">최근 올라온 하루</h3>

          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                content={post.content}
                createdAt={post.createdAt}
                empathyCount={post.empathyCount}
                cheerCount={post.cheerCount}
                smileCount={post.smileCount}
                isEmpathized={post.isEmpathized}
                isCheered={post.isCheered}
                isSmiled={post.isSmiled}
                onEmpathyClick={() => handleReaction(post.id, "empathy")}
                onCheerClick={() => handleReaction(post.id, "cheer")}
                onSmileClick={() => handleReaction(post.id, "smile")}
                onDeleteClick={() => handleDelete(post.id)}
                onUpdate={(updatedContent) =>
                  handleUpdate(post.id, updatedContent)
                }
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
