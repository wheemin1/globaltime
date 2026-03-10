import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, CalendarDays, Timer } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { TimezoneSelector } from "@/components/timezone-selector";
import { getUserTimezone } from "@/lib/timezone-utils";
import { Navbar } from "@/components/layout";
import { BugReport } from "@/components/bug-report";
import type { CreateRoomRequest } from "@shared/schema";

function StepLabel({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
        {number}
      </span>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </div>
  );
}

export default function CreateRoom() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [roomName, setRoomName] = useState("");
  const [hostName, setHostName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [slotMinutes, setSlotMinutes] = useState<30 | 60>(60);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [timeStart, setTimeStart] = useState(9);
  const [timeEnd, setTimeEnd] = useState(17);
  const [hostTimezone, setHostTimezone] = useState(getUserTimezone());

  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoomRequest) => {
      const response = await apiRequest("POST", "/api/rooms", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Room created!",
        description: "Share the link with your team.",
      });
      setLocation(`/room/${data.roomId}?host=${data.hostId}`);
    },
    onError: (error) => {
      toast({
        title: "Error creating room",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName.trim()) {
      toast({ title: "Meeting name required", variant: "destructive" });
      return;
    }
    if (!hostName.trim()) {
      toast({ title: "Your name required", variant: "destructive" });
      return;
    }
    if (!selectedRange?.from) {
      toast({ title: "Select at least one date", variant: "destructive" });
      return;
    }
    if (timeStart >= timeEnd) {
      toast({ title: "End time must be after start time", variant: "destructive" });
      return;
    }

    const startD = selectedRange.from;
    const endD = selectedRange.to || selectedRange.from;
    createRoomMutation.mutate({
      name: roomName.trim(),
      hostName: hostName.trim(),
      hostTimezone,
      startDate: format(startD, "yyyy-MM-dd"),
      endDate: format(endD, "yyyy-MM-dd"),
      timeStart,
      timeEnd,
      description: description.trim() || undefined,
      deadline: deadline || undefined,
      slotMinutes,
    });
  };

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 14);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Create a Meeting Room</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up a room, share the link — no accounts needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Step 1: Meeting details ── */}
          <Card>
            <CardContent className="pt-6">
              <StepLabel number={1} label="Meeting Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="roomName" className="text-sm font-medium">Meeting Name</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Weekly Standup"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hostName" className="text-sm font-medium">Your Name</Label>
                  <Input
                    id="hostName"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="e.g. Alex Kim"
                    required
                  />
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <Label className="text-sm font-medium">Your Timezone</Label>
                <TimezoneSelector value={hostTimezone} onChange={setHostTimezone} />
              </div>

              <div className="mt-4 space-y-1.5">
                <Label className="text-sm font-medium">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Agenda, video call link, notes..."
                  rows={2}
                  className="text-sm"
                  maxLength={500}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Step 2: Select dates ── */}
          <Card>
            <CardContent className="pt-6">
              <StepLabel number={2} label="Select Meeting Dates" />
              <p className="text-xs text-muted-foreground mb-4">
                Pick the start and end dates for the meeting (up to 14 days ahead).
              </p>
              <div className="flex justify-center">
                <Calendar
                  mode="range"
                  selected={selectedRange}
                  onSelect={setSelectedRange}
                  disabled={(date) => date < today || date > maxDate}
                  className="rounded-lg border border-border"
                />
              </div>
              {selectedRange?.from && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {selectedRange.to && selectedRange.to.getTime() !== selectedRange.from.getTime()
                    ? `${format(selectedRange.from, "MMM d")} – ${format(selectedRange.to, "MMM d")}`
                    : format(selectedRange.from, "MMM d, yyyy")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── Step 3: Time window ── */}
          <Card>
            <CardContent className="pt-6">
              <StepLabel number={3} label="Daily Time Window" />
              <p className="text-xs text-muted-foreground mb-4">
                The hours of the day participants can select availability within.
              </p>

              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Slot Duration</Label>
                <div className="flex gap-2">
                  {([60, 30] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        slotMinutes === m
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:bg-accent"
                      }`}
                      onClick={() => setSlotMinutes(m)}
                    >
                      {m === 60 ? "1 hour" : "30 min"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Start Hour</Label>
                  <Select
                    value={String(timeStart)}
                    onValueChange={(v) => {
                      const newStart = parseInt(v);
                      setTimeStart(newStart);
                      if (timeEnd <= newStart) setTimeEnd(newStart + 1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {h.toString().padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">End Hour</Label>
                  <Select
                    value={String(timeEnd)}
                    onValueChange={(v) => setTimeEnd(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 23 }, (_, i) => i + 1).filter(h => h > timeStart).map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {h.toString().padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <Label className="text-sm font-medium">
                  Response Deadline{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={format(today, "yyyy-MM-dd")}
                  max={format(maxDate, "yyyy-MM-dd")}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">Block availability changes after this date.</p>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold"
            disabled={createRoomMutation.isPending}
          >
            {createRoomMutation.isPending ? "Creating..." : "Create Room & Continue →"}
          </Button>
        </form>
      </div>

      <BugReport position="bottom" />
    </div>
  );
}
