import { User } from '../models/user.model';
import { FinancialProfile } from '../models/profile.model';

export class ReportDataService {
    static prepareComprehensiveData(user: User | null, profile: FinancialProfile | null, snapshot: any) {
        const monthly_income = Number(profile?.gross_income || 0) / 12;
        const other_income = Number((profile as any)?.other_income || 0); // No /12 as it's already monthly
        const total_inflow = monthly_income + other_income;
        const household_expenses = Number((profile as any)?.household_expenses || 0);
        const emi_loans = Number(profile?.liabilities_emi || 0);
        const surplus = total_inflow - household_expenses - emi_loans;
        
        const asset_details = (profile as any)?.asset_details || [];

        const bank_balance = Number((profile as any)?.bank_balance || 0);
        const fixed_deposits = Number((profile as any)?.fixed_deposits || 0) || asset_details.filter((a: any) => ['fd', 'fixed deposit'].includes(a.type?.toLowerCase())).reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);
        
        // Manual MF entry vs CAS Snapshot
        const manual_mf_from_assets = asset_details.filter((a: any) => ['mf', 'mf lumsum', 'mutual funds'].includes(a.type?.toLowerCase())).reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);
        const snapshot_mf = Number(snapshot.summary.totalValue || 0);
        const mutual_funds = manual_mf_from_assets > 0 ? manual_mf_from_assets : snapshot_mf;

        const equity_from_assets = asset_details.filter((a: any) => ['equity'].includes(a.type?.toLowerCase())).reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);
        const trading_capital = Number((profile as any)?.trading_capital || 0) + equity_from_assets;

        const aifs_pms = asset_details.filter((a: any) => ['aif\'s', 'pms'].includes(a.type?.toLowerCase())).reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);

        const gold = Number((profile as any)?.gold_assets || 0);
        const real_estate = Number((profile as any)?.real_estate_assets || 0) || asset_details.filter((a: any) => ['real estate', 'property'].includes(a.type?.toLowerCase())).reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);
        
        const total_assets = bank_balance + fixed_deposits + mutual_funds + trading_capital + gold + real_estate + aifs_pms;
        const liability_details = (profile as any)?.liability_details || [];
        const home_loan = liability_details.filter((l: any) => ['home loan'].includes(l.type?.toLowerCase())).reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0) || Number((profile as any)?.home_loan || 0);
        const personal_loan = liability_details.filter((l: any) => ['personal loan'].includes(l.type?.toLowerCase())).reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0) || Number((profile as any)?.personal_loan || 0);
        const other_liabilities = liability_details.filter((l: any) => !['home loan', 'personal loan'].includes(l.type?.toLowerCase())).reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0);
        const total_liabilities = home_loan + personal_loan + other_liabilities;

        // Dynamic Target Allocation based on Risk Class
        const risk_class = user?.risk_class || 'Moderate';
        let target_allocation = [
            { "asset_class": "Equity Mutual Funds", "percentage": 35 },
            { "asset_class": "Direct Equity", "percentage": 20 },
            { "asset_class": "Debt / Fixed", "percentage": 20 },
            { "asset_class": "Gold", "percentage": 10 },
            { "asset_class": "Real Estate", "percentage": 10 },
            { "asset_class": "Cash / Liquid", "percentage": 5 }
        ];

        if (risk_class === 'Aggressive') {
            target_allocation = [
                { "asset_class": "Equity Mutual Funds", "percentage": 50 },
                { "asset_class": "Direct Equity", "percentage": 25 },
                { "asset_class": "Debt / Fixed", "percentage": 10 },
                { "asset_class": "Gold", "percentage": 5 },
                { "asset_class": "Real Estate", "percentage": 5 },
                { "asset_class": "Cash / Liquid", "percentage": 5 }
            ];
        } else if (risk_class === 'Conservative') {
            target_allocation = [
                { "asset_class": "Equity Mutual Funds", "percentage": 15 },
                { "asset_class": "Direct Equity", "percentage": 5 },
                { "asset_class": "Debt / Fixed", "percentage": 50 },
                { "asset_class": "Gold", "percentage": 15 },
                { "asset_class": "Real Estate", "percentage": 5 },
                { "asset_class": "Cash / Liquid", "percentage": 10 }
            ];
        }

        const filteredGoals = snapshot.goals?.filter((g: any) => Number(g.target_amount) > 0) || [];

        // Goal Calculations (Inflation Adjusted)
        const educationGoal = filteredGoals.find((g: any) => g.name.toLowerCase().includes('education'));
        const edu_current_cost = Number(educationGoal?.target_amount || 0);
        const edu_years = educationGoal?.target_date ? (new Date(educationGoal.target_date).getFullYear() - new Date().getFullYear()) : 10;
        const edu_inflation = 0.08; // 8% as per sample
        const edu_future_cost = edu_current_cost * Math.pow(1 + edu_inflation, Math.max(1, edu_years));

        const retirementGoal = filteredGoals.find((g: any) => g.name.toLowerCase().includes('retirement'));
        const ret_years = retirementGoal?.target_date ? (new Date(retirementGoal.target_date).getFullYear() - new Date().getFullYear()) : (user?.dob ? 60 - (new Date().getFullYear() - new Date(user.dob).getFullYear()) : 15);

        return {
            white_label_meta: {
                advisor_name: (profile as any)?.advisor_name || 'Next Curve Financial Services',
                advisor_logo_url: (profile as any)?.advisor_logo_url || '/placeholder-logo.png',
                report_date: new Date().toISOString().split('T')[0]
            },
            client_profile: {
                name: user?.full_name || 'Client',
                age: user?.dob ? new Date().getFullYear() - new Date(user.dob).getFullYear() : 0,
                occupation: (user as any)?.occupation || '',
                marital_status: (user as any)?.marital_status || '',
                risk_profile: risk_class,
                primary_goals: filteredGoals.map((g: any) => g.name)
            },
            cashflow_summary: {
                monthly_income,
                other_income,
                total_income: total_inflow,
                household_expenses,
                emi_loans,
                investments: Math.max(0, surplus), // Assume surplus is invested
                surplus,
                savings_rate_percentage: total_inflow > 0 ? Number(((surplus / total_inflow) * 100).toFixed(1)) : 0
            },
            net_worth: {
                assets: {
                    bank_balance,
                    fixed_deposits,
                    mutual_funds,
                    trading_capital,
                    gold,
                    real_estate,
                    aifs_pms
                },
                total_assets,
                liabilities: {
                    home_loan,
                    personal_loan,
                    other_liabilities
                },
                total_liabilities,
                total_net_worth: total_assets - total_liabilities
            },
            protection_planning: {
                emergency_fund: {
                    monthly_expense: household_expenses,
                    actual_fund: Number(profile?.emergency_fund_amount || 0),
                    required_fund: household_expenses * 6,
                    status: (Number(profile?.emergency_fund_amount) || 0) >= household_expenses * 6 ? 'Adequate' : 'Underfunded'
                },
                insurance: {
                    annual_income: Number(profile?.gross_income) || 0,
                    actual_life_cover: Number(profile?.insurance_cover || 0),
                    required_life_cover: (Number(profile?.gross_income) || 0) * 10,
                    actual_health_cover: Number(profile?.health_insurance_cover || 0),
                    recommended_health_cover: 1000000 // 10 Lakhs standard recommendation
                }
            },
            target_allocation,
            goals: {
                list: filteredGoals.map((g: any) => {
                    const years_away = g.target_date ? (new Date(g.target_date).getFullYear() - new Date().getFullYear()) : 10;
                    const current_cost = Number(g.target_amount || 0);
                    const future_cost = current_cost * Math.pow(1 + 0.08, Math.max(1, years_away));
                    
                    let suggested_investments = ["SIP in Index Funds"];
                    if (g.name.toLowerCase().includes('retirement')) {
                        suggested_investments = ["SIP in Equity Mutual Funds", "NPS Contribution", "Hybrid Funds"];
                    } else if (years_away > 5) {
                        suggested_investments = ["SIP in Equity Mutual Funds", "Index Funds"];
                    } else if (years_away >= 3) {
                        suggested_investments = ["Balanced Advantage Funds", "Short-term Debt Funds"];
                    } else {
                        suggested_investments = ["Liquid Funds", "Fixed Deposits", "Arbitrage Funds"];
                    }

                    return {
                        name: g.name,
                        years_away,
                        target_corpus: future_cost,
                        current_cost,
                        suggested_investments
                    };
                }),
                retirement: {
                    years_remaining: ret_years,
                    target_corpus: Number(retirementGoal?.target_amount || 0),
                    suggested_investments: ["SIP in Equity Mutual Funds", "NPS Contribution", "Hybrid Funds"]
                },
                education: {
                    current_cost: edu_current_cost,
                    years_away: edu_years,
                    inflated_future_cost: edu_future_cost,
                    suggested_investments: ["SIP in Index Funds", "Hybrid Funds"]
                }
            },
            trading_strategy: {
                is_active_trader: (profile as any)?.is_active_trader || false,
                max_capital_allocation_percent: Number((profile as any)?.trading_capital_allocation_percent) || 0,
                recommended_strategies: (profile as any)?.trading_strategies || []
            },
            tax_planning: {
                deductions: [
                    { section: "80C", limit: 150000, items: ["ELSS", "PPF", "Insurance"] },
                    { section: "80CCD(1B)", limit: 50000, items: ["NPS"] },
                    { section: "80D", limit: 25000, items: ["Health Insurance"] }
                ]
            },
            portfolio_analytics: {
                amc_exposure: snapshot.amcExposure || [],
                overlap_analysis: snapshot.overlapAnalysis || {},
                behavior_metrics: {
                    churn_rate: snapshot.behaviorAnalysis?.churnRate || 0,
                    concentration: snapshot.behaviorAnalysis?.concentration || 0,
                    avg_holding_period: snapshot.behaviorAnalysis?.holdingPeriod || 0
                }
            }
        };
    }
}
