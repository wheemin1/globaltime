import { SEO, seoConfigs } from "@/components/SEO";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Layout } from "@/components/layout";

const steps = [
  {
    number: "01",
    title: "Create a Meeting Room",
    description:
      "Set up your meeting with a name, date range (up to 2 weeks), and a daily time window. Your timezone is auto-detected.",
    details: [
      "Choose your meeting dates",
      "Set time boundaries (e.g. 9am – 6pm)",
      "Name your meeting room",
      "Instantly receive a shareable link",
    ],
  },
  {
    number: "02",
    title: "Share with Participants",
    description:
      "Send the link to your team. Participants join by entering their name and selecting their timezone — no accounts required.",
    details: [
      "Share the unique room URL",
      "Participants join with just their name",
      "Everyone picks their own timezone",
      "No registration or passwords",
    ],
  },
  {
    number: "03",
    title: "Find the Perfect Time",
    description:
      "Everyone drags to mark their availability. The heatmap shows overlapping times. The host confirms the final slot.",
    details: [
      "Drag to select available hours",
      "Real-time availability heatmap",
      "Best slots ranked automatically",
      "Host confirms — done",
    ],
  },
];

export default function HowItWorks() {
  return (
    <Layout>
      <SEO {...seoConfigs.howItWorks} />

      {/* Hero */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            How TimeSync works
          </h1>
          <p className="text-base text-muted-foreground">
            Three steps to coordinate your global team meeting — takes less than two minutes.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {steps.map((step, idx) => (
            <div key={step.number} className="rounded-xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-start gap-5">
                <span className="shrink-0 text-3xl font-black text-primary/20 leading-none">
                  {step.number}
                </span>
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-foreground">{step.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  <ul className="space-y-1.5 pt-1">
                    {step.details.map((d) => (
                      <li key={d} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-xl mx-auto text-center space-y-5">
          <h2 className="text-2xl font-bold text-foreground">Try it now — it's free</h2>
          <p className="text-muted-foreground text-sm">
            Start coordinating your global team meetings in under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create-room">
              <Button size="lg" className="font-semibold">Create Your First Room</Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline">See All Features</Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
