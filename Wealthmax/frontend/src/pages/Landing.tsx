import { ArrowRight, BarChart3, Shield, Users, User, TrendingUp, CheckCircle, ChevronRight, Activity, LineChart, PieChart as PieChartIcon, Heart, FileText, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import logo from "@/assets/wealthmax-logo.png";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import CountUp from 'react-countup';

const Landing = () => {
    const navigate = useNavigate();
    const { scrollY } = useScroll();
    const navBackground = useTransform(scrollY, [0, 50], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.9)"]);
    const navBorder = useTransform(scrollY, [0, 50], ["rgba(226, 232, 240, 0)", "rgba(226, 232, 240, 1)"]);
    return (
        <div className="min-h-screen bg-white font-sans text-[#1d1d1f]">
            {/* ── Header ──────────────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <OptimizedImage src={logo} alt="WealthMax" className="h-9 w-9 rounded object-cover" />
                        <span className="text-[#00458c] font-bold text-2xl tracking-tight">WealthMax</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#00458c]/80">
                        <a href="#features" className="hover:text-[#00458c] transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-[#00458c] transition-colors">Pricing</a>
                        <Link to="/login" className="hover:text-[#00458c] transition-colors">Login</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link
                            to="/signup"
                            className="bg-[#f37920] hover:bg-[#e06b18] text-white px-6 py-2.5 rounded text-[15px] font-bold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                        >
                            Open Account
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── Hero Section ────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-white pt-24 pb-32">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">

                    {/* Left Text */}
                    <div className="max-w-2xl relative z-10">
                        <h1 className="text-[3.5rem] leading-[1.15] font-extrabold text-[#00458c] mb-6 tracking-tight">
                            Your Automated Financial Advisor & Margin Powerhouse
                        </h1>
                        <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-lg">
                            Get your Financial Health Score and unlock up to 80% LTV on your portfolio. WealthMax combines intelligent wealth management with margin trading capabilities to maximize your financial potential.
                        </p>
                        <div className="flex items-center gap-4">
                            <Link
                                to="/dashboard"
                                className="bg-[#f37920] hover:bg-[#e06b18] text-white px-8 py-3.5 rounded text-base font-bold shadow-lg shadow-[#f37920]/20 transition-all hover:shadow-xl flex items-center gap-2 hover:-translate-y-0.5"
                            >
                                Get Started <ArrowRight className="h-5 w-5" />
                            </Link>
                            <button className="px-8 py-3.5 rounded text-[#00458c] font-bold border-2 border-[#00458c] hover:bg-[#00458c]/5 transition-colors text-base">
                                Learn More
                            </button>
                        </div>
                    </div>

                    {/* Right Hero Graphic (Abstract UI Gauge) */}
                    <div className="relative h-[500px] w-full flex items-center justify-center">
                        {/* Soft background decor */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#00458c]/5 to-[#f37920]/5 rounded-full blur-3xl scale-125" />

                        <div className="relative w-[400px] h-[400px] bg-white rounded-full shadow-[0_20px_50px_rgba(0,69,140,0.1)] border border-gray-50 flex items-center justify-center z-10">
                            {/* Outer dashed ring */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90 text-[#00458c]/10" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                            </svg>

                            {/* Solid thick arc (The Score) */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-md" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" strokeDasharray="180 100" strokeDashoffset="40" />
                                <circle cx="50" cy="50" r="38" fill="transparent" stroke="url(#blueOrange)" strokeWidth="8" strokeLinecap="round" strokeDasharray="140 100" strokeDashoffset="40" className="animate-[strike_1.5s_ease-out_forwards]" />
                                <defs>
                                    <linearGradient id="blueOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#f37920" />
                                        <stop offset="100%" stopColor="#00458c" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Inner Circle Content */}
                            <div className="w-[260px] h-[260px] bg-gray-50/50 rounded-full flex flex-col items-center justify-center relative shadow-inner">
                                <span className="text-[#00458c] text-[4rem] font-black leading-none tracking-tighter drop-shadow-sm">720</span>
                                <span className="text-gray-500 font-medium text-sm mt-1">out of 1000</span>

                                {/* Gauge Needle */}
                                <div className="absolute top-1/2 left-1/2 w-32 h-[3px] bg-[#00458c] origin-left rotate-[35deg] rounded-full shadow-md z-20">
                                    <div className="absolute -left-2 -top-[5px] w-3 h-3 bg-[#f37920] rounded-full ring-4 ring-white" />
                                    <div className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-[#00458c] rounded-full" />
                                </div>
                            </div>

                            {/* Floating Data Nodes */}
                            <div className="absolute bottom-16 left-12 w-4 h-4 rounded-full bg-green-400 border-4 border-white shadow-sm" />
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#f37920] border-4 border-white shadow-sm" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features Section ──────────────────────────────────────────────────── */}
            <section id="features" className="py-24 bg-[#00458c]/[0.02] border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-[#00458c] text-4xl font-extrabold tracking-tight mb-4">Why Choose WealthMax?</h2>
                        <p className="text-gray-500 text-lg">
                            Industry-leading tools and insights designed to help you make smarter financial decisions.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group flex flex-col h-full">
                            <div className="w-14 h-14 bg-[#00458c] rounded-xl flex items-center justify-center mb-6 text-white shadow-inner group-hover:scale-110 transition-transform">
                                <User className="h-6 w-6" />
                            </div>
                            <h3 className="text-[#00458c] text-xl font-bold mb-3">Intelligent Profiling</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Get a comprehensive Financial Health Score that analyzes your savings rate, debt ratio, liquidity, and investment performance all in one place.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group flex flex-col h-full">
                            <div className="w-14 h-14 bg-[#00458c] rounded-xl flex items-center justify-center mb-6 text-white shadow-inner group-hover:scale-110 transition-transform">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="text-[#00458c] text-xl font-bold mb-3">Option Wealth Margin</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Pledge your mutual funds to unlock margin credit up to 80% LTV. Dynamic margin simulator shows real-time projections and risk assessments.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group flex flex-col h-full">
                            <div className="w-14 h-14 bg-[#00458c] rounded-xl flex items-center justify-center mb-6 text-white shadow-inner group-hover:scale-110 transition-transform">
                                <FileText className="h-6 w-6" />
                            </div>
                            <h3 className="text-[#00458c] text-xl font-bold mb-3">Advisory Reports</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Receive actionable insights and personalized recommendations based on market conditions, your portfolio composition, and financial goals.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────────────────────── */}
            <footer className="bg-[#00458c] text-[#ebf2f8] py-16">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-[#ffffff1a] pb-12">

                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-8 w-8 bg-white rounded flex items-center justify-center shrink-0">
                                <OptimizedImage src={logo} alt="WealthMax" className="h-6 w-6 object-cover rounded-sm" />
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">WealthMax</span>
                        </div>
                        <p className="text-sm text-[#ebf2f8]/70 leading-relaxed mb-6">
                            Empowering investors with advanced analytics, margin funding, and automated advisory to maximize wealth creation.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-5">Products</h4>
                        <ul className="space-y-3 text-sm text-[#ebf2f8]/80">
                            <li><a href="#" className="hover:text-white transition-colors">Mutual Funds</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Equity Trading</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Margin Pledging (LAS)</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Goal Planner</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-5">Company</h4>
                        <ul className="space-y-3 text-sm text-[#ebf2f8]/80">
                            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-5">Support</h4>
                        <ul className="space-y-3 text-sm text-[#ebf2f8]/80">
                            <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 text-[11px] text-[#ebf2f8]/50 leading-relaxed text-justify">
                    <p className="mb-3">
                        <strong>Disclaimer:</strong> Investment in securities market are subject to market risks, read all the related documents carefully before investing. Brokerage will not exceed the SEBI prescribed limit. WealthMax Financial Services Ltd. SEBI Registration No: INZ000012345. CDSL: IN-DP-123-2026. Research Analyst SEBI Regn No: INH000012345.
                    </p>
                    <p>
                        This platform acts as an execution and analytical tool. The financial health score and projections are illustrative mathematical models and do not guarantee future performance. Option Wealth margin funding is subject to credit approval and exchange guidelines. For grievances, email grievance@wealthmax.in or visit SCORES (https://scores.gov.in). © {new Date().getFullYear()} WealthMax. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
