"use client";
import Image from "next/image";
import { useState } from "react";
import PostCard from "../components/PostCard";

type Post = {
  id : number;
  content : string;
};

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([
    {
      id :1,
      content :  "오늘은 별일 없었지만 퇴근길 바람이 좋았다.",
    },
    {
      id :2,
      content :  "아무것도 안 한 것 같지만 그래도 하루를 버텼다.",
    },
  ]);

  const handleSummit =() => {
    const trimmedContent = content.trim();

    if(trimmedContent === ""){
      return;
    }

    setPosts((previousPosts) => [
      {
        id : Date.now(),
        content : trimmedContent,
      },
      ...previousPosts,
    ]);

    setContent("");
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
          <button className="rounded-full border px-4 py-2 text-sm">
            로그인
          </button>
          <button className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-white">
            회원가입
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold">
          오늘 하루, 가볍게 남겨보세요.
        </h2>

        <p className="mt-4 text-gray-600">
          부담 없이 기록하고, 가볍게 공감받는 하루 기록 공간
        </p>

        <div className="mt-10 rounded-2xl border bg-white p-5 shadow-sm">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="h-32 w-full resize-none rounded-xl border p-4 outline-none focus:border-emerald-400"
            placeholder="오늘은 어떤 하루였나요?"
          />

          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleSummit}
              className="rounded-full bg-emerald-400 px-5 py-2 font-semibold text-white">
              하루 남기기
            </button>
          </div>
        </div>

        <div className="mt-12 text-left">
          <h3 className="mb-4 text-lg font-semibold">최근 올라온 하루</h3>

          <div className="space-y-3">
            {posts.map((post, index) =>(
              <PostCard key={post.id} content={post.content}/>   
            ))}      
          </div>
        </div>
      </section>
    </main>
  );
}