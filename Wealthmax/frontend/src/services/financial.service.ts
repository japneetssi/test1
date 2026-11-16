import api from '../lib/api';

// ============================================================
// TYPES
// ============================================================

export interface IncomeSource {
  id?: string;
  source: string;
  amount: number;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';
}

export interface Income {
  id?: string;
  user_id?: string;
  base_income: number;
  sources?: IncomeSource[];
  created_at?: Date;
  updated_at?: Date;
}

export interface ExpenseSource {
  id?: string;
  source: string;
  amount: number;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';
}

export interface Expense {
  id?: string;
  user_id?: string;
  base_expenses: number;
  sources?: ExpenseSource[];
  created_at?: Date;
  updated_at?: Date;
}

export interface OtherAsset {
  id?: string;
  name: string;
  amount: number;
}

export interface Asset {
  id?: string;
  user_id?: string;
  bank_balance: number;
  fixed_deposits: number;
  mutual_funds: number;
  bonds: number;
  provident_fund: number;
  gold_etfs: number;
  land_property: number;
  vehicles: number;
  gold_physical: number;
  other_assets?: OtherAsset[];
  created_at?: Date;
  updated_at?: Date;
}

export interface Liability {
  id?: string;
  user_id?: string;
  home_loan: number;
  personal_loan: number;
  car_loan: number;
  credit_card_loan: number;
  business_loan: number;
  other_liabilities: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Dependent {
  id?: string;
  safety_net_id?: string;
  name: string;
  age: number;
  income: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface SafetyNet {
  id?: string;
  user_id?: string;
  emergency_fund: number;
  life_insurance: number;
  health_insurance: number;
  general_insurance: number;
  dependents?: Dependent[];
  created_at?: Date;
  updated_at?: Date;
}

export interface AllFinancialData {
  income: Income;
  expense: Expense;
  asset: Asset;
  liability: Liability;
  safetyNet: SafetyNet;
}

// ============================================================
// API FUNCTIONS
// ============================================================

export const financialService = {
  // INCOME
  getIncome: async (): Promise<Income> => {
    const response = await api.get('/financial/income');
    return response.data.data;
  },
  
  updateIncome: async (income: Partial<Income>): Promise<Income> => {
    const response = await api.post('/financial/income', income);
    return response.data.data;
  },

  // EXPENSE
  getExpense: async (): Promise<Expense> => {
    const response = await api.get('/financial/expense');
    return response.data.data;
  },
  
  updateExpense: async (expense: Partial<Expense>): Promise<Expense> => {
    const response = await api.post('/financial/expense', expense);
    return response.data.data;
  },

  // ASSET
  getAsset: async (): Promise<Asset> => {
    const response = await api.get('/financial/asset');
    return response.data.data;
  },
  
  updateAsset: async (asset: Partial<Asset>): Promise<Asset> => {
    const response = await api.post('/financial/asset', asset);
    return response.data.data;
  },

  // LIABILITY
  getLiability: async (): Promise<Liability> => {
    const response = await api.get('/financial/liability');
    return response.data.data;
  },
  
  updateLiability: async (liability: Partial<Liability>): Promise<Liability> => {
    const response = await api.post('/financial/liability', liability);
    return response.data.data;
  },

  // SAFETY NET
  getSafetyNet: async (): Promise<SafetyNet> => {
    const response = await api.get('/financial/safety-net');
    return response.data.data;
  },
  
  updateSafetyNet: async (safetyNet: Partial<SafetyNet>): Promise<SafetyNet> => {
    const response = await api.post('/financial/safety-net', safetyNet);
    return response.data.data;
  },

  // ALL DATA
  getAllFinancialData: async (): Promise<AllFinancialData> => {
    const response = await api.get('/financial/all');
    return response.data.data;
  }
};

export default financialService;
