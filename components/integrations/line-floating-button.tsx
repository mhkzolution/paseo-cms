import { FaLine } from "react-icons/fa";

type LineFloatingButtonProps = {
  href: string;
  label: string;
};

export function LineFloatingButton({ href, label }: LineFloatingButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#06C755] text-white shadow-lg transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06C755]"
    >
      <FaLine className="h-7 w-7" aria-hidden />
    </a>
  );
}
