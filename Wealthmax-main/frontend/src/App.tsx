import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { PageLoadingFallback } from "@/components/LoadingSpinner";
import { AuthProvider } from "./contexts/AuthContext";
import { BrandingProvider } from "./contexts/BrandingContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AnimatePresence, motion } from "framer-motion";
import { InvestmentCartProvider } from "./contexts/InvestmentCartContext";
import { InvestmentCartDrawer } from "./components/marketplace/InvestmentCartDrawer";

// Lazy load pages with route-based code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Survey = lazy(() => import("./pages/Survey"));
const SurveyResults = lazy(() => import("./pages/SurveyResults"));

// Dashboard and main app pages
const Index = lazy(() => import("./pages/Index"));
const OptionWealth = lazy(() => import("./pages/OptionWealth"));
const Reports = lazy(() => import("./pages/Reports"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Goals = lazy(() => import("./pages/Goals"));
const Projections = lazy(() => import("./pages/Projections"));
const TaxPlanner = lazy(() => import("./pages/TaxPlanner"));
const PortfolioRebalancing = lazy(() => import("./pages/PortfolioRebalancing"));
const ClientReassignment = lazy(() => import("./pages/ClientReassignment"));
const PortfolioReview = lazy(() => import("./pages/PortfolioReview"));
const FamilyManagement = lazy(() => import("./pages/FamilyManagement"));
const Profile = lazy(() => import("./pages/Profile"));

// Public feature pages
const Calculators = lazy(() => import("./pages/Calculators"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const FinancialSnapshot = lazy(() => import("./pages/FinancialSnapshot"));
const FinancialDashboard = lazy(() => import("./pages/FinancialDashboard"));
const ReportingDashboard = lazy(() => import("./pages/ReportingDashboard"));
const SmartReportDashboard = lazy(() => import("./pages/SmartReportDashboard"));

// Admin, Partner & Advisor pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const PartnerAdvisorManagement = lazy(() => import("./pages/PartnerAdvisorManagement"));
const PartnerFirmAnalytics = lazy(() => import("./pages/PartnerFirmAnalytics"));
const AdvisorConsole = lazy(() => import("./pages/AdvisorConsole"));
const ClientImpersonationView = lazy(() => import("./pages/ClientImpersonationView"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const OnboardingPipeline = lazy(() => import("./pages/OnboardingPipeline"));
const AdvisorSetup = lazy(() => import("./pages/AdvisorSetup"));

const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Page wrapper for transitions
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public feature routes */}
        <Route path="/calculators" element={<PageTransition><Calculators /></PageTransition>} />
        <Route path="/marketplace" element={<PageTransition><Marketplace /></PageTransition>} />
        <Route path="/marketplace/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
        <Route path="/financial-snapshot" element={<PageTransition><FinancialSnapshot /></PageTransition>} />

        {/* Public Landing */}
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />

        {/* Public Auth Routes */}
        <Route path="/login" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/advisor-setup" element={<PageTransition><AdvisorSetup /></PageTransition>} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding/financial-snapshot" element={<PageTransition><FinancialSnapshot /></PageTransition>} />
          <Route path="/onboarding/pipeline" element={<PageTransition><OnboardingPipeline /></PageTransition>} />
          <Route path="/survey" element={<PageTransition><Survey /></PageTransition>} />
          <Route path="/survey-results" element={<PageTransition><SurveyResults /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/option-wealth" element={<PageTransition><OptionWealth /></PageTransition>} />
          <Route path="/reports" element={<PageTransition><Reports /></PageTransition>} />
          <Route path="/portfolio" element={<PageTransition><Portfolio /></PageTransition>} />
          <Route path="/goals" element={<PageTransition><Goals /></PageTransition>} />
          <Route path="/projections" element={<PageTransition><Projections /></PageTransition>} />
          <Route path="/tax-planner" element={<PageTransition><TaxPlanner /></PageTransition>} />
          <Route path="/rebalancing" element={<PageTransition><PortfolioRebalancing /></PageTransition>} />
          <Route path="/advisor/portfolio-review/:clientId" element={<PageTransition><PortfolioReview /></PageTransition>} />
          <Route path="/family" element={<PageTransition><FamilyManagement /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
          <Route path="/financial-dashboard" element={<PageTransition><FinancialDashboard /></PageTransition>} />
          <Route path="/reporting" element={<PageTransition><ReportingDashboard /></PageTransition>} />
          <Route path="/smart-report" element={<PageTransition><SmartReportDashboard /></PageTransition>} />
        </Route>

        {/* Partner only routes */}
        <Route element={<ProtectedRoute allowedRoles={['partner']} />}>
          <Route path="/partner/dashboard" element={<PageTransition><PartnerDashboard /></PageTransition>} />
          <Route path="/partner/advisors" element={<PageTransition><PartnerAdvisorManagement /></PageTransition>} />
          <Route path="/partner/analytics" element={<PageTransition><PartnerFirmAnalytics /></PageTransition>} />
          <Route path="/partner/reassign-clients" element={<PageTransition><ClientReassignment /></PageTransition>} />
          <Route path="/partner/settings" element={<PageTransition><PartnerDashboard /></PageTransition>} />
        </Route>

        {/* Admin only routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
        </Route>

        {/* RM & Advisor Console routes */}
        <Route element={<ProtectedRoute allowedRoles={['relationship_manager', 'advisor', 'partner']} />}>
          <Route path="/rm/dashboard" element={<PageTransition><AdvisorConsole /></PageTransition>} />
          <Route path="/rm/onboarding" element={<PageTransition><AdvisorConsole /></PageTransition>} />
          <Route path="/rm/clients" element={<PageTransition><AdvisorConsole /></PageTransition>} />
          <Route path="/rm/approvals" element={<PageTransition><AdvisorConsole /></PageTransition>} />
          <Route path="/advisor/dashboard" element={<PageTransition><AdvisorConsole /></PageTransition>} />
          <Route path="/advisor/crm" element={<PageTransition><AdvisorConsole /></PageTransition>} />
          <Route path="/advisor/client/:clientId" element={<PageTransition><ClientDetail /></PageTransition>} />
          <Route path="/advisor/prospects" element={<PageTransition><AdvisorConsole /></PageTransition>} />
          <Route path="/advisor/proposals" element={<PageTransition><AdvisorConsole /></PageTransition>} />
          <Route path="/rm/client-view/:clientId" element={<PageTransition><ClientImpersonationView /></PageTransition>} />
        </Route>

        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrandingProvider>
        <InvestmentCartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoadingFallback />}>
                <AnimatedRoutes />
                <InvestmentCartDrawer />
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </InvestmentCartProvider>
      </BrandingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
