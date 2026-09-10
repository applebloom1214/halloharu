"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ReportStatus = "resolved" | "dismissed";

type UpdateReportStatusResult = {
  success: boolean;
  message: string;
};

export async function updateReportStatus(
  postId: number,
  reporterId: string,
  status: ReportStatus,
): Promise<UpdateReportStatusResult> {
  if (
    !Number.isInteger(postId) ||
    postId <= 0 ||
    reporterId.trim() === "" ||
    (status !== "resolved" && status !== "dismissed")
  ) {
    return {
      success: false,
      message: "올바르지 않은 신고 정보입니다.",
    };
  }

  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();

  const currentUserId =
    typeof claimsData?.claims.sub === "string"
      ? claimsData.claims.sub
      : null;

  if (currentUserId === null) {
    return {
      success: false,
      message: "로그인이 필요합니다.",
    };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (adminError || admin === null) {
    return {
      success: false,
      message: "관리자 권한이 없습니다.",
    };
  }

  const { data: updatedReport, error: updateError } = await supabase
    .from("reports")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: currentUserId,
    })
    .eq("post_id", postId)
    .eq("reporter_id", reporterId)
    .select("post_id")
    .maybeSingle();

  if (updateError) {
    console.error("신고 상태 변경 실패:", updateError);

    return {
      success: false,
      message: "신고 상태를 변경하지 못했습니다.",
    };
  }

  if (updatedReport === null) {
    return {
      success: false,
      message: "신고를 찾을 수 없습니다.",
    };
  }

  revalidatePath("/admin/reports");

  return {
    success: true,
    message: "신고 상태를 변경했습니다.",
  };
}