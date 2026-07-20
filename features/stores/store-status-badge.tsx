import { cn } from "@/lib/utils";

type StoreStatusBadgeProps = {
  isOpen: boolean;
  className?: string;
};

export function StoreStatusBadge({ isOpen, className }: StoreStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm",
        isOpen ? "bg-[#16A34A]" : "bg-[#9CA3AF]",
        className,
      )}
    >
      {isOpen ? "เปิด" : "ปิด"}
    </span>
  );
}
