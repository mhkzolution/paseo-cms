import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { isExternalUrl, type PublicThePaseoLifePost } from "@/lib/thepaseolife";
import { cn } from "@/lib/utils";

type ThePaseoLifeCardProps = {
  post: PublicThePaseoLifePost;
  className?: string;
};

export function ThePaseoLifeCard({ post, className }: ThePaseoLifeCardProps) {
  const classNames = cn("group block", className);
  const content = (
    <>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#F0EDE8]">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 78vw"
          />
        ) : null}
      </div>
      <div className="pt-4">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-paseo-dark">
          {post.title}
        </h3>
        {post.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{post.description}</p>
        ) : null}
      </div>
    </>
  );

  if (post.openInNewTab || isExternalUrl(post.linkUrl)) {
    return (
      <a
        href={post.linkUrl}
        className={classNames}
        {...(post.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={post.linkUrl} className={classNames}>
      {content}
    </Link>
  );
}
