import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "@/pages/dashboard";
import Editor from "@/pages/editor";
import Analysis from "@/pages/analysis";
import RoyaltyCalculator from "@/pages/royalty-calculator";
import Collaboration from "@/pages/collaboration";
import Blockchain from "@/pages/blockchain";
import NotFound from "@/pages/not-found";
import AdvancedAnalytics from "./pages/advanced-analytics";
import Web3Marketplace from "./pages/web3-marketplace";
import AdminPanel from "./pages/admin-panel";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/editor" component={Editor} />
      <Route path="/editor/:id" component={Editor} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/analysis/:id" component={Analysis} />
      <Route path="/royalty-calculator" component={RoyaltyCalculator} />
      <Route path="/royalty-calculator/:id" component={RoyaltyCalculator} />
      <Route path="/collaboration" component={Collaboration} />
      <Route path="/blockchain" component={Blockchain} />
      <Route path="/advanced-analytics" component={AdvancedAnalytics} />
      <Route path="/web3-marketplace" component={Web3Marketplace} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;