import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingCTA from "./components/FloatingCTA";
import MobileBottomNav from "./components/MobileBottomNav";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Evaluate = lazy(() => import("./pages/Evaluate"));
const PricingTaipei = lazy(() => import("./pages/PricingTaipei"));
const PricingKaohsiung = lazy(() => import("./pages/PricingKaohsiung"));
const Case = lazy(() => import("./pages/Case"));
const Video = lazy(() => import("./pages/Video"));
const Faq = lazy(() => import("./pages/Faq"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const AiEstimate = lazy(() => import("./pages/AiEstimate"));
const Track = lazy(() => import("./pages/Track"));
const Packaging = lazy(() => import("./pages/Packaging"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const LadderTruckDemo = lazy(() => import("./pages/LadderTruckDemo"));
const AdminTicketDetail = lazy(() => import("./pages/AdminTicketDetail"));
const ChatWidget = lazy(() => import("./components/ChatWidget").then((mod) => ({ default: mod.ChatWidget })));

function AdminRouter() {
  return (
    <Suspense fallback={<div className="min-h-[320px] flex items-center justify-center text-gray-500">正在載入管理頁面…</div>}>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/ticket/:id" component={AdminTicketDetail} />
      </Switch>
    </Suspense>
  );
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16 pb-16 md:pb-0">
        <Suspense fallback={<div className="min-h-[320px] flex items-center justify-center text-gray-500">正在載入頁面…</div>}>
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
        </Suspense>
      </main>
      <Footer />
      <FloatingCTA />
      <MobileBottomNav />
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  );
}

function AppContent() {
  const [location] = useLocation();
  if (location === "/ladder-demo") {
    return (
      <Suspense fallback={<div className="min-h-[320px] flex items-center justify-center text-gray-500">正在載入示範頁面…</div>}>
        <LadderTruckDemo />
      </Suspense>
    );
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
