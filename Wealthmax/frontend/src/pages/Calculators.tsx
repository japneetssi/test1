import { useState, useMemo, Suspense, lazy } from "react";
import { ComponentLoadingFallback } from "@/components/LoadingSpinner";
import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import { TrendingUp, Shield, Clock, GraduationCap, Timer, Receipt, Home, Calculator, X } from "lucide-react";

// Lazy load calculator components
const SIPCalculatorUI = lazy(() => import("@/components/calculators/SIPCalculatorUI").then(module => ({ default: module.SIPCalculatorUI })));
const RetirementCalculatorUI = lazy(() => import("@/components/calculators/RetirementCalculatorUI").then(module => ({ default: module.RetirementCalculatorUI })));
const LifeInsuranceCalculatorUI = lazy(() => import("@/components/calculators/LifeInsuranceCalculatorUI").then(module => ({ default: module.LifeInsuranceCalculatorUI })));
const EducationCalculatorUI = lazy(() => import("@/components/calculators/EducationCalculatorUI").then(module => ({ default: module.EducationCalculatorUI })));
const CostOfDelayCalculatorUI = lazy(() => import("@/components/calculators/CostOfDelayCalculatorUI").then(module => ({ default: module.CostOfDelayCalculatorUI })));
const HRACalculatorUI = lazy(() => import("@/components/calculators/HRACalculatorUI").then(module => ({ default: module.HRACalculatorUI })));
const HomeAffordabilityCalculatorUI = lazy(() => import("@/components/calculators/HomeAffordabilityCalculatorUI").then(module => ({ default: module.HomeAffordabilityCalculatorUI })));
const EMICalculatorUI = lazy(() => import("@/components/calculators/EMICalculatorUI").then(module => ({ default: module.EMICalculatorUI })));
const CAGRCalculatorUI = lazy(() => import("@/components/calculators/CAGRCalculatorUI").then(module => ({ default: module.CAGRCalculatorUI })));

// ── Modal Shell ───────────────────────────────────────────────────────────────
const Modal = ({
  icon: Icon, title, onClose, children,
}: {
  icon: any; title: string; onClose: () => void; children: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
    {/* Increased max-width to accommodate the new 2-column layout. The layout min-width is bounded below. */}
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#00458c]/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-[#00458c]" />
          </div>
          <h2 className="font-bold text-lg text-slate-800 tracking-tight">{title}</h2>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-0 bg-slate-50/30">
        {/* Render the new UI layout directly inside the modal */}
        {children}
      </div>
    </div>
  </div>
);

// ── Tool Registry ─────────────────────────────────────────────────────────────
const TOOLS = [
  { id: "sip", title: "SIP Calculator", description: "Plan your future wealth with systematic investments.", icon: TrendingUp },
  { id: "life-insurance", title: "Life Insurance Gap", description: "Calculate required Human Life Value cover.", icon: Shield },
  { id: "retirement", title: "Retirement Planner", description: "Inflation-adjusted corpus needs for retirement.", icon: Clock },
  { id: "education", title: "Education Planner", description: "Estimate the future cost of education.", icon: GraduationCap },
  { id: "cost-delay", title: "Cost of Delay", description: "See how waiting to invest costs you.", icon: Timer },
  { id: "hra", title: "HRA Calculator", description: "Optimize your tax savings on rent.", icon: Receipt },
  { id: "home", title: "Home Affordability", description: "Check your maximum loan eligibility.", icon: Home },
  { id: "tax", title: "EMI / Tax Planner", description: "Calculate EMI and plan 80C & 80D deductions.", icon: Calculator },
  { id: "emergency", title: "Emergency Fund", description: "Calculate your ideal safety net via SIP projection.", icon: Shield },
  { id: "cagr", title: "CAGR Calculator", description: "Calculate compounded growth of your investments.", icon: TrendingUp },
];

const MODAL_MAP: Record<string, { Component: React.ComponentType<any>, icon: any, title: string }> = {
  "sip": { Component: SIPCalculatorUI, icon: TrendingUp, title: "SIP Calculator" },
  "life-insurance": { Component: LifeInsuranceCalculatorUI, icon: Shield, title: "Life Insurance Gap" },
  "retirement": { Component: RetirementCalculatorUI, icon: Clock, title: "Retirement Planner" },
  "education": { Component: EducationCalculatorUI, icon: GraduationCap, title: "Education Planner" },
  "cost-delay": { Component: CostOfDelayCalculatorUI, icon: Timer, title: "Cost of Delay" },
  "hra": { Component: HRACalculatorUI, icon: Receipt, title: "HRA Calculator" },
  "home": { Component: HomeAffordabilityCalculatorUI, icon: Home, title: "Home Affordability" },
  "tax": { Component: EMICalculatorUI, icon: Calculator, title: "EMI / Tax Planner" },
  "emergency": { Component: SIPCalculatorUI, icon: Shield, title: "Emergency Fund" }, // Emergency fund uses SIP calculator logic for now
  "cagr": { Component: CAGRCalculatorUI, icon: TrendingUp, title: "CAGR Calculator" },
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const Calculators = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const activeToolData = activeTool ? MODAL_MAP[activeTool] : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopNav />
      {/* <SubNav /> */} {/* Uncomment if SubNav is needed here, currently omitting to clean up UI based on Dashboard */}

      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Tools &amp; Calculators</h1>
          <p className="text-base text-slate-500 mt-2 max-w-3xl">
            Plan, analyze, and optimize every aspect of your financial life with our comprehensive suite of intelligent calculators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-[#f37920]/50 hover:shadow-lg hover:shadow-[#f37920]/5 transition-all group group-hover:-translate-y-1 block duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-[#00458c]/5 flex items-center justify-center shrink-0 group-hover:bg-[#f37920]/10 transition-colors duration-300">
                  <tool.icon className="h-6 w-6 text-[#00458c] group-hover:text-[#f37920] transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-[#00458c] transition-colors">{tool.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-snug">{tool.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Modals — wrapping the dedicated UI components */}
      {activeTool && activeToolData && (
        <Modal
          icon={activeToolData.icon}
          title={activeToolData.title}
          onClose={() => setActiveTool(null)}
        >
          <Suspense fallback={<ComponentLoadingFallback />}>
            <activeToolData.Component />
          </Suspense>
        </Modal>
      )}
    </div>
  );
};

export default Calculators;

