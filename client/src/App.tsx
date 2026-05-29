import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingCTA from "./components/FloatingCTA";
import MobileBottomNav from "./components/MobileBottomNav";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Evaluate from "./pages/Evaluate";
import PricingTaipei from "./pages/PricingTaipei";
import PricingKaohsiung from "./pages/PricingKaohsiung";
import Case from "./pages/Case";
import Video from "./pages/Video";
import Faq from "./pages/Faq";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Contact from "./pages/Contact";
import AiEstimate from "./pages/AiEstimate";
import Track from "./pages/Track";
import Packaging from "./pages/Packaging";
import AdminDashboard from "./pages/AdminDashboard";
import LadderTruckDemo from "./pages/LadderTruckDemo";
import AdminTicketDetail from "./pages/AdminTicketDetail";
import { ChatWidget } from "./components/ChatWidget";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/ticket/:id" component={AdminTicketDetail} />
    </Switch>
  );
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16 pb-16 md:pb-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/services" component={Services} />
          <Route path="/evaluate" component={Evaluate} />
          <Route path="/pricing-taipei" component={PricingTaipei} />
          <Route path="/pricing-kaohsiung" component={PricingKaohsiung} />
          <Route path="/case" component={Case} />
          <Route path="/video" component={Video} />
          <Route path="/faq" component={Faq} />
          <Route path="/news" component={News} />
          <Route path="/news/:id" component={NewsDetail} />
          <Route path="/contact" component={Contact} />
          <Route path="/ai-estimate" component={AiEstimate} />
          <Route path="/track" component={Track} />
          <Route path="/packaging" component={Packaging} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <FloatingCTA />
      <MobileBottomNav />
      <ChatWidget />
    </div>
  );
}

function AppContent() {
  const [location] = useLocation();
  if (location === "/ladder-demo") {
    return <LadderTruckDemo />;
  }
  if (location.startsWith("/admin")) {
    return <AdminRouter />;
  }
  return <Router />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
