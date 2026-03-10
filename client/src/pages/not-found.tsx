import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Clock } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
          <span className="text-3xl font-black text-muted-foreground">?</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground mt-2">
            The page you're looking for doesn't exist or was moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/create-room">New Meeting</Link>
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
          <Clock className="h-3.5 w-3.5" />
          <span>TimeSync</span>
        </div>
      </div>
    </div>
  );
}

