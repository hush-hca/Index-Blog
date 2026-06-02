export function extractBlogId(input: string): string {
  const cleaned = input.trim().replace(/\/+$/, "");

  try {
    const url = new URL(cleaned);

    if (url.hostname !== "blog.naver.com") {
      throw new Error("Invalid Naver Blog URL");
    }

    const blogId = url.pathname.split("/").filter(Boolean)[0];

    if (!blogId) {
      throw new Error("Naver Blog ID not found");
    }

    return blogId;
  } catch {
    throw new Error("Enter a valid Naver Blog URL, e.g. https://blog.naver.com/exampleid");
  }
}
