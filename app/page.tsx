"use client";
import Image from "next/image";
import Link from "next/link";

import { useEffect, useRef, useState } from "react";

import PostCard from "../components/PostCard";
import { createClient } from "@/lib/supabase/client";

type Post = {
  id: number;
  userId: string | null;
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
  user_id: string | null;
  content: string;
  created_at: string;
  reactions?: DatabaseReaction[];
};

type ReactionType = "empathy" | "cheer" | "smile";

const createReactionKey = (
  postId : number,
  reactionType : ReactionType,
) => `${postId}:${reactionType}`;

type DatabaseReaction = {
  user_id: string;
  reaction_type: ReactionType;
};

const MAX_CONTENT_LENGTH = 300;

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [pendingReactionsKeys, setPendingReactionKeys] = useState<Set<string>>(
    new Set(),
  );

  const pendingReactionsKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const fetchPosts = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          id,
          user_id,
          content,
          created_at,
          reactions(
            user_id,
            reaction_type
          )
          `,
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });

      if (error) {
        console.error("게시글 불러오기 실퍠:", error);
        return;
      }

      const databasePosts = (data ?? []) as DatabasePost[];

      const convertedPosts: Post[] = databasePosts.map((post) => {
        const reactions = post.reactions ?? [];

        const empathyCount = reactions.filter(
          (reaction) => reaction.reaction_type === "empathy",
        ).length;

        const cheerCount = reactions.filter(
          (reaction) => reaction.reaction_type === "cheer",
        ).length;

        const smileCount = reactions.filter(
          (reaction) => reaction.reaction_type === "smile",
        ).length;

        const isEmpathized =
          userId !== null &&
          reactions.some(
            (reaction) =>
              reaction.user_id === userId &&
              reaction.reaction_type === "empathy",
          );

        const isCheered =
          userId !== null &&
          reactions.some(
            (reaction) =>
              reaction.user_id === userId && 
              reaction.reaction_type === "cheer",
          );

        const isSmiled =
          userId !== null &&
          reactions.some(
            (reaction) =>
              reaction.user_id === userId && reaction.reaction_type === "smile",
          );

        return {
          id: post.id,
          userId: post.user_id,
          content: post.content,
          empathyCount,
          cheerCount,
          smileCount,
          isEmpathized,
          isCheered,
          isSmiled,
          createdAt: post.created_at,
        };
      });

      setPosts(convertedPosts);
    };

    fetchPosts();
  }, [isAuthLoading, userId]);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();

      try {
        const { data } = await supabase.auth.getUser();

        setUserEmail(data.user?.email ?? null);
        setUserId(data.user?.id ?? null);
      } finally {
        setIsAuthLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      console.error("로그아웃 실패:", error);
      setIsSigningOut(false);
      return;
    }

    window.location.href = "/";
  };

  const handleSubmit = async () => {
    const trimmedContent = content.trim();

    if (trimmedContent === "" || isSubmitting) {
      return;
    }

    if (!userId) {
      console.error("로그인한 사용자만 게시글을 저장할 수 있습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .insert({
          content: trimmedContent,
          user_id: userId,
        })
        .select(
          `
          id,
          user_id,
          content,
          created_at
        `,
        )
        .single();

      if (error) {
        console.error("게시글 저장 실퍠:", error);
        return;
      }

      if (!data) {
        console.error("저장된 게시글을 받지 못했습니다.");
        return;
      }

      const databasePost = data as DatabasePost;

      const newPost: Post = {
        id: databasePost.id,
        userId: databasePost.user_id,
        content: databasePost.content,
        empathyCount: 0,
        cheerCount: 0,
        smileCount: 0,
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

  const handleReaction = async (
    postId: number,
    reactionType: ReactionType,
  ) => {
    if(!userId){
      window.alert("리액션을 남기려면 로그인이 필요합니다.");
      return;
    }

    const targetPost = posts.find((post) => post.id === postId);

    if (!targetPost) {
      return;
    }

    const reactionKey = createReactionKey(postId, reactionType);

    if(pendingReactionsKeysRef.current.has(reactionKey)){
      return;
    }

    pendingReactionsKeysRef.current.add(reactionKey);
    setPendingReactionKeys(new Set(pendingReactionsKeysRef.current));

    try{
    const isSelected =
      reactionType === "empathy"
        ? targetPost.isEmpathized
        : reactionType === "cheer"
          ? targetPost.isCheered
          : targetPost.isSmiled;

    const supabase = createClient();

    const { error } = isSelected
      ? await supabase
      .from("reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("reaction_type", reactionType)
      : await supabase.from("reactions").insert({
          post_id : postId,
          user_id : userId,
          reaction_type : reactionType,
      });

    if (error) {
      console.error("리액션 변경 실패:", error);
      return;
    }

    const countChange = isSelected ? -1 : 1;

    setPosts((previousPosts) =>
      previousPosts.map((post) =>{
        if(post.id !== postId){
          return post;
        }
        
        if(reactionType === "empathy"){
          return{
            ...post,
            empathyCount : Math.max(post.empathyCount + countChange, 0),
            isEmpathized : !isSelected,
          };
        }

        if(reactionType === "cheer"){
          return{
            ...post,
            cheerCount : Math.max(post.cheerCount + countChange, 0),
            isCheered : !isSelected,
          };
        }

          return{
            ...post,
            smileCount : Math.max(post.smileCount + countChange, 0),
            isSmiled : !isSelected,
          };
        }),
    );
    } finally{
     pendingReactionsKeysRef.current.delete(reactionKey);
     setPendingReactionKeys(new Set(pendingReactionsKeysRef.current));
    }
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

        <div className="flex items-center gap-2">
          {isAuthLoading ? (
            <span className="text-sm text-gray-400">확인 중...</span>
          ) : userEmail ? (
            <>
              <span className="hidden max-w-48 truncate text-sm text-gray-500 sm:inline">
                {userEmail}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  isSigningOut
                    ? "cursor-not-allowed text-gray-300"
                    : "text-gray-600 hover:border-red-300 hover:text-red-500"
                }`}
              >
                {isSigningOut ? "로그아웃 중..." : "로그아웃"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border px-4 py-2 text-sm"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-white"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold">오늘 하루, 가볍게 남겨보세요.</h2>

        <p className="mt-4 text-gray-600">
          부담 없이 기록하고, 가볍게 공감받는 하루 기록 공간
        </p>

        {isAuthLoading ? (
          <div className="mt-10 rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-400">
              로그인 상태를 확인하고 있습니다...
            </p>
          </div>
        ) : userId ? (
          <div className="mt-10 rounded-2xl border bg-white p-5 shadow-sm">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={MAX_CONTENT_LENGTH}
              className="h-32 w-full resize-none rounded-xl border p-4 outline-none focus:border-emerald-400"
              placeholder="오늘은 어떤 하루였나요? ^^"
            />

            <div className="mt-4 flex items-center justify-between">
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
        ) : (
          <div className="mt-10 rounded-2xl border bg-white p-8 shadow-sm">
            <p className="text-gray-600">
              하루를 남기려면 로그인이 필요합니다.
            </p>

            <Link
              href="/login"
              className="mt-4 inline-block rounded-full bg-emerald-400 px-5 py-2 font-semibold text-white transition hover:bg-emerald-500"
            >
              로그인하고 하루 남기기
            </Link>
          </div>
        )}
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
                canManage={userId !== null && post.userId === userId}
                isEmpathyPending={pendingReactionsKeys.has(
                  createReactionKey(post.id, "empathy"),
                )}
                isCheerPending={pendingReactionsKeys.has(
                  createReactionKey(post.id, "cheer"),
                )}
                isSmilePending={pendingReactionsKeys.has(
                  createReactionKey(post.id, "smile"),
                )}
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
