import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Users, CheckCircle2, X } from "lucide-react";
import type { Participant } from "@shared/schema";
import { getCommonTimezones } from "@/lib/timezone-utils";
import { useTranslation } from "react-i18next";

const _tzList = getCommonTimezones();
function getFriendlyTimezone(tzValue: string): string {
  const tz = _tzList.find(t => t.value === tzValue);
  return tz ? tz.city : (tzValue.split("/").pop()?.replace(/_/g, " ") ?? tzValue);
}

interface ParticipantPanelProps {
  participants: Participant[];
  selectedParticipant: number | null;
  onParticipantSelect: (participantId: number | null) => void;
  onViewResults?: () => void;
  onEditTimes?: () => void;
  isResultsMode?: boolean;
  isMobile?: boolean;
  isHost?: boolean;
  currentParticipantId?: number | null;
  onDeleteParticipant?: (participantId: number) => void;
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvailabilityCount(availability: string) {
  return availability.split("").filter((b) => b === "1").length;
}

function ParticipantList({
  participants,
  selectedParticipant,
  onParticipantSelect,
  isHost,
  currentParticipantId,
  onDeleteParticipant,
}: Pick<ParticipantPanelProps, "participants" | "selectedParticipant" | "onParticipantSelect" | "isHost" | "currentParticipantId" | "onDeleteParticipant">) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      {participants.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('participants.noParticipants')}
        </p>
      )}
      {participants.map((participant, index) => {
        const isSelected = selectedParticipant === participant.id;
        const slots = getAvailabilityCount(participant.availability);
        return (
          <div
            key={participant.id}
            className={`participant-card flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
              isSelected
                ? "border-primary/40 bg-primary/5"
                : "border-border hover:bg-accent/50"
            }`}
            onClick={() =>
              onParticipantSelect(isSelected ? null : participant.id)
            }
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  AVATAR_COLORS[index % AVATAR_COLORS.length]
                }`}
              >
                {getInitials(participant.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {participant.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {getFriendlyTimezone(participant.timezone)}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {slots}
              </span>
              {isHost && participant.id !== currentParticipantId && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  onClick={(e) => { e.stopPropagation(); onDeleteParticipant?.(participant.id); }}
                  title={t('participants.removeParticipant')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ParticipantPanel({
  participants,
  selectedParticipant,
  onParticipantSelect,
  onViewResults,
  onEditTimes,
  isResultsMode = false,
  isMobile = false,
  isHost = false,
  currentParticipantId = null,
  onDeleteParticipant,
}: ParticipantPanelProps) {
  const { t } = useTranslation();
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="w-full mt-4">
            <Users className="h-4 w-4 mr-2" />
            {t('participants.team', { count: participants.length })}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('participants.title')}
              <Badge variant="secondary" className="ml-1">
                {participants.length}
              </Badge>
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
            <ParticipantList
              participants={participants}
              selectedParticipant={selectedParticipant}
              onParticipantSelect={onParticipantSelect}
              isHost={isHost}
              currentParticipantId={currentParticipantId}
              onDeleteParticipant={onDeleteParticipant}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('participants.title')}
          </span>
          <Badge variant="secondary" className="font-normal">
            {participants.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <ParticipantList
          participants={participants}
          selectedParticipant={selectedParticipant}
          onParticipantSelect={onParticipantSelect}
          isHost={isHost}
          currentParticipantId={currentParticipantId}
          onDeleteParticipant={onDeleteParticipant}
        />

        {!isResultsMode && onViewResults && participants.length > 0 && (
          <div className="pt-3 border-t border-border">
            <Button onClick={onViewResults} className="w-full" size="sm">
              {t('room.viewHeatmap')}
            </Button>
          </div>
        )}

        {isResultsMode && onEditTimes && (
          <div className="pt-3 border-t border-border">
            <Button onClick={onEditTimes} variant="outline" className="w-full" size="sm">
              {t('room.editMyTimes')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
