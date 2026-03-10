import { Button } from "@/components/ui/button";
import { Globe, Users, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SEO, seoConfigs } from "@/components/SEO";
import { StructuredData, structuredDataConfigs } from "@/components/StructuredData";
import { Layout } from "@/components/layout";
import { BugReport } from "@/components/bug-report";

const features = [
  {
    icon: Globe,
    title: "Timezone-Smart",
    description:
      "Auto-detects your timezone. Every participant sees availability in their local time — no mental math required.",
  },
  {
    icon: Users,
    title: "Visual Heatmap",
    description:
      "Color-coded overlap view shows at a glance when your team is free. Pick the darkest block and you're done.",
  },
  {
    icon: Zap,
    title: "Drag & Drop — No Sign Up",
    description:
      "Select your hours by dragging. Share a link. That's it. No accounts, no email, no friction.",
  },
];

const steps = [
  {
    n: "1",
    title: "Create a room",
    desc: "Name your meeting, pick possible dates, set a time window.",
  },
  {
    n: "2",
    title: "Share the link",
    desc: "Send the URL to teammates — they join with just their name and timezone.",
  },
  {
    n: "3",
    title: "Confirm the best time",
    desc: "Review the heatmap, pick the slot where everyone overlaps, confirm.",
  },
];

export default function Home() {
  return (
    <Layout>
      <SEO {...seoConfigs.home} />
      <StructuredData type="WebApplication" data={structuredDataConfigs.webApplication} />
      <StructuredData type="Organization" data={structuredDataConfigs.organization} />

      {/* ── Hero ── */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground mb-6">
            Free · No registration · Works globally
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Find the perfect meeting time{" "}
            <span className="text-primary">across timezones</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            <strong className="text-foreground font-medium">Free global meeting scheduler</strong> with drag-and-drop availability. Coordinate international teams with heatmap visibility.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create-room">
              <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2">
                Create a Meeting Room
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="ghost" size="lg" className="h-12 px-6 text-base text-muted-foreground hover:text-foreground">
                How it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border bg-muted/30">
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

      {/* ── How it works ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">
            Three steps — under 2 minutes
          </h2>
          <div className="space-y-0">
            {steps.map((step, idx) => (
              <div key={step.n} className="flex gap-6">
                {/* connector */}
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                    {step.n}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="w-px flex-1 bg-border my-1" />
                  )}
                </div>
                <div className={`${idx < steps.length - 1 ? "pb-10" : ""} pt-1`}>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/create-room">
              <Button size="lg" className="h-12 px-10 text-base font-semibold">
                Get started — it's free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <BugReport position="bottom" />
    </Layout>
  );
}
