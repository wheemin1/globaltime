import { SEO, seoConfigs } from "@/components/SEO";
import { Clock, Users, Globe, Zap, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useTranslation } from "react-i18next";

export default function Features() {
  const { t } = useTranslation();

  const features = [
    { icon: Clock, key: "timezone" },
    { icon: Users, key: "realtime" },
    { icon: BarChart3, key: "heatmap" },
    { icon: Zap, key: "drag" },
    { icon: Globe, key: "noSignup" },
    { icon: Shield, key: "export" },
  ];

  return (
    <Layout>
      <SEO {...seoConfigs.features} />

      {/* Hero */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            {t('features.title')}
          </h1>
          <p className="text-base text-muted-foreground">
            {t('features.subtitle')}
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, key }) => (
              <div key={key} className="rounded-xl border border-border bg-card p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{t(`features.list.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`features.list.${key}.desc`)}</p>
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
              <Button size="lg" className="font-semibold">{t('features.cta')}</Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline">{t('nav.howItWorks')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
