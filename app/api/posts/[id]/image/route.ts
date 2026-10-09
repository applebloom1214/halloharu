import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PostImageRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(
  _request: Request,
  { params }: PostImageRouteContext,
) {
  const { id } = await params;
  const postId = Number(id);

  if (!Number.isSafeInteger(postId) || postId <= 0) {
    return Response.json(
      { message: "사진을 찾을 수 없습니다." },
      { status: 404, headers: responseHeaders },
    );
  }

  const supabase = await createClient();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("image_path")
    .eq("id", postId)
    .eq("is_hidden", false)
    .maybeSingle();

  if (postError) {
    console.error("게시글 사진 정보 조회 실패:", postError);

    return Response.json(
      { message: "사진 정보를 불러오지 못했습니다." },
      { status: 500, headers: responseHeaders },
    );
  }

  if (post === null || post.image_path === null) {
    return Response.json(
      { message: "사진을 찾을 수 없습니다." },
      { status: 404, headers: responseHeaders },
    );
  }

  const { data: image, error: imageError } = await supabase.storage
    .from("post-images")
    .download(post.image_path);

  if (imageError || image === null) {
    console.error("게시글 사진 다운로드 실패:", imageError);

    return Response.json(
      { message: "사진을 불러오지 못했습니다." },
      { status: 500, headers: responseHeaders },
    );
  }

  return new Response(image.stream(), {
    headers: {
      ...responseHeaders,
      "Content-Type": image.type || "application/octet-stream",
    },
  });
}