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
import { useTranslation } from "react-i18next";
import type { CreateRoomRequest } from "@shared/schema";

const featureKeys = [
  { icon: Globe, key: "timezone" },
  { icon: Users, key: "heatmap" },
  { icon: Zap, key: "noSignUp" },
];

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
      setLocation(`/room/${data.roomId}?host=${data.hostId}`);
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

      {/* ── Hero: copy + inline form ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Left: copy */}
            <div className="pt-4 lg:pt-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground mb-6">
                {t('common.free114cities')}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                {t('home.hero.headline')}{" "}
                <span className="text-primary">{t('home.hero.headlineHighlight')}</span>
              </h1>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-md">
                <strong className="text-foreground font-medium">{t('home.hero.subtext')}</strong>{" "}
                {t('home.hero.description')}
              </p>

              <ul className="mt-6 space-y-2">
                {[
                  t('home.hero.checks.drag'),
                  t('home.hero.checks.heatmap'),
                  t('home.hero.checks.noAccount'),
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
                    <p className="text-xs text-muted-foreground mt-0.5">{t('home.stats.roomsCreated')}</p>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      {stats.totalParticipants.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('home.stats.participantsJoined')}</p>
                  </div>
                </div>
              )}

              {/* "How it works" mini-steps — hidden on mobile to save space */}
              <div className="hidden lg:block mt-10 space-y-4">
                {[
                  { n: "1", title: t('home.steps.step1Title'), desc: t('home.steps.step1Desc') },
                  { n: "2", title: t('home.steps.step2Title'), desc: t('home.steps.step2Desc') },
                  { n: "3", title: t('home.steps.step3Title'), desc: t('home.steps.step3Desc') },
                ].map((step, idx, arr) => (
                  <div key={step.n} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {step.n}
                      </div>
                      {idx < arr.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                    </div>
                    <div className={`${idx < arr.length - 1 ? "pb-4" : ""} pt-0.5`}>
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
                <h2 className="text-base font-semibold text-foreground">{t('home.form.title')}</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Step 1: Names */}
                <div className="space-y-1 pb-1 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold mr-1.5">1</span>
                    {t('home.form.stepBasic')}
                  </p>
                </div>
                {/* Meeting name + your name */}
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

                {/* Timezone */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('home.form.yourTimezone')}</Label>
                  <TimezoneSelector value={hostTimezone} onChange={setHostTimezone} />
                </div>

                {/* Step 2: Dates */}
                <div className="space-y-1 pb-1 border-b border-border pt-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold mr-1.5">2</span>
                    {t('home.form.stepDates')}
                  </p>
                </div>

                {/* Date picker */}
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
                  <p className="text-xs text-muted-foreground">{t('home.form.dateHint')}</p>
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

                {/* Step 3: Time window */}
                <div className="space-y-1 pb-1 border-b border-border pt-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold mr-1.5">3</span>
                    {t('home.form.stepTime')}
                  </p>
                </div>
                {/* Time window */}
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
          </div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground text-center mb-8">
            {t('home.features.sectionTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featureKeys.map(({ icon: Icon, key }) => (
              <div key={key} className="rounded-xl border border-border bg-card p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{t(`home.features.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`home.features.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO: How it works (mobile / search engines) ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            {t('home.stepsSection.headline')}
          </h2>
          <div className="space-y-0">
            {[
              { n: "1", title: t('home.steps.step1Title'), desc: t('home.steps.step1Desc') },
              { n: "2", title: t('home.steps.step2Title'), desc: t('home.steps.step2Desc') },
              { n: "3", title: t('home.steps.step3Title'), desc: t('home.steps.step3Desc') },
            ].map((step, idx, arr) => (
              <div key={step.n} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                    {step.n}
                  </div>
                  {idx < arr.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className={`${idx < arr.length - 1 ? "pb-10" : ""} pt-1`}>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BugReport position="bottom" />

      {/* FAQ section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <StructuredData
            type="FAQPage"
            data={{
              questions: [
                { q: t('home.faq.q1'), a: t('home.faq.a1') },
                { q: t('home.faq.q2'), a: t('home.faq.a2') },
                { q: t('home.faq.q3'), a: t('home.faq.a3') },
                { q: t('home.faq.q4'), a: t('home.faq.a4') },
                { q: t('home.faq.q5'), a: t('home.faq.a5') },
              ],
            }}
          />
          <h2 className="text-lg font-semibold text-foreground mb-6">{t('home.faq.title')}</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <details key={n} className="group rounded-lg border border-border bg-card px-4 py-3">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-foreground list-none">
                  {t(`home.faq.q${n}`)}
                  <span className="shrink-0 text-muted-foreground group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(`home.faq.a${n}`)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* SEO content section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-muted/20">
        <div className="max-w-3xl mx-auto space-y-6 text-sm text-muted-foreground">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">{t('home.seoSection.title1')}</h2>
            <p>{t('home.seoSection.body1')}</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">{t('home.seoSection.title2')}</h2>
            <p>{t('home.seoSection.body2')}</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">{t('home.seoSection.title3')}</h2>
            <p>{t('home.seoSection.body3')}</p>
          </div>
        </div>
      </section>

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
