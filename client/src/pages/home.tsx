import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Users, Zap, Clock, Check } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { TimezoneSelector } from "@/components/timezone-selector";
import { getUserTimezone } from "@/lib/timezone-utils";
import { SEO, seoConfigs } from "@/components/SEO";
import { StructuredData, structuredDataConfigs } from "@/components/StructuredData";
import { Layout } from "@/components/layout";
import { BugReport } from "@/components/bug-report";
import type { CreateRoomRequest } from "@shared/schema";

const features = [
  {
    icon: Globe,
    title: "Timezone-Smart",
    description:
      "Auto-detects your timezone. Every participant sees availability in their local time — no math required.",
  },
  {
    icon: Users,
    title: "Visual Heatmap",
    description:
      "Color-coded overlap view shows when your team is free. Pick the darkest block.",
  },
  {
    icon: Zap,
    title: "No Sign Up",
    description:
      "Drag to select hours, share a link. No accounts, no email, no friction.",
  },
];

const steps = [
  { n: "1", title: "Create a room", desc: "Name your meeting, pick dates, set a time window." },
  { n: "2", title: "Share the link", desc: "Teammates join with just their name and timezone." },
  { n: "3", title: "Confirm the best time", desc: "Review the heatmap and confirm the slot." },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: stats } = useQuery<{ totalRooms: number; totalParticipants: number }>({
    queryKey: ["/api/stats"],
    staleTime: 60_000,
  });

  const [roomName, setRoomName] = useState("");
  const [hostName, setHostName] = useState("");
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [timeStart, setTimeStart] = useState(9);
  const [timeEnd, setTimeEnd] = useState(18);
  const [hostTimezone, setHostTimezone] = useState(getUserTimezone());

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);
  const hours = Array.from({ length: 24 }, (_, i) => i);

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
    const endD = selectedRange.to || selectedRange.from;
    createRoomMutation.mutate({
      name: roomName.trim(),
      hostName: hostName.trim(),
      hostTimezone,
      startDate: format(selectedRange.from, "yyyy-MM-dd"),
      endDate: format(endD, "yyyy-MM-dd"),
      timeStart,
      timeEnd,
      slotMinutes: 60,
    });
  };

  return (
    <Layout>
      <SEO {...seoConfigs.home} />
      <StructuredData type="WebApplication" data={structuredDataConfigs.webApplication} />
      <StructuredData type="Organization" data={structuredDataConfigs.organization} />

      {/* ── Hero: copy + inline form ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Left: copy */}
            <div className="pt-4 lg:pt-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground mb-6">
                Free · No registration · Works globally
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                Find the time that works{" "}
                <span className="text-primary">for everyone</span>
              </h1>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-md">
                <strong className="text-foreground font-medium">Free global meeting scheduler.</strong>{" "}
                Each participant picks availability in their own timezone — you see the overlap instantly.
              </p>

              <ul className="mt-6 space-y-2">
                {[
                  "Drag-and-drop time selection",
                  "Heatmap shows the best overlap",
                  "No accounts or email needed",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* Stats counters */}
              {stats && (stats.totalRooms > 0 || stats.totalParticipants > 0) && (
                <div className="mt-8 flex gap-6">
                  <div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      {stats.totalRooms.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">rooms created</p>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      {stats.totalParticipants.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">participants joined</p>
                  </div>
                </div>
              )}

              {/* "How it works" mini-steps — hidden on mobile to save space */}
              <div className="hidden lg:block mt-10 space-y-4">
                {steps.map((step, idx) => (
                  <div key={step.n} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {step.n}
                      </div>
                      {idx < steps.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                    </div>
                    <div className={`${idx < steps.length - 1 ? "pb-4" : ""} pt-0.5`}>
                      <p className="text-sm font-medium text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: form card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">New Meeting Room</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Meeting name + your name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="roomName" className="text-sm font-medium">Meeting Name</Label>
                    <Input
                      id="roomName"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Weekly Standup"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hostName" className="text-sm font-medium">Your Name</Label>
                    <Input
                      id="hostName"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder="Alex Kim"
                    />
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Your Timezone</Label>
                  <TimezoneSelector value={hostTimezone} onChange={setHostTimezone} />
                </div>

                {/* Date picker */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Meeting Dates
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                      {selectedRange?.from
                        ? selectedRange.to && selectedRange.to.getTime() !== selectedRange.from.getTime()
                          ? `${format(selectedRange.from, "MMM d")} – ${format(selectedRange.to, "MMM d")}`
                          : format(selectedRange.from, "MMM d, yyyy")
                        : "select range"}
                    </span>
                  </Label>
                  <div className="flex justify-center">
                    <Calendar
                      mode="range"
                      selected={selectedRange}
                      onSelect={setSelectedRange}
                      disabled={(date) => date < today || date > maxDate}
                      className="rounded-lg border border-border"
                    />
                  </div>
                </div>

                {/* Time window */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Daily Time Window</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={String(timeStart)}
                      onValueChange={(v) => {
                        const s = parseInt(v);
                        setTimeStart(s);
                        if (timeEnd <= s) setTimeEnd(s + 1);
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
                    <Select
                      value={String(timeEnd)}
                      onValueChange={(v) => setTimeEnd(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hours.filter((h) => h > timeStart).map((h) => (
                          <SelectItem key={h} value={String(h)}>
                            {h.toString().padStart(2, "0")}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold"
                  disabled={createRoomMutation.isPending}
                >
                  {createRoomMutation.isPending ? "Creating..." : "Create Room & Get Link →"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO: How it works (mobile / search engines) ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            Three steps — under 2 minutes
          </h2>
          <div className="space-y-0">
            {steps.map((step, idx) => (
              <div key={step.n} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                    {step.n}
                  </div>
                  {idx < steps.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className={`${idx < steps.length - 1 ? "pb-10" : ""} pt-1`}>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BugReport position="bottom" />

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} TimeSync. Free global meeting scheduler.</span>
          <nav className="flex items-center gap-4">
            <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="/help/share" className="hover:text-foreground transition-colors">Help</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          </nav>
        </div>
      </footer>
    </Layout>
  );
}
