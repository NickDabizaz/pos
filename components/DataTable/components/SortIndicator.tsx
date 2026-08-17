import type { SortDirection } from "@/components/DataTable/lib/useDataTableSorting";

type SortIndicatorProps = {
  direction: SortDirection | null;
};

export default function SortIndicator({ direction }: SortIndicatorProps) {
  return (
    <span aria-hidden="true" className="flex flex-col -space-y-1">
      <Chevron
        className={
          direction === "ascending"
            ? "text-slate-950"
            : "text-slate-300 group-hover:text-slate-500"
        }
      />
      <Chevron
        className={
          direction === "descending"
            ? "text-slate-950"
            : "text-slate-300 group-hover:text-slate-500"
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
      className={`size-3 transition-colors ${className}`}
      fill="none"
      viewBox="0 0 12 12"
    >
      <path
        d={down ? "m3 4.5 3 3 3-3" : "m3 7.5 3-3 3 3"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
