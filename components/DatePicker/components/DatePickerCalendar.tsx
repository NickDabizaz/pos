import { formatMonthLabel, getCalendarDays, toIsoDate } from "@/components/DatePicker/lib/dateFormat";

const weekdayLabels = ["M", "S", "S", "R", "K", "J", "S"];

type DatePickerCalendarProps = {
  onSelectAction: (isoDate: string) => void;
  selectedIso   ?: string;
  viewMonth     : number;
  viewYear      : number;
  onViewChangeAction: (year: number, month: number) => void;
};

export default function DatePickerCalendar({
  onSelectAction,
  onViewChangeAction,
  selectedIso,
  viewMonth,
  viewYear,
}: DatePickerCalendarProps) {
  const days = getCalendarDays(viewYear, viewMonth);
  const todayIso = toIsoDate(new Date());

  function goToPreviousMonth() {
    onViewChangeAction(viewMonth === 0 ? viewYear - 1 : viewYear, viewMonth === 0 ? 11 : viewMonth - 1);
  }

  function goToNextMonth() {
    onViewChangeAction(viewMonth === 11 ? viewYear + 1 : viewYear, viewMonth === 11 ? 0 : viewMonth + 1);
  }

  return (
    <div className="w-72 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          aria-label="Bulan sebelumnya"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onClick={goToPreviousMonth}
          type="button"
        >
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-foreground">{formatMonthLabel(viewYear, viewMonth)}</span>
        <button
          aria-label="Bulan berikutnya"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onClick={goToNextMonth}
          type="button"
        >
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {weekdayLabels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((date) => {
          const iso           = toIsoDate(date);
          const isCurrentMonth = date.getMonth() === viewMonth;
          const isSelected     = iso === selectedIso;
          const isToday        = iso === todayIso;

          return (
            <button
              className={`rounded-md py-1.5 text-xs transition-colors ${
                isSelected
                  ? "bg-primary font-semibold text-primary-foreground"
                  : isCurrentMonth
                    ? "text-foreground hover:bg-secondary"
                    : "text-muted-foreground/50 hover:bg-secondary"
              } ${isToday && !isSelected ? "ring-1 ring-inset ring-primary/50" : ""}`}
              key={iso}
              onClick={() => onSelectAction(iso)}
              type="button"
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
