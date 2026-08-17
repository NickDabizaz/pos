type SideBarSkeletonProps = {
  isCollapsed?: boolean;
};

export default function SideBarSkeleton({ isCollapsed = false }: SideBarSkeletonProps) {
  return (
    <div className="flex flex-col gap-6 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-muted" />
        {!isCollapsed && (
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-24 rounded bg-muted" />
            <div className="h-2.5 w-16 rounded bg-muted" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        {!isCollapsed && <div className="h-2.5 w-14 rounded bg-muted/60 mb-1" />}
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            className="flex h-10 items-center gap-3 rounded-xl bg-muted/50 px-3"
            key={`skel-${index}`}
          >
            <div className="size-5 rounded-lg bg-muted" />
            {!isCollapsed && <div className="h-3 w-28 rounded bg-muted" />}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        {!isCollapsed && <div className="h-2.5 w-20 rounded bg-muted/60 mb-1" />}
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="flex h-10 items-center gap-3 rounded-xl bg-muted/50 px-3"
            key={`skel-sub-${index}`}
          >
            <div className="size-5 rounded-lg bg-muted" />
            {!isCollapsed && <div className="h-3 w-32 rounded bg-muted" />}
          </div>
        ))}
      </div>
    </div>
  );
}
