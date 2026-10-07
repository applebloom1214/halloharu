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
    typeof claimsData?.claims.sub === "string" ? claimsData.claims.sub : null;

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

export async function updateCommentReportStatus(
  commentId: number,
  reporterId: string,
  status: ReportStatus,
): Promise<UpdateReportStatusResult> {
  if (
    !Number.isInteger(commentId) ||
    commentId <= 0 ||
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
    typeof claimsData?.claims.sub === "string" ? claimsData.claims.sub : null;

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
    .from("comment_reports")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: currentUserId,
    })
    .eq("comment_id", commentId)
    .eq("reporter_id", reporterId)
    .select("comment_id")
    .maybeSingle();

  if (updateError) {
    console.error("댓글 신고 상태 변경 실패:", updateError);
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

export async function restoreHiddenContent(
  kind: "post" | "comment" | "humor",
  targetId: number,
): Promise<{ success: boolean; message: string }> {
  if (
    (kind !== "post" && kind !== "comment" && kind !== "humor") ||
    !Number.isSafeInteger(targetId) ||
    targetId <= 0
  ) {
    return {
      success: false,
      message: "올바르지 않은 복원 대상입니다.",
    };
  }

  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const currentUserId =
    typeof claimsData?.claims.sub === "string" ? claimsData.claims.sub : null;

  if (claimsError || currentUserId === null) {
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

  const { data: restored, error: restoreError } = await supabase.rpc(
    "restore_hidden_content",
    {
      target_kind: kind,
      target_id: targetId,
    },
  );

  if (restoreError) {
    console.error("콘텐츠 복원 실패:", restoreError);

    return {
      success: false,
      message: "콘텐츠를 복원하지 못했습니다. 다시 시도해 주세요.",
    };
  }

  // 다른 신고 카드에서 이미 복원한 경우에도 화면을 갱신합니다.
  revalidatePath("/admin/reports");

  if (restored !== true) {
    return {
      success: false,
      message: "이미 복원되었거나 대상을 찾을 수 없습니다.",
    };
  }

  if (kind === "post") {
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/posts/[id]", "page");
    revalidatePath("/users/[userId]", "page");
  } else if (kind === "comment") {
    revalidatePath("/posts/[id]", "page");
  } else {
    revalidatePath("/humor");
    revalidatePath("/humor/archive");
    revalidatePath("/humor/archive/[id]", "page");
  }

  return {
    success: true,
    message: "콘텐츠를 복원했습니다.",
  };
}
