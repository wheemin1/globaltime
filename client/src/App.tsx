import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
const Home = lazy(() => import("@/pages/home"));
const Room = lazy(() => import("@/pages/room"));
const CreateRoom = lazy(() => import("@/pages/create-room"));
const Features = lazy(() => import("@/pages/features"));
const HowItWorks = lazy(() => import("@/pages/how-it-works"));
const HelpShare = lazy(() => import("@/pages/help-share"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const NotFound = lazy(() => import("@/pages/not-found"));
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { LanguageSuggestBanner } from "@/components/language-suggest-banner";
import "@/lib/i18n";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        }
      >
        <div className="min-h-screen bg-background">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/create-room" component={CreateRoom} />
            <Route path="/features" component={Features} />
            <Route path="/how-it-works" component={HowItWorks} />
            <Route path="/help/share" component={HelpShare} />
            <Route path="/privacy" component={PrivacyPolicy} />
            <Route path="/room/:roomId" component={Room} />
            <Route path="/r/:roomId" component={Room} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
          <LanguageSuggestBanner />
        </div>
      </Suspense>
    </QueryClientProvider>
  );
}

export default App;