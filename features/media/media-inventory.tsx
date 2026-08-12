interface MediaInventoryProps {
  title: string;
  total: number;
}

export function MediaInventory({ title, total }: MediaInventoryProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted">{total} assets</p>
    </div>
  );
}
