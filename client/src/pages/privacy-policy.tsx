import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="Privacy Policy – TimeSync Global Meeting Scheduler"
        description="Read TimeSync's privacy policy to understand how we handle your data when you use our free global meeting scheduler."
        canonical="https://globalmeetingtime.netlify.app/privacy"
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-8">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
              <Link href="/">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Home
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mt-2">Last updated: March 11, 2026</p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground">

            <section>
              <h2 className="text-lg font-semibold mb-3">1. Overview</h2>
              <p className="text-muted-foreground">
                TimeSync ("we", "us", or "our") operates the website{" "}
                <a href="https://globalmeetingtime.netlify.app" className="text-primary underline">
                  globalmeetingtime.netlify.app
                </a>{" "}
                (the "Service"). This page informs you of our policies regarding the collection, use,
                and disclosure of personal data when you use our Service. We are committed to
                protecting your privacy and handling your data transparently.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. Data We Collect</h2>
              <p className="text-muted-foreground mb-3">
                TimeSync is designed to require minimal personal information. We collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Display name</strong> — The name you voluntarily enter when joining a meeting room (e.g., "Alex"). This is visible to other room participants.
                </li>
                <li>
                  <strong className="text-foreground">Timezone</strong> — The timezone you select when joining a room, used to display availability in your local time.
                </li>
                <li>
                  <strong className="text-foreground">Availability data</strong> — The time slots you select within a meeting room, stored as a compact binary string in our database.
                </li>
                <li>
                  <strong className="text-foreground">Usage data</strong> — Standard server logs including IP addresses, browser type, pages visited, and timestamps. This data is not linked to your identity.
                </li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We do <strong className="text-foreground">not</strong> collect: email addresses, passwords, phone numbers, payment information, or any form of account credentials. No registration is required to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">3. How We Use Your Data</h2>
              <p className="text-muted-foreground mb-3">The data collected is used solely to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Display your availability to other participants in your meeting room</li>
                <li>Generate timezone-aware overlap heatmaps for scheduling</li>
                <li>Store your session so you can return to and update your availability</li>
                <li>Improve the performance and reliability of the Service</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We do <strong className="text-foreground">not</strong> sell, rent, or share your data with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. Data Storage and Retention</h2>
              <p className="text-muted-foreground">
                Meeting room data (name, availability, timezone) is stored in a PostgreSQL database hosted on{" "}
                <a href="https://supabase.com" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                  Supabase
                </a>{" "}
                (AWS infrastructure, ap-northeast-2 region). Room data is retained indefinitely unless
                deleted by the room host or by our system. We reserve the right to delete inactive
                rooms (no activity for 6+ months) to manage storage.
              </p>
              <p className="text-muted-foreground mt-3">
                Your room host ID is stored in your browser's <code className="bg-muted px-1 rounded text-xs">localStorage</code> to allow host-only actions. This is a random identifier, not linked to any personal account.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. Cookies and Local Storage</h2>
              <p className="text-muted-foreground">
                TimeSync uses <strong className="text-foreground">browser localStorage</strong> (not cookies) to store:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
                <li>Your theme preference (dark/light mode)</li>
                <li>Your host or participant session ID for rooms you've created or joined</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                No third-party tracking cookies are currently set. If we add analytics or advertising
                in the future, this policy will be updated.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">6. Third-Party Services</h2>
              <p className="text-muted-foreground mb-3">We use the following third-party infrastructure:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Netlify</strong> — Hosts the frontend of the Service. Netlify may collect standard access logs. See{" "}
                  <a href="https://www.netlify.com/privacy/" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                    Netlify's Privacy Policy
                  </a>.
                </li>
                <li>
                  <strong className="text-foreground">Supabase</strong> — Hosts the database. See{" "}
                  <a href="https://supabase.com/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                    Supabase's Privacy Policy
                  </a>.
                </li>
                <li>
                  <strong className="text-foreground">Google Fonts</strong> — Used to serve the Geist font. Google may log font requests. See{" "}
                  <a href="https://policies.google.com/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                    Google's Privacy Policy
                  </a>.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">7. Children's Privacy</h2>
              <p className="text-muted-foreground">
                The Service is not directed at children under 13 years of age. We do not knowingly
                collect personally identifiable information from children under 13. If you are a parent
                or guardian and believe your child has provided us with data, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">8. Your Rights</h2>
              <p className="text-muted-foreground mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Request deletion of your availability data from a specific room by contacting us</li>
                <li>Clear your local session data at any time via your browser settings</li>
                <li>Request information about what data we hold about you</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Since we do not collect email addresses, requests must be made by contacting us directly
                with your room ID and participant name.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">9. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. Changes will be posted on this
                page with an updated date. Continued use of the Service after changes constitutes
                acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">10. Contact</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:jowheemin@gmail.com" className="text-primary underline">
                  jowheemin@gmail.com
                </a>.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-border">
            <Button variant="ghost" size="sm" className="-ml-2" asChild>
              <Link href="/">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
