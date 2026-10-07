"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { restoreHiddenContent } from "@/app/admin/reports/actions";

type Props ={
    kind : "post" | "comment" | "humor";
    targetId : number;
};

export default function AdminRestoreContentButton({
    kind,
    targetId,
} : Props){
    const router = useRouter();
    const [isRestoring, setIsRestoring] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleRestore = async () => {
        if(isRestoring) return;

        const kindLabel =
            kind === "post"
                ? "게시글"
                : kind === "comment"
                    ? "댓글"
                    : "유머 한마디";

        const confirmed = window.confirm(
            `이 ${kindLabel}의 숨김을 해제할까요 ? \n신고 처리 상태는 그대로 유지됩니다.`,
        );
        
        if(!confirmed) return;

        setErrorMessage(null);
        setIsRestoring(true);

        try{
            const result = await restoreHiddenContent(kind, targetId);

            if(!result.success){
                setErrorMessage(result.message);
            }

            //다른 카드에서 이미 복원한 경우에도 최신 상태를 가져옵니다.
            router.refresh();
        }catch(error){
            console.error("콘텐츠 복원 요청 실패 : ", error);
            setErrorMessage("콘텐츠를 복원하지 못했습니다. 다시 시도해주세요.");
        }finally{
            setIsRestoring(false);
        }
    };

    return(
        <div className="mt-3">
            <button
                type="button"
                onClick={() => void handleRestore()}
                disabled={isRestoring}
                className="rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
             {isRestoring ? "복원 중..." : "숨김 해제"}
            </button>

            {errorMessage && (
                <p role="alert" className="mt-3 text-sm text-red-500">
                    {errorMessage}
                </p>
            )}    
        </div>
    );
}