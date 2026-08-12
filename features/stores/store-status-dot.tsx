import { cn } from "@/lib/utils";

type StoreStatusDotProps = {
  isOpen: boolean;
  className?: string;
};

export function StoreStatusDot({ isOpen, className }: StoreStatusDotProps) {
  return (
    <span
      className={cn(
        "block h-3 w-3 shrink-0 rounded-full ring-2 ring-white",
        isOpen ? "bg-green-500" : "bg-gray-400",
        className,
      )}
      role="img"
      aria-label={isOpen ? "เปิด" : "ปิด"}
    />
  );
}
