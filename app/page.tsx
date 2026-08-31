"use client";

import Header from "@/components/Header";
import RecordForm from "@/components/RecordForm";
import RecordStats from "@/components/RecordStats";
import Link from "next/link";

import { useEffect, useRef, useState } from "react";

import PostCard, { type ReportReason } from "../components/PostCard";
import RecordCalendar from "@/components/RecordCalendar";
import { createClient } from "@/lib/supabase/client";

type Post = {
  id: number;
  userId: string | null;
  authorNickname: string | null;
  content: string;
  empathyCount: number;
  cheerCount: number;
  smileCount: number;
  isEmpathized: boolean;
  isCheered: boolean;
  isSmiled: boolean;
  isReported: boolean;
  createdAt: string;
};

type DatabaseProfile = {
  id: string;
  nickname: string;
};

type DatabasePost = {
  id: number;
  user_id: string | null;
  content: string;
  created_at: string;
  reactions?: DatabaseReaction[];
};

type DatabaseReport = {
  post_id: number;
};

type ReactionType = "empathy" | "cheer" | "smile";

type PostFilter = "all" | "mine";

const createReactionKey = (postId: number, reactionType: ReactionType) =>
  `${postId}:${reactionType}`;

type DatabaseReaction = {
  user_id: string;
  reaction_type: ReactionType;
};

const POSTS_PER_PAGE = 10;

