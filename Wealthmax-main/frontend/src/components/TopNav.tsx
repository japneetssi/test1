import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, ShoppingCart, User, LogOut, Settings, LayoutDashboard, ShieldCheck, Diamond } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";
import { useInvestmentCart } from "@/contexts/InvestmentCartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TopNav = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { branding } = useBranding();
  const { cartItems, setCartOpen } = useInvestmentCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-[60px] flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      {/* Logo Area */}
      <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0">
        {branding?.logoUrl ? (
          <img src={branding.logoUrl} alt={branding.name} className="h-8 w-auto rounded object-contain" />
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
            <Diamond className="w-5 h-5 fill-current" />
          </div>
        )}
        <span className="text-slate-900 font-bold text-xl tracking-tight">
          {branding?.name || "WealthMax"}
        </span>
      </Link>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl mx-auto hidden md:block px-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients, portfolios, or reports..."
            className="w-full h-10 pl-10 pr-4 rounded-full bg-slate-100 border-none text-slate-900 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-5 shrink-0">
        <button onClick={() => setCartOpen(true)} className="text-slate-500 hover:text-slate-900 transition-colors relative">
          <ShoppingCart className="h-5 w-5" />
          {cartItems.length > 0 && (
            <span className="absolute -top-1.5 -right-2 h-3.5 w-3.5 bg-[#f37920] rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm border border-white">
              {cartItems.length}
            </span>
          )}
        </button>
        
        <button className="text-slate-500 hover:text-slate-900 transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {user?.full_name?.charAt(0) || "U"}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 hidden sm:block">
                    {user?.full_name?.split(' ')[0] || "User"}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {user?.role === 'admin' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin/dashboard')} className="cursor-pointer text-orange-600 focus:text-orange-600">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Admin Console</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button className="h-9 px-4 ml-2 bg-[#f37920] hover:bg-[#e06b18] text-white text-sm font-semibold rounded-full transition-colors shadow-sm whitespace-nowrap">
              Upgrade to Pro
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-full hover:bg-slate-100">
              Login
            </Link>
            <Link to="/signup" className="h-9 px-5 bg-slate-900 text-white text-sm font-semibold rounded-full flex items-center justify-center hover:bg-slate-800 shadow-md transition-all">
              Open Account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNav;
