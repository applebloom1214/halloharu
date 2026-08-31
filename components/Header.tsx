import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
  isAuthLoading: boolean;
  userEmail: string | null;
  isProfileLoading: boolean;
  userNickname: string | null;
  isSigningOut: boolean;
  onLogout: () => void;
};

export default function Header({
  isAuthLoading,
  userEmail,
  isProfileLoading,
  userNickname,
  isSigningOut,
  onLogout,
}: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-3 border-b bg-white px-4 py-4 sm:flex-nowrap sm:px-6">
      <Image
        src="/halloharu-logo.png"
        alt="할로하루 로고"
        height={40}
        width={200}
        className="mr-auto h-11 w-auto"
      />

      <Link
        href="/humor"
        className="whitespace-nowrap text-sm text-gray-500 transition hover:text-emerald-500"
      >
        유머 공간
      </Link>

      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        {isAuthLoading ? (
          <span className="text-sm text-gray-400">확인 중...</span>
        ) : userEmail ? (
          <>
            <Link
              href="/profile"
              title="프로필 설정"
              className="min-w-0 truncate text-sm text-gray-500 transition hover:text-emerald-500 sm:max-w-48"
            >
              {isProfileLoading
                ? "프로필 확인 중..."
                : (userNickname ?? userEmail)}
            </Link>

            <button
              type="button"
              onClick={onLogout}
              disabled={isSigningOut}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
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
              className="whitespace-nowrap rounded-full border px-4 py-2 text-sm"
            >
              로그인
            </Link>

            <Link
              href="/signup"
              className="whitespace-nowrap rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-white"
            >
              회원가입
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
