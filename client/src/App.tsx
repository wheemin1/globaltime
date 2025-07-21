import { Route, Switch } from "wouter";
import Home from "@/pages/home";
import CreateRoom from "@/pages/create-room";
import Room from "@/pages/room";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/create-room" component={CreateRoom} />
          <Route path="/room/:roomId" component={Room} />
          <Route path="/r/:roomId" component={Room} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;