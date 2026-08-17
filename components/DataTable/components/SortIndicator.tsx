import type { SortDirection } from "@/components/DataTable/lib/useDataTableSorting";

type SortIndicatorProps = {
  direction: SortDirection | null;
};

export default function SortIndicator({ direction }: SortIndicatorProps) {
  return (
    <span aria-hidden="true" className="flex shrink-0 flex-col -space-y-1">
      <Chevron
        className={
          direction === "ascending"
            ? "text-primary"
            : "text-muted-foreground/30 group-hover:text-muted-foreground/70"
        }
      />
      <Chevron
        className={
          direction === "descending"
            ? "text-primary"
            : "text-muted-foreground/30 group-hover:text-muted-foreground/70"
        }
        down
      />
    </span>
  );
}

function Chevron({
  className,
  down = false,
}: {
  className: string;
  down?: boolean;
}) {
  return (
    <svg
      className={`size-2.5 transition-colors duration-150 ${className}`}
      fill="none"
      viewBox="0 0 12 12"
    >
      <path
        d={down ? "m3 4.5 3 3 3-3" : "m3 7.5 3-3 3 3"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}
