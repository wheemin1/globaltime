import { SEO, seoConfigs } from "@/components/SEO";
import { StructuredData, BASE_URL } from "@/components/StructuredData";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useTranslation } from "react-i18next";

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      number: "01",
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.desc'),
      details: [
        "Choose your meeting dates",
        "Set time boundaries (e.g. 9am – 6pm)",
        "Name your meeting room",
        "Instantly receive a shareable link",
      ],
    },
    {
      number: "02",
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.desc'),
      details: [
        "Share the unique room URL",
        "Participants join with just their name",
        "Everyone picks their own timezone",
        "No registration or passwords",
      ],
    },
    {
      number: "03",
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.desc'),
      details: [
        "Drag to select available hours",
        "Real-time availability heatmap",
        "Best slots ranked automatically",
        "Host confirms — done",
      ],
    },
  ];

  return (
    <Layout>
      <SEO {...seoConfigs.howItWorks} />
      <StructuredData
        type="HowTo"
        data={{
          name: t('howItWorks.title'),
          description: t('howItWorks.subtitle'),
          steps: steps.map(step => ({ name: step.title, text: step.description })),
        }}
      />
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: [
            { name: 'Home', url: BASE_URL },
            { name: t('howItWorks.title'), url: `${BASE_URL}/how-it-works` },
          ],
        }}
      />

      {/* Hero */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            {t('howItWorks.title')}
          </h1>
          <p className="text-base text-muted-foreground">
            {t('howItWorks.subtitle')}
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {steps.map((step) => (
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
          <h2 className="text-2xl font-bold text-foreground">{t('howItWorks.ctaTitle')}</h2>
          <p className="text-muted-foreground text-sm">
            {t('howItWorks.ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create-room">
              <Button size="lg" className="font-semibold">{t('howItWorks.cta')}</Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline">{t('nav.features')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
