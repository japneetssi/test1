import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import MarketWatch from "@/components/MarketWatch";
import HealthScoreGauge from "@/components/HealthScoreGauge";
import PersonaCard from "@/components/PersonaCard";
import QuickActions from "@/components/QuickActions";
import SmartAlerts from "@/components/SmartAlerts";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (user?.role === 'advisor') {
      navigate('/advisor/crm', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <TopNav />
      <SubNav />

      {/* Dashboard Grid */}
      <main 
        className="flex-1 p-4 gap-4 grid grid-cols-1 lg:grid-cols-[1fr_2.5fr_1.5fr] max-w-[1600px] w-full mx-auto" 
        style={{ minHeight: "calc(100vh - 92px)" }}
      >
        {/* Left - Market Watch */}
        <aside className="min-w-0">
          <MarketWatch />
        </aside>

        {/* Center */}
        <section className="min-w-0 flex flex-col gap-4">
          <HealthScoreGauge />
          <PersonaCard />
        </section>

        {/* Right */}
        <aside className="min-w-0 flex flex-col gap-4">
          <QuickActions />
          <SmartAlerts />
        </aside>
      </main>
    </div>
  );
};

export default Index;
