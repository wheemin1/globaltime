import { SEO, seoConfigs } from "@/components/SEO";
import { Clock, Users, Globe, Zap, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Layout } from "@/components/layout";

const features = [
  {
    icon: Clock,
    title: "Smart Timezone Handling",
    description:
      "Automatically converts and displays times across multiple timezones. Everyone sees the grid in their own local time.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description:
      "Multiple participants can join and update their availability simultaneously. Results update instantly.",
  },
  {
    icon: BarChart3,
    title: "Visual Overlap Analysis",
    description:
      "Heatmap visualization instantly reveals the best meeting times for all participants at a glance.",
  },
  {
    icon: Zap,
    title: "Drag & Drop Interface",
    description:
      "Intuitive click-and-drag selection makes marking your availability quick and effortless on any device.",
  },
  {
    icon: Globe,
    title: "114+ Cities Supported",
    description:
      "Choose from over 114 cities worldwide with accurate timezone information across all continents.",
  },
  {
    icon: Shield,
    title: "Private by Design",
    description:
      "Meeting rooms are not indexed by search engines. Only people with the link can join.",
  },
];

export default function Features() {
  return (
    <Layout>
      <SEO {...seoConfigs.features} />

      {/* Hero */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Everything you need for global scheduling
          </h1>
          <p className="text-base text-muted-foreground">
            Built for remote and international teams — simple enough for anyone, powerful enough for complex timezone setups.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
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

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-xl mx-auto text-center space-y-5">
          <h2 className="text-2xl font-bold text-foreground">Ready to get started?</h2>
          <p className="text-muted-foreground text-sm">
            Create your first meeting room in seconds — no account needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create-room">
              <Button size="lg" className="font-semibold">Create Meeting Room</Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline">How It Works</Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
