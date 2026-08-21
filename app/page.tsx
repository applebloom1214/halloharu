"use client";
import Image from "next/image";
import Link from "next/link";

import { useEffect, useRef, useState } from "react";

import PostCard from "../components/PostCard";
import RecordCalendar from "@/components/RecordCalendar";
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

type PostFilter = "all" | "mine";

const createReactionKey = (postId: number, reactionType: ReactionType) =>
  `${postId}:${reactionType}`;

type DatabaseReaction = {
  user_id: string;
  reaction_type: ReactionType;
};

const MAX_CONTENT_LENGTH = 300;
const POSTS_PER_PAGE = 10;

const getTodayInKorea = () => 
  new Intl.DateTimeFormat("en-CA", {
    timeZone : "Asia/Seoul",
    year : "numeric",
    month : "2-digit",
    day : "2-digit",
  }).format(new Date());

export default function Home() {
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [postFilter, setPostFilter] = useState<PostFilter>("all");
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [postsLimit, setPostsLimit] = useState(POSTS_PER_PAGE);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasPostsError, setHasPostsError] = useState(false);
  const [hasLoadMoreError, setHasLoadMoreError] = useState(false);
  const [postsRetryCount, setPostsRetryCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);
  const [recordedDates, setRecordedDates] = useState<string[] | null>(null);
  const [selectedRecordDate, setSelectRecordDate] = useState<string | null>(null,);
  const [selectedRecordContent, setSelectedRecordContent] = useState<string | null>(null);
  const [isSelectedRecordLoading, setIsSelectedRecordLoading] = useState(false);
  const [selectedRecordError, setSelectedRecordError] = useState<string | null>(null);
  const [isDailyPostStatusLoading, setIsDailyPostStatusLoading] =
    useState(true);

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
      const isLoadingAdditionalPosts = postsLimit > POSTS_PER_PAGE;

      if (isLoadingAdditionalPosts) {
        setIsLoadingMore(true);
      } else {
        setIsPostsLoading(true);
        setHasMorePosts(false);
      }

      setHasPostsError(false);
      setHasLoadMoreError(false);

      try {
        const supabase = createClient();

        let postsQuery = supabase.from("posts").select(
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
        );

        if (postFilter === "mine" && userId) {
          postsQuery = postsQuery.eq("user_id", userId);
        }

        const { data, error } = await postsQuery
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(0, postsLimit);

        if (error) {
          console.error("게시글 불러오기 실퍠:", error);

          if (isLoadingAdditionalPosts) {
            setHasLoadMoreError(true);
          } else {
            setHasPostsError(true);
          }
          return;
        }

        const databasePosts = (data ?? []) as DatabasePost[];

        const hasMore = databasePosts.length > postsLimit;

        const displayedDatabasePosts = databasePosts.slice(0, postsLimit);

        setHasMorePosts(hasMore);

        const convertedPosts: Post[] = displayedDatabasePosts.map((post) => {
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
                reaction.user_id === userId &&
                reaction.reaction_type === "smile",
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
      } finally {
        setIsPostsLoading(false);
        setIsLoadingMore(false);
      }
    };

    fetchPosts();
  }, [isAuthLoading, userId, postFilter, postsLimit, postsRetryCount]);

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

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!userId) {
      return;
    }

    const fetchDailyPostStatus = async () => {
      try {
        const supabase = createClient();

        const todayInKorea = getTodayInKorea();

        const { data, error } = await supabase
          .from("posts")
          .select("id")
          .eq("user_id", userId)
          .eq("daily_post_date", todayInKorea)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("오늘 기록 확인 실패 : ", error);
          setHasPostedToday(false);
          return;
        }

        setHasPostedToday(data !== null);

        const {data : streak, error : sterakError} = await supabase.rpc(
          "get_current_streak",
        );

        if(sterakError){
          console.error("연속 기록 확인 실패:", sterakError);
          return;
        }

        setCurrentStreak(streak ?? 0);


      } finally {
        setIsDailyPostStatusLoading(false);
      }
    };

    fetchDailyPostStatus();
  }, [isAuthLoading, userId]);

  // 기록 날짜 불러오기
  useEffect(() =>{
    if(isAuthLoading || !userId) return;

    const fetchRecordedDates = async () => {
      const supabase = createClient();

      const {data , error } = await supabase
        .from("posts")
        .select("daily_post_date")
        .eq("user_id", userId)
        .not("daily_post_date", "is", null)
        .order("daily_post_date", {ascending:false});

      if(error){
        console.log("기록 날짜 불러오기 실퍠 : ",error);
        return;
      }  

      const dates = (data ?? [])
        .map((post) => post.daily_post_date)
        .filter((date) : date is string => date !== null);

        setRecordedDates(dates);
    };

    fetchRecordedDates();
  }, [isAuthLoading, userId]);

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

  const handleCalendarDateSelect = async (dateKey : string) => {
    if(!userId) return;

    setSelectRecordDate(dateKey);
    setSelectedRecordContent(null);
    setSelectedRecordError(null);
    setIsSelectedRecordLoading(true);

    try{
      const supabase = createClient();

      const {data, error} = await supabase
        .from("posts")
        .select("content")
        .eq("user_id", userId)
        .eq("daily_post_date", dateKey)
        .maybeSingle();

      if(error){
        console.error("선택한 기록 불러오기 실패 : ",error);
        setSelectedRecordError("기록을 불러오지 못했습니다.");
        return;
      }
      
      if(data === null){
        setSelectedRecordError("해당 날짜의 기록을 찾을 수 없습니다.");
        return;
      }

      setSelectedRecordContent(data.content);
    }finally{
      setIsSelectedRecordLoading(false);
    }
  };


  const handleSubmit = async () => {
    const trimmedContent = content.trim();

    if (
      trimmedContent === "" ||
      isSubmitting ||
      isDailyPostStatusLoading ||
      hasPostedToday
    ) {
      return;
    }

    if (!userId) {
      console.error("로그인한 사용자만 게시글을 저장할 수 있습니다.");
      return;
    }

    setSubmitErrorMessage(null);
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

        if (error.code === "23505") {
          setSubmitErrorMessage("오늘의 기록은 이미 남겼습니다.");
        } else {
          setSubmitErrorMessage(
            "하루 기록을 저장하지 못했습니다. 다시 시도해 주세요.",
          );
        }

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
      setHasPostedToday(true);

      const todayInKorea = getTodayInKorea();

      setRecordedDates((previousDates) =>{
        if(previousDates === null){
          return [todayInKorea];
        }

        if(previousDates.includes(todayInKorea)){
          return previousDates;
        }

        return [todayInKorea, ...previousDates];
      });

      const {data : updatedStreak, error : streakError} = await supabase.rpc(
        "get_current_streak",
      );

      if(streakError){
        console.error("연속 기록 갱신 실패 : ", streakError);
      }else{
        setCurrentStreak(updatedStreak ?? 0);
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (postId: number, reactionType: ReactionType) => {
    if (!userId) {
      window.alert("리액션을 남기려면 로그인이 필요합니다.");
      return;
    }

    const targetPost = posts.find((post) => post.id === postId);

    if (!targetPost) {
      return;
    }

    const reactionKey = createReactionKey(postId, reactionType);

    if (pendingReactionsKeysRef.current.has(reactionKey)) {
      return;
    }

    pendingReactionsKeysRef.current.add(reactionKey);
    setPendingReactionKeys(new Set(pendingReactionsKeysRef.current));

    try {
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
            post_id: postId,
            user_id: userId,
            reaction_type: reactionType,
          });

      if (error) {
        console.error("리액션 변경 실패:", error);
        return;
      }

      const countChange = isSelected ? -1 : 1;

      setPosts((previousPosts) =>
        previousPosts.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          if (reactionType === "empathy") {
            return {
              ...post,
              empathyCount: Math.max(post.empathyCount + countChange, 0),
              isEmpathized: !isSelected,
            };
          }

          if (reactionType === "cheer") {
            return {
              ...post,
              cheerCount: Math.max(post.cheerCount + countChange, 0),
              isCheered: !isSelected,
            };
          }

          return {
            ...post,
            smileCount: Math.max(post.smileCount + countChange, 0),
            isSmiled: !isSelected,
          };
        }),
      );
    } finally {
      pendingReactionsKeysRef.current.delete(reactionKey);
      setPendingReactionKeys(new Set(pendingReactionsKeysRef.current));
    }
  };

  const handleDelete = async (postId: number) => {
    if (deletingPostId !== null) {
      return;
    }

    const shouldDelete = window.confirm("이 게시글을 정말 삭제하시겠습니까 ?");

    if (!shouldDelete) {
      return;
    }

    setDeletingPostId(postId);

    try {
      const supabase = createClient();

      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) {
        console.error("게시글 삭제 실퍠:", error);
        return;
      }

      setPosts((previousPosts) =>
        previousPosts.filter((post) => post.id !== postId),
      );

      if (userId) {
        const todayInKorea = getTodayInKorea();

        const { data: todayPost, error: todayPostError } = await supabase
          .from("posts")
          .select("id")
          .eq("user_id", userId)
          .eq("daily_post_date", todayInKorea)
          .limit(1)
          .maybeSingle();

        if(todayPostError){
          console.error("삭제 후 오늘 기록 확인 실패 :", todayPostError,);
        }else{
          setHasPostedToday(todayPost !== null);
          setSubmitErrorMessage(null);

          const { data : updatedStreak, error : sterakError} = await supabase.rpc(
            "get_current_streak",
          );

          if(sterakError){
            console.error("연속 기록 갱신 실패 : ", sterakError);
          }else{
            setCurrentStreak(updatedStreak ?? 0);
          }

          const { data : updatedDateRows, error : datesError} = await supabase
            .from("posts")
            .select("daily_post_date")
            .eq("user_id", userId)
            .not("daily_post_date", "is", null)
            .order("daily_post_date", {ascending:false});

          if(datesError){
            console.error("기록 날짜 갱신 실패 : ", datesError);
          }else{
            const updatedDates = (updatedDateRows ?? [])
              .map((post) => post.daily_post_date)
              .filter((date): date is string => date !== null);

            setRecordedDates(updatedDates);  

            if(
              selectedRecordDate !== null &&
              !updatedDates.includes(selectedRecordDate)
            ){
              setSelectRecordDate(null);
              setSelectedRecordContent(null);
              setSelectedRecordError(null);
            }
          }
        }
      }
    } finally {
      setDeletingPostId(null);
    }
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

    const { error } = await supabase
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

        <div className="flex items-center gap-3">
          <Link
            href="/humor"
            className="whitespace-nowrap text-sm text-gray-500 transition hover:text-emerald-500"
          >
            유머 공간
          </Link>

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
            {currentStreak !== null &&(
              <p className="mb-3 text-sm font-medium text-orange-600">
                🔥 {currentStreak}일 연속 기록 중
              </p>
            )}

            {recordedDates !== null &&(
              <p className="mt-1 text-xs text-gray-500">
                총 {recordedDates.length}일 기록했어요.
              </p>
            )}

            {recordedDates !== null &&(
              <RecordCalendar
                recordedDates={recordedDates}
                monthKey={getTodayInKorea().slice(0,7)}
                selectedDate = {selectedRecordDate}
                onDateSelect = {handleCalendarDateSelect}
              />
            )}

            {selectedRecordDate !== null &&(
              <section className="mx-auto mt-3 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  {selectedRecordDate}의 기록
                </p>

                {isSelectedRecordLoading ? (
                  <p className="text-sm text-gray-400">기록을 불러오는 중...</p>
                ) : selectedRecordError ? (
                  <p role="alert" className="text-sm text-red-500">
                    {selectedRecordError}
                  </p>
                ) : selectedRecordContent !== null ? (
                  <p className="whitespace-pre-wrap break-words text-sm text-gray=700">
                    {selectedRecordContent}
                  </p>
                ) : null}
              </section>  
            )}

            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={MAX_CONTENT_LENGTH}
              disabled={isDailyPostStatusLoading || hasPostedToday}
              className={`h-32 w-full resize-none rounded-xl border p-4 outline-none ${
                isDailyPostStatusLoading || hasPostedToday
                  ? "cursor-not-allowed bg-gray-50 text-gray-400"
                  : "focus:border-emerald-400"
              }`}
              placeholder={
                isDailyPostStatusLoading
                  ? "오늘 기록을 확인하고 있습니다..."
                  : hasPostedToday
                    ? "오늘의 기록을 이미 남겼습니다."
                    : "오늘은 어떤 하루였나요? ^^"
              }
            />

            {hasPostedToday && (
              <p className="mt-2 text-left text-sm text-emerald-600">
                오늘의 기록을 완료했습니다. 내일 다시 만나요.
              </p>
            )}

            {submitErrorMessage && (
              <p role="alert" className="mt-2 text-left text-sm text-red-500">
                {submitErrorMessage}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {content.length} / {MAX_CONTENT_LENGTH}
              </span>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  content.trim() === "" ||
                  isSubmitting ||
                  isDailyPostStatusLoading ||
                  hasPostedToday
                }
                className={`rounded-full px-5 py-2 font-semibold text-white transition ${
                  content.trim() === "" ||
                  isSubmitting ||
                  isDailyPostStatusLoading ||
                  hasPostedToday
                    ? "cursor-not-allowed bg-gray-300"
                    : "bg-emerald-400 hover:bg-emerald-500"
                }`}
              >
                {isDailyPostStatusLoading
                  ? "확인 중..."
                  : hasPostedToday
                    ? "오늘 기록 완료"
                    : isSubmitting
                      ? "저장 중..."
                      : "하루 남기기"}
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
          <div className="mb-4 flex items-center justify-between">
            <h3 className="mb-4 text-lg font-semibold">최근 올라온 하루</h3>

            {userId && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPostFilter("all");
                    setPostsLimit(POSTS_PER_PAGE);
                  }}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    postFilter === "all"
                      ? "bg-emerald-400 text-white"
                      : "border bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  전체 기록
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPostFilter("mine");
                    setPostsLimit(POSTS_PER_PAGE);
                  }}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    postFilter === "mine"
                      ? "bg-emerald-400 text-white"
                      : "border bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  내 기록
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {isPostsLoading ? (
              <div className="rounded-2xl border bg-white px-6 py-10 text-center">
                <p className="text-sm text-gray-400">
                  하루 기록을 불러오고 있습니다...
                </p>
              </div>
            ) : hasPostsError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
                <p className="text-sm text-red-500">
                  하루 기록을 불러오지 못했습니다.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setPostsRetryCount((previousCount) => previousCount + 1)
                  }
                  className="mt-4 rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-500 transition hover:bg-red-100"
                >
                  다시 시도
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border bg-white px-6 py-10 text-center">
                <p className="text-sm text-gray-500">
                  {postFilter === "mine"
                    ? "아직 작성한 하루가 없습니다."
                    : "아직 올라온 하루가 없습니다."}
                </p>
              </div>
            ) : (
              posts.map((post) => (
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
                  isDeleting={deletingPostId === post.id}
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
              ))
            )}
            {!isPostsLoading && !hasPostsError && posts.length > 0 && (
              <div className="pt-3 text-center">
                {hasLoadMoreError ? (
                  <div>
                    <p className="text-sm text-red-500">
                      추가 기록을 불러오지 못했습니다.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setIsLoadingMore(true);
                        setPostsRetryCount(
                          (previousCount) => previousCount + 1,
                        );
                      }}
                      disabled={isLoadingMore}
                      className={`mt-3 rounded-full border px-4 py-2 text-sm transition ${
                        isLoadingMore
                          ? "cursor-not-allowed text-gray-300"
                          : "border-red-200 bg-white text-red-500 hover:bg-red-50"
                      }`}
                    >
                      {isLoadingMore ? "다시 불러오는 중..." : "다시 시도"}
                    </button>
                  </div>
                ) : hasMorePosts ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoadingMore(true);
                      setPostsLimit(
                        (previousLimit) => previousLimit + POSTS_PER_PAGE,
                      );
                    }}
                    disabled={isLoadingMore}
                    className={`rounded-full border bg-white px-5 py-2 text-sm transition ${
                      isLoadingMore
                        ? "cursor-not-allowed text-gray-300"
                        : "text-gray-600 hover:border-emerald-300 hover:text-emerald-500"
                    }`}
                  >
                    {isLoadingMore ? "불러오는 중..." : "더 보기"}
                  </button>
                ) : (
                  <p className="text-xs text-gray-400">
                    모든 기록을 불러왔습니다.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
