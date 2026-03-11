import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { TimeGrid } from "./time-grid";
import { Check, Pencil, CalendarDays, CheckCircle2, X } from "lucide-react";
import { convertSlotToLocalTime, formatTimeForDisplay, generateBestSlots } from "@/lib/time-slots";
import { format, parseISO, eachDayOfInterval, addDays } from "date-fns";
import type { RoomWithParticipants } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface HeatmapResultsProps {
  room: RoomWithParticipants;
  viewingTimezone: string;
  selectedParticipant: number | null;
  onParticipantSelect: (participantId: number | null) => void;
  onConfirmSlot: (slotIndex: number) => void;
  onUnconfirm?: () => void;
  onEditTimes?: () => void;
  isHost: boolean;
  use12h?: boolean;
}

export function HeatmapResults({
  room,
  viewingTimezone,
  selectedParticipant,
  onParticipantSelect,
  onConfirmSlot,
  onUnconfirm,
  onEditTimes,
  isHost,
  use12h = false,
}: HeatmapResultsProps) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const { t } = useTranslation();

  const bestSlots = generateBestSlots(room.heatmap, room.participants, room.softHeatmap);

  const actualDays = (() => {
    const start = parseISO(room.startDate);
    const end = parseISO(room.endDate);
    return eachDayOfInterval({ start, end });
  })();

  const handleSlotClick = (slotIndex: number) => {
    setSelectedSlotIndex(slotIndex);
    setShowSlotModal(true);
  };

  const handleConfirmSelectedSlot = () => {
    if (selectedSlotIndex !== null) {
      onConfirmSlot(selectedSlotIndex);
      setShowSlotModal(false);
    }
  };

  const generateICSFile = (slotIndex: number) => {
    const dayIndex = Math.floor(slotIndex / slotsPerDay);
    const slotWithinDay = slotIndex % slotsPerDay;
    const totalMin = room.timeStart * 60 + slotWithinDay * slotMinutes;
    // Compute the UTC event start time correctly from room start date
    const baseDate = parseISO(room.startDate);
    const eventDate = addDays(baseDate, dayIndex);
    eventDate.setUTCHours(Math.floor(totalMin / 60), totalMin % 60, 0, 0);
    const eventEndDate = new Date(eventDate.getTime() + slotMinutes * 60 * 1000);
    const dtStart = eventDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dtEnd = eventEndDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//TimeSync//TimeSync//EN\nBEGIN:VEVENT\nUID:${Date.now()}@timesync.com\nDTSTAMP:${dtStamp}\nSUMMARY:${room.name}\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${room.name.replace(/\s+/g, "_")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSlotParticipants = (slotIndex: number) =>
    room.participants.filter((p) => p.availability[slotIndex] === "1");

  const getIfNeededParticipants = (slotIndex: number) =>
    room.participants.filter((p) => p.availability[slotIndex] === "2");

  const getUnavailableParticipants = (slotIndex: number) =>
    room.participants.filter((p) => p.availability[slotIndex] === "0");

  const slotMinutes = room.slotMinutes ?? 60;
  const slotsPerDay = 24 * Math.round(60 / slotMinutes);

  const getSlotLabel = (slotIndex: number) => {
    const dayIndex = Math.floor(slotIndex / slotsPerDay);
    const slotWithinDay = slotIndex % slotsPerDay;
    const localTime = convertSlotToLocalTime(dayIndex, slotWithinDay, viewingTimezone, room.startDate, room.timeStart, slotMinutes);
    const day = actualDays[dayIndex];
    if (!day) return formatTimeForDisplay(localTime, use12h);
    return `${format(day, "EEE, MMM d")} · ${formatTimeForDisplay(localTime, use12h)}`;
  }

  const totalParticipants = room.participants.length;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">{t('heatmap.heatmapTitle')}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('heatmap.heatmapSubtitle')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onEditTimes && (
                <Button variant="outline" size="sm" onClick={onEditTimes} className="h-8 text-xs">
                  <Pencil className="h-3 w-3 mr-1.5" />
                  {t('common.edit')}
                </Button>
              )}
              {room.isConfirmed ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t('heatmap.confirmed')}
                </Badge>
              ) : isHost ? (
                <Badge variant="secondary" className="text-xs">
                  {t('heatmap.awaitingConfirmation')}
                </Badge>
              ) : null}
              {room.isConfirmed && isHost && onUnconfirm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  onClick={onUnconfirm}
                >
                  <X className="h-3 w-3 mr-1" />
                  {t('heatmap.unconfirm')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <TimeGrid
            room={room}
            selectedSlots={[]}
            onSlotsChange={() => {}}
            viewingTimezone={viewingTimezone}
            isEditMode={false}
            heatmapData={room.heatmap}
            onSlotClick={handleSlotClick}
            selectedParticipant={selectedParticipant}
            use12h={use12h}
          />

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="font-medium">{t('heatmap.availableLabel')}:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded border border-border bg-background" />
              <span>{t('heatmap.legend.none')}</span>
            </div>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded time-cell heatmap-${n} p-0`} />
                <span>{n >= totalParticipants && totalParticipants > 0 ? t('heatmap.legend.all') : `${n}+`}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded time-cell heatmap-soft p-0" />
              <span>{t('heatmap.legend.ifNeeded')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Available Times */}
      {bestSlots.length > 0 && (
        <Card className="mt-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{t('heatmap.title')}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('heatmap.sortedByOverlap')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bestSlots.slice(0, 5).map((slot, idx) => {
                const all = slot.participantCount === totalParticipants;
                return (
                  <div
                    key={slot.slotIndex}
                    className={`group flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      all
                        ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
                        : "border-border bg-muted/30 hover:bg-accent/50"
                    }`}
                    onClick={() => handleSlotClick(slot.slotIndex)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{getSlotLabel(slot.slotIndex)}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {slot.availableParticipants.join(", ")}
                          {slot.ifNeededCount > 0 && (
                            <span className="text-amber-600"> · if needed: {slot.ifNeededParticipants.join(", ")}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`text-sm font-bold ${all ? "text-primary" : "text-foreground"}`}>
                        {slot.participantCount}/{totalParticipants}
                        {slot.ifNeededCount > 0 && <span className="text-xs text-amber-500 font-normal ml-1">+{slot.ifNeededCount}</span>}
                      </span>
                      {isHost && !room.isConfirmed && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfirmSlot(slot.slotIndex);
                          }}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {t('heatmap.confirmButton')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slot Detail Modal */}
      <Dialog open={showSlotModal} onOpenChange={setShowSlotModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedSlotIndex !== null ? getSlotLabel(selectedSlotIndex) : ""}
            </DialogTitle>
          </DialogHeader>

          {selectedSlotIndex !== null && (
            <div className="space-y-4 pt-1">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  {t('heatmap.slotDetail.available')} ({getSlotParticipants(selectedSlotIndex).length} / {totalParticipants})
                </p>
                <div className="space-y-2">
                  {getSlotParticipants(selectedSlotIndex).map((participant) => {
                    const dIdx = Math.floor(selectedSlotIndex / slotsPerDay);
                    const hIdx = selectedSlotIndex % slotsPerDay;
                    const pTime = convertSlotToLocalTime(dIdx, hIdx, participant.timezone, room.startDate, room.timeStart, slotMinutes);
                    return (
                      <div key={participant.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{participant.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {formatTimeForDisplay(pTime, use12h)}
                        </span>
                      </div>
                    );
                  })}
                  {getSlotParticipants(selectedSlotIndex).length === 0 && (
                    <p className="text-sm text-muted-foreground">{t('heatmap.noneAvailableAtTime')}</p>
                  )}
                </div>
              </div>

              {getIfNeededParticipants(selectedSlotIndex).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">
                    {t('heatmap.slotDetail.ifNeeded')} ({getIfNeededParticipants(selectedSlotIndex).length})
                  </p>
                  <div className="space-y-2">
                    {getIfNeededParticipants(selectedSlotIndex).map((participant) => {
                      const dIdx = Math.floor(selectedSlotIndex / slotsPerDay);
                      const hIdx = selectedSlotIndex % slotsPerDay;
                      const pTime = convertSlotToLocalTime(dIdx, hIdx, participant.timezone, room.startDate, room.timeStart, slotMinutes);
                      return (
                        <div key={participant.id} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-amber-700">{participant.name}</span>
                          <span className="text-muted-foreground text-xs">{formatTimeForDisplay(pTime, use12h)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {getUnavailableParticipants(selectedSlotIndex).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {t('heatmap.slotDetail.unavailable')} ({getUnavailableParticipants(selectedSlotIndex).length})
                  </p>
                  <div className="space-y-1.5">
                    {getUnavailableParticipants(selectedSlotIndex).map((participant) => (
                      <div key={participant.id} className="flex items-center text-sm">
                        <span className="text-muted-foreground">{participant.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(isHost && !room.isConfirmed) || (room.isConfirmed && selectedSlotIndex === room.confirmedSlot) ? (
                <Separator />
              ) : null}

              {isHost && !room.isConfirmed && (
                <Button onClick={handleConfirmSelectedSlot} className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  {t('heatmap.confirmTime')}
                </Button>
              )}

              {room.isConfirmed && selectedSlotIndex === room.confirmedSlot && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('heatmap.thisTimeConfirmed')}
                  </div>
                  <Button
                    onClick={() => generateICSFile(selectedSlotIndex)}
                    variant="outline"
                    className="w-full"
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    {t('heatmap.downloadICS')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


interface HeatmapResultsProps {
  room: RoomWithParticipants;
  viewingTimezone: string;
  selectedParticipant: number | null;
  onParticipantSelect: (participantId: number | null) => void;
  onConfirmSlot: (slotIndex: number) => void;
  onEditTimes?: () => void;
  isHost: boolean;
}
