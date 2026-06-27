import { Check, Circle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { STATUS_FLOW, formatDateTime, useStatusLabel, type ShipmentStatus } from "@/lib/pme";

export interface TimelineEvent {
  id: string;
  status: ShipmentStatus;
  location: string | null;
  note: string | null;
  updated_by_name: string | null;
  event_at: string;
}

export function TrackingTimeline({
  events,
  currentStatus,
}: {
  events: TimelineEvent[];
  currentStatus: ShipmentStatus;
}) {
  const { t } = useTranslation();
  const statusLabel = useStatusLabel();
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime(),
  );

  return (
    <div className="space-y-8">
      <div className="hidden md:block">
        <ol className="flex items-start justify-between">
          {STATUS_FLOW.map((s, i) => {
            const done = currentStatus === "delivered" || i < currentIdx;
            const active = i === currentIdx;
            return (
              <li key={s} className="flex flex-1 flex-col items-center text-center">
                <div
                  className={`mb-2 grid h-9 w-9 place-items-center rounded-full border-2 ${
                    done
                      ? "border-success bg-success text-success-foreground"
                      : active
                        ? "border-pme-red bg-pme-red text-pme-red-foreground"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3 w-3 fill-current" />
                  )}
                </div>
                <div
                  className={`text-[11px] leading-tight ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  {statusLabel(s)}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-4 text-display text-lg font-semibold">{t("track.movementTimeline")}</h3>
        {sortedEvents.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("track.noEventsYet")}</p>
        )}
        <ol className="relative space-y-6 border-l border-border pl-6">
          {sortedEvents.map((e, idx) => (
            <li key={e.id} className="relative">
              <span
                className={`absolute -left-[31px] top-0.5 grid h-6 w-6 place-items-center rounded-full border-2 ${
                  idx === 0
                    ? "border-pme-red bg-pme-red/10 text-pme-red"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                <Clock className="h-3 w-3" />
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-semibold text-foreground">{statusLabel(e.status)}</div>
                <div className="text-xs text-muted-foreground">{formatDateTime(e.event_at)}</div>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {e.location && <span>{e.location}</span>}
                {e.updated_by_name && (
                  <span>
                    {" "}
                    · {t("track.updatedBy")} {e.updated_by_name}
                  </span>
                )}
              </div>
              {e.note && <div className="mt-1 text-sm">{e.note}</div>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
