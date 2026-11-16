import re

with open('frontend/src/pages/FinancialDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Add activeModalSection state
content = content.replace(
    'const [isModalOpen, setIsModalOpen] = useState(false);',
    'const [isModalOpen, setIsModalOpen] = useState(false);\n  const [activeModalSection, setActiveModalSection] = useState<string>(\'all\');'
)

# 2. Modify handleOpenModal
content = content.replace(
    'const handleOpenModal = () => {',
    'const handleOpenModal = (section: string = \'all\') => {\n    setActiveModalSection(section);'
)

# Fix the incorrect profile mapping for income/expenses inside handleOpenModal
content = content.replace(
    'gross_income: formatINR((profile?.modularData?.income?.gross_annual_income || 0).toString()),',
    'gross_income: formatINR((profile?.gross_income || 0).toString()),'
)
content = content.replace(
    'additional_income: formatINR((profile?.modularData?.income?.additional_income || 0).toString()),',
    'additional_income: formatINR((profile?.other_income || 0).toString()),'
)
content = content.replace(
    'monthly_household_expenses: formatINR((profile?.modularData?.expenses?.monthly_household_expenses || 0).toString()),',
    'monthly_household_expenses: formatINR((profile?.fixed_expenses || 0).toString()),'
)
content = content.replace(
    'monthly_obligations: formatINR((profile?.modularData?.expenses?.monthly_obligations || 0).toString()),',
    'monthly_obligations: formatINR((profile?.liabilities_emi || 0).toString()),'
)


# 3. Modify Edit buttons onClick to pass section
# Income
content = content.replace(
    '<h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">\n                        <Wallet className="w-4 h-4" /> Income Summary\n                      </h3>\n                      <Button variant="ghost" size="sm" onClick={handleOpenModal}',
    '<h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">\n                        <Wallet className="w-4 h-4" /> Income Summary\n                      </h3>\n                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(\'income\')}'
)
# Expenses
content = content.replace(
    '<h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">\n                        <Minus className="w-4 h-4" /> Expenses\n                      </h3>\n                      <Button variant="ghost" size="sm" onClick={handleOpenModal}',
    '<h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">\n                        <Minus className="w-4 h-4" /> Expenses\n                      </h3>\n                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(\'expenses\')}'
)
# Assets
content = content.replace(
    '<h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">\n                        <TrendingUp className="w-4 h-4" /> Assets\n                      </h3>\n                      <Button variant="ghost" size="sm" onClick={handleOpenModal}',
    '<h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">\n                        <TrendingUp className="w-4 h-4" /> Assets\n                      </h3>\n                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(\'assets\')}'
)
# Liabilities
content = content.replace(
    '<h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">\n                        <CreditCard className="w-4 h-4" /> Liabilities\n                      </h3>\n                      <Button variant="ghost" size="sm" onClick={handleOpenModal}',
    '<h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">\n                        <CreditCard className="w-4 h-4" /> Liabilities\n                      </h3>\n                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(\'liabilities\')}'
)
# Safety Net
content = content.replace(
    '<h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">\n                        <Shield className="w-4 h-4" /> Safety Net\n                      </h3>\n                      <Button variant="ghost" size="sm" onClick={handleOpenModal}',
    '<h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">\n                        <Shield className="w-4 h-4" /> Safety Net\n                      </h3>\n                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(\'safetynet\')}'
)
# Identity
content = content.replace(
    '<h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2 mb-4">\n                      <Target className="w-4 h-4" /> WealthMax Identity\n                    </h3>\n                    <div className="space-y-3">\n                      <div>\n                        <p className="text-xs text-slate-500 mb-1">Assigned Persona</p>\n                        <div className="flex items-center gap-2">\n                          <p className="text-sm font-bold text-slate-900">{profile?.assigned_persona || "Not Assigned"}</p>\n                          <Button variant="ghost" size="sm" onClick={handleOpenModal}',
    '<h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2 mb-4">\n                      <Target className="w-4 h-4" /> WealthMax Identity\n                    </h3>\n                    <div className="space-y-3">\n                      <div>\n                        <p className="text-xs text-slate-500 mb-1">Assigned Persona</p>\n                        <div className="flex items-center gap-2">\n                          <p className="text-sm font-bold text-slate-900">{profile?.assigned_persona || "Not Assigned"}</p>\n                          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(\'identity\')}'
)

# 4. Modify Modal rendering to wrap sections
# We need to find the sections in the modal HTML.
# The Identity section is the first one after `<div className="p-6 space-y-5 ...">`

def replace_section(content, comment_marker, section_key, start_str, next_marker_str):
    pattern = re.compile(rf'({re.escape(start_str)}.*?)({re.escape(next_marker_str)})', re.DOTALL)
    replacement = rf'{{(activeModalSection === \'all\' || activeModalSection === \'{section_key}\') && (\n                  \1\n                )}}\n                \2'
    return re.sub(pattern, replacement, content, count=1)

# Identity section starts with `<div className="grid grid-cols-2 gap-4">` and ends before `{/* Income */}`
identity_start = '<div className="grid grid-cols-2 gap-4">\n                  <div>\n                    <label className="block text-[#00458c] text-sm font-bold mb-2">Date of Birth</label>'
income_marker = '{/* Income */}'
content = replace_section(content, '', 'identity', identity_start, income_marker)

# Income section
income_start = '<div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">\n                  <div className="flex items-center justify-between mb-3">\n                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Income</p>'
expenses_marker = '{/* Expenses */}'
content = replace_section(content, '', 'income', income_start, expenses_marker)

# Expenses section
expenses_start = '<div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">\n                  <div className="flex items-center justify-between mb-3">\n                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expenses</p>'
assets_marker = '{/* Assets */}'
content = replace_section(content, '', 'expenses', expenses_start, assets_marker)

# Assets section
assets_start = '<div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">\n                  <div className="flex items-center justify-between mb-3">\n                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assets</p>'
liabilities_marker = '{/* Liabilities */}'
content = replace_section(content, '', 'assets', assets_start, liabilities_marker)

# Liabilities section
liabilities_start = '<div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">\n                  <div className="flex items-center justify-between mb-3">\n                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Liabilities</p>'
safetynet_marker = '{/* Safety Net */}'
content = replace_section(content, '', 'liabilities', liabilities_start, safetynet_marker)

# Safety Net section
safetynet_start = '<div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">\n                  <div className="flex items-center justify-between mb-3">\n                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Safety Net</p>'
button_marker = '<div className="pt-6 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end gap-3">'
content = replace_section(content, '', 'safetynet', safetynet_start, button_marker)

# 5. Add normalize functions inside the component
normalize_funcs = """
  const normalizeToAnnual = (amount: number, freq: string) => {
    if (freq === 'Monthly') return amount * 12;
    if (freq === 'Quarterly') return amount * 4;
    if (freq === 'Daily') return amount * 365;
    return amount;
  };
  const normalizeToMonthly = (amount: number, freq: string) => {
    if (freq === 'Annually') return amount / 12;
    if (freq === 'Quarterly') return amount / 3;
    if (freq === 'Daily') return amount * 30;
    return amount;
  };

  useEffect(() => {
    if (!isModalOpen) return;
    
    // Auto-calculate Gross Income
    if (formData.income_details.length > 0) {
      const calculated_gross = formData.income_details.reduce((sum, item) => sum + normalizeToAnnual(Number(parseINR(item.amount)), item.frequency), 0);
      setFormData(prev => ({ ...prev, gross_income: formatINR(calculated_gross.toString()) }));
    }
    
    // Auto-calculate Expenses
    if (formData.expense_details.length > 0) {
      const calculated_expenses = formData.expense_details.reduce((sum, item) => sum + normalizeToMonthly(Number(parseINR(item.amount)), item.frequency), 0);
      setFormData(prev => ({ ...prev, monthly_household_expenses: formatINR(calculated_expenses.toString()) }));
    }

    // Auto-calculate EMI/Obligations
    if (formData.liability_details.length > 0) {
      // Assuming all liabilities input might be EMIs, or just sum them
      const calculated_emi = formData.liability_details.reduce((sum, item) => sum + Number(parseINR(item.amount)), 0);
      setFormData(prev => ({ ...prev, monthly_obligations: formatINR(calculated_emi.toString()) }));
    }
  }, [formData.income_details, formData.expense_details, formData.liability_details, isModalOpen]);
"""

content = content.replace(
    'const removeArrayItem = (field: keyof typeof formData, index: number) => {',
    normalize_funcs + '\n  const removeArrayItem = (field: keyof typeof formData, index: number) => {'
)

# Make inputs readonly visually
content = content.replace(
    '<input type="text" value={formData.gross_income} onChange={(e) => handleChange("gross_income", e.target.value)} className="glass-input w-full h-11 pl-8 pr-4 text-[15px] font-semibold" />',
    '<input type="text" value={formData.gross_income} readOnly className="glass-input w-full h-11 pl-8 pr-4 text-[15px] font-semibold bg-slate-50/50 cursor-not-allowed" />'
)
content = content.replace(
    '<input type="text" value={formData.monthly_household_expenses} onChange={(e) => handleChange("monthly_household_expenses", e.target.value)} className="glass-input w-full h-11 pl-8 pr-4 text-[15px] font-semibold" />',
    '<input type="text" value={formData.monthly_household_expenses} readOnly className="glass-input w-full h-11 pl-8 pr-4 text-[15px] font-semibold bg-slate-50/50 cursor-not-allowed" />'
)
content = content.replace(
    '<input type="text" value={formData.monthly_obligations} onChange={(e) => handleChange("monthly_obligations", e.target.value)} className="glass-input w-full h-11 pl-8 pr-4 text-[15px] font-semibold" />',
    '<input type="text" value={formData.monthly_obligations} readOnly className="glass-input w-full h-11 pl-8 pr-4 text-[15px] font-semibold bg-slate-50/50 cursor-not-allowed" />'
)


with open('frontend/src/pages/FinancialDashboard.tsx', 'w') as f:
    f.write(content)
print('Patched successfully')
