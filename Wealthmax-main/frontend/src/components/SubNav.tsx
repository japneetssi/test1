import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const getLinks = (isAuthenticated: boolean) => {
  const baseLinks = [
    { label: "Dashboard", path: "/dashboard", requiresAuth: true },
    { label: "Option Wealth", path: "/option-wealth", requiresAuth: true },
    { label: "Portfolio", path: "/portfolio", requiresAuth: true },
    { label: "Reports", path: "/reports", requiresAuth: true },
    { label: "Calculators", path: "/calculators", requiresAuth: false },
    { label: "Marketplace", path: "/marketplace", requiresAuth: false },
    { label: "Goals", path: "/goals", requiresAuth: true },
    { label: "Projections", path: "/projections", requiresAuth: true },
    { label: "Financial Dashboard", path: "/financial-dashboard", requiresAuth: true },
  ];

  return isAuthenticated ? baseLinks : baseLinks.filter(l => !l.requiresAuth);
};

const SubNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const links = getLinks(isAuthenticated);

  return (
    <div className="w-full bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-center sticky top-[60px] z-40">
      <nav className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.label}
              to={link.path}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                isActive 
                  ? "bg-blue-50 text-blue-700 border-blue-200" 
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default SubNav;
