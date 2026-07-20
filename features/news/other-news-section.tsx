import { HomeNewsSection } from "@/features/home/home-news-section";
import type { ArchivePost } from "@/lib/post-archives";

type OtherNewsSectionProps = {
  posts: ArchivePost[];
};

export function OtherNewsSection({ posts }: OtherNewsSectionProps) {
  if (!posts.length) {
    return null;
  }

  return (
    <HomeNewsSection
      posts={posts}
      eyebrow="News"
      title="OTHER NEWS"
      showViewAll
      className="bg-white"
    />
  );
}
