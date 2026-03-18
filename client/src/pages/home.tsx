import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";
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
import { useTranslation } from "react-i18next";
import type { CreateRoomRequest } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

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
  const maxDate = addDays(today, 30);
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
      const hostParam = data.hostToken
        ? `hostToken=${encodeURIComponent(data.hostToken)}`
        : `host=${encodeURIComponent(data.hostId)}`;
      setLocation(`/room/${data.roomId}?${hostParam}`);
    },
    onError: (error) => {
      toast({
        title: t('errors.unknown'),
        description: error.message || t('errors.unknown'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast({ title: t('errors.meetingNameRequired'), variant: "destructive" });
      return;
    }
    if (!hostName.trim()) {
      toast({ title: t('errors.yourNameRequired'), variant: "destructive" });
      return;
    }
    if (!selectedRange?.from) {
      toast({ title: t('errors.selectOneDate'), variant: "destructive" });
      return;
    }
    if (timeStart >= timeEnd) {
      toast({ title: t('errors.endAfterStart'), variant: "destructive" });
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
      slotMinutes: 30,
    });
  };

  return (
    <Layout showFooter={false}>
      <SEO {...seoConfigs.home} />
      <StructuredData type="WebApplication" data={structuredDataConfigs.webApplication} />
      <StructuredData type="Organization" data={structuredDataConfigs.organization} />

      {/* Tool-first landing */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
              {t('common.free114cities')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {t('home.form.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('home.hero.subtext')}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm p-5 sm:p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="roomName" className="text-sm font-medium">{t('home.form.meetingName')}</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder={t('home.form.meetingNamePlaceholder')}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hostName" className="text-sm font-medium">{t('home.form.yourName')}</Label>
                  <Input
                    id="hostName"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder={t('home.form.yourNamePlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('home.form.yourTimezone')}</Label>
                <TimezoneSelector value={hostTimezone} onChange={setHostTimezone} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('home.form.meetingDates')}</Label>
                  <span className="text-xs text-muted-foreground">
                    {selectedRange?.from
                      ? selectedRange.to && selectedRange.to.getTime() !== selectedRange.from.getTime()
                        ? `${format(selectedRange.from, "MMM d")} – ${format(selectedRange.to, "MMM d")}`
                        : format(selectedRange.from, "MMM d, yyyy")
                      : t('home.form.selectRange')}
                  </span>
                </div>
                <div className="flex justify-center">
                  <Calendar
                    mode="range"
                    selected={selectedRange}
                    onSelect={setSelectedRange}
                    disabled={(date) => date < today || date > maxDate}
                    modifiers={{ today }}
                    modifiersClassNames={{ today: 'rdp-day_today_highlight' }}
                    className="rounded-lg border border-border"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('home.form.dailyWindow')}</Label>
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
                {createRoomMutation.isPending ? t('common.creating') : t('home.form.createButton')}
              </Button>
            </form>
          </div>

          {stats && (stats.totalRooms > 0 || stats.totalParticipants > 0) && (
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>{stats.totalRooms.toLocaleString()} {t('home.stats.roomsCreated')}</span>
              <span className="text-border">•</span>
              <span>{stats.totalParticipants.toLocaleString()} {t('home.stats.participantsJoined')}</span>
            </div>
          )}
        </div>
      </section>

      <BugReport position="bottom" />

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          <nav className="flex items-center gap-4">
            <Link href="/features" className="hover:text-foreground transition-colors">{t('nav.features')}</Link>
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">{t('nav.howItWorks')}</Link>
            <Link href="/help/share" className="hover:text-foreground transition-colors">{t('nav.help')}</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">{t('common.privacy')}</Link>
          </nav>
        </div>
      </footer>
    </Layout>
  );
}
