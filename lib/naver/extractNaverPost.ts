export type NaverPostParts = {
  blogId: string;
  logNo: string;
  normalizedUrl: string;
};

export function extractNaverPost(input: string): NaverPostParts {
  const cleaned = input.trim().replace(/\/+$/, "");

  try {
    const url = new URL(cleaned);

    if (url.hostname !== "blog.naver.com" && url.hostname !== "m.blog.naver.com") {
      throw new Error("Invalid Naver Blog URL");
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const blogId = url.searchParams.get("blogId") ?? parts[0];
    const logNo = url.searchParams.get("logNo") ?? parts[1];

    if (!blogId || !logNo) {
      throw new Error("Naver Blog post ID not found");
    }

    return {
      blogId,
      logNo,
      normalizedUrl: `https://m.blog.naver.com/${blogId}/${logNo}`,
    };
  } catch {
    throw new Error("Enter a valid Naver Blog post URL, e.g. https://blog.naver.com/exampleid/1234567890");
  }
}