const getTodayInKorea = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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
  const [selectedRecordDate, setSelectRecordDate] = useState<string | null>(
    null,
  );
  const [selectedRecordContent, setSelectedRecordContent] = useState<
    string | null
  >(null);
  const [isSelectedRecordLoading, setIsSelectedRecordLoading] = useState(false);
  const [selectedRecordError, setSelectedRecordError] = useState<string | null>(
    null,
  );
  const [isDailyPostStatusLoading, setIsDailyPostStatusLoading] =
    useState(true);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userNickname, setUserNickname] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [nicknameInput, setNicknameInput] = useState("");
  const [isNicknameSaving, setIsNicknameSaving] = useState(false);
  const [nicknameErrorMessage, setNicknameErrorMessage] = useState<
    string | null
  >(null);
  const [isNicknameEditing, setIsNicknameEditing] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [pendingReactionsKeys, setPendingReactionKeys] = useState<Set<string>>(
    new Set(),
  );

  const pendingReactionsKeysRef = useRef<Set<string>>(new Set());

  const isPostCreationUnavailable =
    isPostsLoading ||
    userNickname === null ||
    isDailyPostStatusLoading ||
    hasPostedToday;

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

        const authorIds = [
          ...new Set(
            displayedDatabasePosts
              .map((post) => post.user_id)
              .filter((id): id is string => id !== null),
          ),
        ];

        const authorNicknameById = new Map<string, string>();

        if (authorIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, nickname")
            .in("id", authorIds);

          if (profileError) {
            console.error("작성자 프로필 불러오기 실패:", profileError);
          } else {
            const databaseProfiles = (profileData ?? []) as DatabaseProfile[];

            databaseProfiles.forEach((profile) => {
              authorNicknameById.set(profile.id, profile.nickname);
            });
          }
        }

        const reportedPostIdSet = new Set<number>();

        if (userId && displayedDatabasePosts.length > 0) {
          const displayedPostIds = displayedDatabasePosts.map(
            (post) => post.id,
          );

          const { data: reportData, error: reportError } = await supabase
            .from("reports")
            .select("post_id")
            .eq("reporter_id", userId)
            .in("post_id", displayedPostIds);

          if (reportError) {
            console.error("신고 내역 불러오기 실패 : ", reportError);
          } else {
            const databaseReports = (reportData ?? []) as DatabaseReport[];

            databaseReports.forEach((report) => {
              reportedPostIdSet.add(report.post_id);
            });
          }
        }

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
            authorNickname:
              post.user_id !== null
                ? (authorNicknameById.get(post.user_id) ?? null)
                : null,
            content: post.content,
            empathyCount,
            cheerCount,
            smileCount,
            isEmpathized,
            isCheered,
            isSmiled,
            isReported: reportedPostIdSet.has(post.id),
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

  // 사용자 정보 불러오기
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

  // 프로필 불러오기
  useEffect(() => {
    if (isAuthLoading || !userId) {
      return;
    }

    const fetchProfile = async () => {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.error("프로필 불러오기 실패", error);
          return;
        }

        setUserNickname(data?.nickname ?? null);
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthLoading, userId]);

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

        const { data: streak, error: sterakError } =
          await supabase.rpc("get_current_streak");

        if (sterakError) {
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
  useEffect(() => {
    if (isAuthLoading || !userId) return;

    const fetchRecordedDates = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .select("daily_post_date")
        .eq("user_id", userId)
        .not("daily_post_date", "is", null)
        .order("daily_post_date", { ascending: false });

      if (error) {
        console.log("기록 날짜 불러오기 실퍠 : ", error);
        return;
      }

      const dates = (data ?? [])
        .map((post) => post.daily_post_date)
        .filter((date): date is string => date !== null);

      setRecordedDates(dates);
    };

    fetchRecordedDates();
  }, [isAuthLoading, userId]);

  const handleNicknameSubmit = async () => {
    const trimmedNickname = nicknameInput.trim();

    if (!userId || isNicknameSaving) {
      return;
    }

    const nicknamePattern = /^[가-힣A-Za-z0-9]{2,12}$/;

    if (!nicknamePattern.test(trimmedNickname)) {
      setNicknameErrorMessage(
        "닉네임은 2~12자의 한글, 영문, 숫자만 사용할 수 있습니다.",
      );
      return;
    }

    setNicknameErrorMessage(null);
    setIsNicknameSaving(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.from("profiles").insert({
        id: userId,
        nickname: trimmedNickname,
      });

      if (error) {
        console.error("닉네임 저장 실패 : ", error);

        if (error.code === "23505") {
          setNicknameErrorMessage("이미 사용 중인 닉네임입니다.");
        } else {
          setNicknameErrorMessage(
            "닉네임을 저장하지 못했습니다. 다시 시도해 주세요.",
          );
        }
        return;
      }

      setUserNickname(trimmedNickname);
      setNicknameInput("");
    } finally {
      setIsNicknameSaving(false);
    }
  };

  const handleNicknameUpdate = async () => {
    const trimmedNickname = nicknameInput.trim();

    if (!userId || !userNickname || isNicknameSaving) {
      return;
    }

    const nicknamePattern = /^[가-힣A-Za-z0-9]{2,12}$/;

    if (!nicknamePattern.test(trimmedNickname)) {
      setNicknameErrorMessage(
        "닉네임은 2~12자의 한글, 영문, 숫자만 사용할 수 있습니다.",
      );
      return;
    }

    setNicknameErrorMessage(null);
    setIsNicknameSaving(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("profiles")
        .update({
          nickname: trimmedNickname,
        })
        .eq("id", userId)
        .select("nickname")
        .single();

      if (error) {
        console.error("닉네임 수정 실퍠 : ", error);

        if (error.code === "23505") {
          setNicknameErrorMessage("이미 사용 중인 닉네임입니다.");
        } else {
          setNicknameErrorMessage(
            "닉네임을 수정하지 못했습니다. 다시 시도해 주세요.",
          );
        }

        return;
      }

      setUserNickname(data.nickname);

      setPosts((previousPosts) =>
        previousPosts.map((post) =>
          post.userId === userId
            ? {
                ...post,
                authorNickname: data.nickname,
              }
            : post,
        ),
      );

      setNicknameInput("");
      setIsNicknameEditing(false);
    } finally {
      setIsNicknameSaving(false);
    }
  };

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

  const handleCalendarDateSelect = async (dateKey: string) => {
    if (!userId) return;

    setSelectRecordDate(dateKey);
    setSelectedRecordContent(null);
    setSelectedRecordError(null);
    setIsSelectedRecordLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .select("content")
        .eq("user_id", userId)
        .eq("daily_post_date", dateKey)
        .maybeSingle();

      if (error) {
        console.error("선택한 기록 불러오기 실패 : ", error);
        setSelectedRecordError("기록을 불러오지 못했습니다.");
        return;
      }

      if (data === null) {
        setSelectedRecordError("해당 날짜의 기록을 찾을 수 없습니다.");
        return;
      }

      setSelectedRecordContent(data.content);
    } finally {
      setIsSelectedRecordLoading(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedContent = content.trim();

    if (trimmedContent === "" || isSubmitting || isPostCreationUnavailable) {
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
        authorNickname: userNickname,
        content: databasePost.content,
        empathyCount: 0,
        cheerCount: 0,
        smileCount: 0,
        isEmpathized: false,
        isCheered: false,
        isSmiled: false,
        isReported: false,
        createdAt: databasePost.created_at,
      };

      setPosts((previousPosts) => [newPost, ...previousPosts]);
      setContent("");
      setHasPostedToday(true);

      const todayInKorea = getTodayInKorea();

      setRecordedDates((previousDates) => {
        if (previousDates === null) {
          return [todayInKorea];
        }

        if (previousDates.includes(todayInKorea)) {
          return previousDates;
        }

        return [todayInKorea, ...previousDates];
      });

      const { data: updatedStreak, error: streakError } =
        await supabase.rpc("get_current_streak");

      if (streakError) {
        console.error("연속 기록 갱신 실패 : ", streakError);
      } else {
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

  const handleReport = async (
    postId: number,
    reportReason: ReportReason,
  ): Promise<boolean> => {
    if (!userId) {
      return false;
    }

    const supabase = createClient();

    const { error } = await supabase.from("reports").insert({
      post_id: postId,
      reporter_id: userId,
      reason: reportReason,
    });

    if (error) {
      if (error.code === "23505") {
        setPosts((previousPosts) =>
          previousPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isReported: true,
                }
              : post,
          ),
        );

        return true;
      }

      console.error("게시글 신고 실패:", error);
      return false;
    }

    setPosts((previousPosts) =>
      previousPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isReported: true,
            }
          : post,
      ),
    );

    return true;
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

        if (todayPostError) {
          console.error("삭제 후 오늘 기록 확인 실패 :", todayPostError);
        } else {
          setHasPostedToday(todayPost !== null);
          setSubmitErrorMessage(null);

          const { data: updatedStreak, error: sterakError } =
            await supabase.rpc("get_current_streak");

          if (sterakError) {
            console.error("연속 기록 갱신 실패 : ", sterakError);
          } else {
            setCurrentStreak(updatedStreak ?? 0);
          }

          const { data: updatedDateRows, error: datesError } = await supabase
            .from("posts")
            .select("daily_post_date")
            .eq("user_id", userId)
            .not("daily_post_date", "is", null)
            .order("daily_post_date", { ascending: false });

          if (datesError) {
            console.error("기록 날짜 갱신 실패 : ", datesError);
          } else {
            const updatedDates = (updatedDateRows ?? [])
              .map((post) => post.daily_post_date)
              .filter((date): date is string => date !== null);

            setRecordedDates(updatedDates);

            if (
              selectedRecordDate !== null &&
              !updatedDates.includes(selectedRecordDate)
            ) {
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

    if (selectedRecordDate !== null) {
      await handleCalendarDateSelect(selectedRecordDate);
    }

    return true;
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#333333]">
      <Header
        isAuthLoading={isAuthLoading}
        userEmail={userEmail}
        isProfileLoading={isProfileLoading}
        userNickname={userNickname}
        isSigningOut={isSigningOut}
        onLogout={handleLogout}
      />

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
            {isProfileLoading ? (
              <p className="mb-3 text-sm text-gray-400">
                프로필을 확인하고 있습니다...
              </p>
            ) : userNickname ? (
              <div className="mb-4">
                {isNicknameEditing ? (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-700">
                      닉네임 수정
                    </p>

                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={nicknameInput}
                        onChange={(event) =>
                          setNicknameInput(event.target.value)
                        }
                        maxLength={12}
                        disabled={isNicknameSaving}
                        className="min-w-0 flex-1 rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-emerald-300 disabled:bg-gray-100"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setNicknameInput("");
                          setNicknameErrorMessage(null);
                          setIsNicknameEditing(false);
                        }}
                        disabled={isNicknameSaving}
                        className="shrink-0 rounded-xl border bg-white px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                      >
                        취소
                      </button>

                      <button
                        type="button"
                        onClick={handleNicknameUpdate}
                        disabled={
                          nicknameInput.trim() === "" || isNicknameSaving
                        }
                        className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {isNicknameSaving ? "저장 중..." : "저장"}
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      2~12자의 한글, 영문, 숫자를 사용할 수 있습니다.
                    </p>
                    {nicknameErrorMessage && (
                      <p role="alert" className="mt-2 text-sm text-red-500">
                        {nicknameErrorMessage}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-sm font-medium text-emerald-600">
                      {userNickname}님, 반가워요.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setNicknameInput(userNickname);
                        setNicknameErrorMessage(null);
                        setIsNicknameEditing(true);
                      }}
                      className="text-xs text-gray-400 hover:text-emerald-600"
                    >
                      수정
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-5 rounded-xl border border-orange-100 bg-orange-50 p-4">
                <p className="mb-3 text-sm font-medium text-orange-600">
                  사용할 닉네임을 설정해 주세요.
                </p>

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(event) => setNicknameInput(event.target.value)}
                    maxLength={12}
                    placeholder="닉네임 입력"
                    disabled={isNicknameSaving}
                    className="min-w-0 flex-1 rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 disabled:bg-gray-100"
                  />

                  <button
                    type="button"
                    onClick={handleNicknameSubmit}
                    disabled={nicknameInput.trim() === "" || isNicknameSaving}
                    className="shrink-0 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isNicknameSaving ? "저장 중..." : "저장"}
                  </button>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  2~12자의 한글, 영문, 숫자를 사용할 수 있습니다.
                </p>

                {nicknameErrorMessage && (
                  <p role="alert" className="mt-2 text-sm text-red-500">
                    {nicknameErrorMessage}
                  </p>
                )}
              </div>
            )}

            {currentStreak !== null && recordedDates !== null && (
              <RecordStats
                currentStreak={currentStreak}
                totalRecordCount={recordedDates.length}
                hasPostedToday={hasPostedToday}
              />
            )}

            {recordedDates !== null && (
              <RecordCalendar
                recordedDates={recordedDates}
                monthKey={getTodayInKorea().slice(0, 7)}
                selectedDate={selectedRecordDate}
                onDateSelect={handleCalendarDateSelect}
              />
            )}

            {selectedRecordDate !== null && (
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

            <RecordForm
              content={content}
              isPostCreationUnavailable={isPostCreationUnavailable}
              isProfileLoading={isProfileLoading}
              userNickname={userNickname}
              isDailyPostStatusLoading={isDailyPostStatusLoading}
              hasPostedToday={hasPostedToday}
              submitErrorMessage={submitErrorMessage}
              isSubmitting={isSubmitting}
              onContentChange={setContent}
              onSubmit={handleSubmit}
            />
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
                  authorUserId={post.userId}
                  authorNickname={post.authorNickname}
                  content={post.content}
                  createdAt={post.createdAt}
                  empathyCount={post.empathyCount}
                  cheerCount={post.cheerCount}
                  smileCount={post.smileCount}
                  isEmpathized={post.isEmpathized}
                  isCheered={post.isCheered}
                  isSmiled={post.isSmiled}
                  canManage={userId !== null && post.userId === userId}
                  canReport={
                    userId !== null &&
                    post.userId !== null &&
                    post.userId !== userId
                  }
                  isReported={post.isReported}
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
                  onReport={(reportReason) =>
                    handleReport(post.id, reportReason)
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
