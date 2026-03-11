import { SEO, seoConfigs } from "@/components/SEO";
import { Link as LinkIcon, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useTranslation } from "react-i18next";

const sharingMethods = [
  {
    icon: LinkIcon,
    title: "Copy the room URL",
    description:
      "The room URL is your invite link. Paste it into any chat — Slack, Teams, email, WhatsApp — and anyone with the link can join.",
    steps: [
      "Open your meeting room",
      "Click the copy icon in the header",
      "Paste into your preferred tool",
      "That's it — no accounts needed",
    ],
  },
  {
    icon: Copy,
    title: "One-click copy button",
    description:
      "Hit the copy icon in the room header bar. The URL is copied to your clipboard instantly, ready to paste.",
    steps: [
      "Open the room",
      "Click copy icon (top right)",
      "Paste to teammates",
      "Unlimited participants supported",
    ],
  },
];

const bestPractices = [
  {
    title: "Set clear expectations",
    description:
      "Tell participants the meeting purpose and length when sharing so they mark the right hours.",
  },
  {
    title: "Share early",
    description:
      "Give people across timezones a day or two to fill in their availability — not everyone is online simultaneously.",
  },
  {
    title: "Use a descriptive name",
    description:
      "Name your room clearly (e.g. \"Q2 Planning — April\") so participants immediately know what it's for.",
  },
  {
    title: "Follow up with local times",
    description:
      "When confirming, send the final time in each participant's local timezone to avoid confusion.",
  },
];

const faq = [
  {
    q: "How many participants can join a room?",
    a: "There's no hard limit. The more participants, the richer the heatmap data.",
  },
  {
    q: "Do participants need to create accounts?",
    a: "No. Participants only enter their name and timezone. Nothing else.",
  },
  {
    q: "How long do meeting rooms stay active?",
    a: "Rooms stay active as long as you have the link. There's no automatic expiration.",
  },
];

export default function HelpShare() {
  const { t } = useTranslation();
  return (
    <Layout>
      <SEO {...seoConfigs.helpShare} />

      {/* Hero */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            {t('helpShare.title')}
          </h1>
          <p className="text-base text-muted-foreground">
            {t('helpShare.subtitle')}
          </p>
        </div>
      </section>

      {/* Sharing methods */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Sharing Methods
          </h2>
          <div className="grid md:grid-cols-2 gap-5 mb-14">
            {sharingMethods.map(({ icon: Icon, title, description, steps }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                <ol className="space-y-2">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          {/* Best Practices */}
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Best Practices
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-14">
            {bestPractices.map(({ title, description }) => (
              <div key={title} className="rounded-lg border border-border bg-card p-5 flex gap-3">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faq.map(({ q, a }) => (
              <div key={q} className="rounded-lg border border-border bg-card p-5">
                <p className="text-sm font-semibold text-foreground mb-1.5">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border mt-8">
        <div className="max-w-xl mx-auto text-center space-y-5">
          <h2 className="text-2xl font-bold text-foreground">{t('helpShare.cta.title', 'Ready to coordinate?')}</h2>
          <p className="text-muted-foreground text-sm">
            {t('helpShare.cta.desc', 'Create a free meeting room and share it with your team in seconds.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create-room">
              <Button size="lg" className="font-semibold">{t('common.newMeeting')}</Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline">{t('common.howItWorks')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
