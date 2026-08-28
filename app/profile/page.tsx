"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const nicknamePattern = /^[가-힣A-Za-z0-9]{2,12}$/;

export default function ProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [originalNickname, setOriginalNickname] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();

      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if(userError?.name === "AuthSessionMissingError"){
          router.replace("/login");
          return;
        }  

        if (userError) {
          console.error("사용자 확인 실패 : ", userError);
          setLoadError("사용자 정보를 확인하지 못했습니다.");
          return;
        }

        const user = userData.user;

        if (!user) {
          router.replace("/login");
          return;
        }

        setUserId(user.id);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("프로필 불러오기 실패 : ", profileError);
          setLoadError("프로필을 불러오지 못했습니다.");
          return;
        }

        if (!profileData) {
          setLoadError("프로필 정보를 찾지 못했습니다.");
          return;
        }

        setNickname(profileData.nickname);
        setOriginalNickname(profileData.nickname);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleUpdateNickname = async () => {
    if (userId === null || isSaving) {
      return;
    }

    const trimmedNickname = nickname.trim();

    setSaveError(null);
    setSaveMessage(null);

    if (!nicknamePattern.test(trimmedNickname)) {
      setSaveError("닉네임은 한글, 영문, 숫자 2~12자리로 입력해 주세요.");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("profiles")
        .update({
          nickname: trimmedNickname,
        })
        .eq("id", userId);

      if (error) {
        console.error("닉네임 변경 실패 : ", error);

        if (error.code === "23505") {
          setSaveError("이미 사용중인 닉네임입니다.");
        } else {
          setSaveError("닉네임을 변경하지 못했습니다.");
        }

        return;
      }

      setNickname(trimmedNickname);
      setOriginalNickname(trimmedNickname);
      setSaveMessage("닉네임이 변경되었습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-gray-500 transition hover:text-emerald-500"
      >
        ← 홈으로 돌아가기
      </Link>
      <h1 className="text-2xl font-bold text-gray-800">프로필 설정</h1>

      <p className="mt-2 text-sm text-gray-500">
        할로하루에서 사용할 닉네임을 변경할 수 있습니다.
      </p>

      <div className="mt-8">
        <label
          htmlFor="nickname"
          className="block text-sm font-medium text-gray-700"
        >
          닉네임
        </label>

        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value); 
            setSaveError(null);
            setSaveMessage(null);
          }}
          maxLength={12}
          disabled={isLoading || isSaving}
          placeholder={isLoading ? "불러오는 중..." : "2~12자 닉네임"}
          className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-emerald-400 disabled:bg-gray-100"
        />

        <p className="mt-2 text-right text-xs text-gray-400">
          {nickname.length}/12
        </p>

        {loadError && <p className="mt-2 text-sm text-red-500">{loadError}</p>}

        {saveError && <p className="mt-2 text-sm text-red-500">{saveError}</p>}

        {saveMessage && <p className="mt-2 text-sm text-emerald-600">{saveMessage}</p>}

        <button
          type="button"
          onClick={handleUpdateNickname}
          disabled={isLoading || 
            isSaving || 
            userId === null || 
            nickname.trim().length < 2 ||
            nickname.trim() === originalNickname}
          className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSaving ? "변경 중..." : "닉네임 변경"}
        </button>
      </div>
    </main>
  );
}
