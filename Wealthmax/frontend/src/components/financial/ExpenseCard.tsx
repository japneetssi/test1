import { useState, useEffect } from 'react';
import { Edit, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { Expense, ExpenseSource, financialService } from '../../services/financial.service';

const formatINR = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

const ExpenseCard = () => {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Expense>({
    base_expenses: 0,
    sources: []
  });

  const fetchExpense = async () => {
    try {
      setLoading(true);
      const data = await financialService.getExpense();
      setExpense(data);
      setEditData({
        base_expenses: data.base_expenses || 0,
        sources: data.sources || []
      });
    } catch (error) {
      console.error('Failed to fetch expense:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpense();
  }, []);

  const handleEdit = () => {
    setEditData({
      base_expenses: expense?.base_expenses || 0,
      sources: expense?.sources?.map(s => ({ ...s })) || []
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await financialService.updateExpense(editData);
      await fetchExpense();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save expense:', error);
    } finally {
      setSaving(false);
    }
  };

  const addSource = () => {
    setEditData(prev => ({
      ...prev,
      sources: [
        ...(prev.sources || []),
        {
          source: '',
          amount: 0,
          frequency: 'Monthly'
        }
      ]
    }));
  };

  const removeSource = (index: number) => {
    setEditData(prev => ({
      ...prev,
      sources: (prev.sources || []).filter((_, i) => i !== index)
    }));
  };

  const updateSource = (index: number, field: keyof ExpenseSource, value: any) => {
    setEditData(prev => ({
      ...prev,
      sources: (prev.sources || []).map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      )
    }));
  };

  const calculateTotal = () => {
    let total = editData.base_expenses || 0;
    (editData.sources || []).forEach(source => {
      let monthlyAmount = source.amount;
      switch (source.frequency) {
        case 'Daily': monthlyAmount *= 30; break;
        case 'Weekly': monthlyAmount *= 4.33; break;
        case 'Quarterly': monthlyAmount /= 3; break;
        case 'Annually': monthlyAmount /= 12; break;
      }
      total += monthlyAmount;
    });
    return total;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#f37920]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#00458c]">Expenses</h3>
          <p className="text-sm text-gray-500">Track your monthly spending</p>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-[#00458c] text-white rounded-lg hover:bg-[#003a75] transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#f37920] text-white rounded-lg hover:bg-[#e06b18] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Monthly Expenses</div>
            <div className="text-3xl font-bold text-[#00458c]">
              {formatINR((expense?.base_expenses || 0) + 
                (expense?.sources || []).reduce((sum, s) => {
                  let monthly = s.amount;
                  switch (s.frequency) {
                    case 'Daily': monthly *= 30; break;
                    case 'Weekly': monthly *= 4.33; break;
                    case 'Quarterly': monthly /= 3; break;
                    case 'Annually': monthly /= 12; break;
                  }
                  return sum + monthly;
                }, 0))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Base Expenses</span>
              <span className="font-semibold text-gray-900">{formatINR(expense?.base_expenses || 0)}</span>
            </div>

            {(expense?.sources || []).length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">Other Expenses</div>
                {(expense?.sources || []).map((source, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{source.source}</div>
                      <div className="text-xs text-gray-500">{source.frequency}</div>
                    </div>
                    <span className="font-semibold text-gray-700">{formatINR(source.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Base Expenses (Monthly)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                value={editData.base_expenses}
                onChange={(e) => setEditData(prev => ({ ...prev, base_expenses: Number(e.target.value) || 0 }))}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-gray-700">Other Expenses</label>
              <button
                onClick={addSource}
                className="flex items-center gap-1 text-sm text-[#00458c] hover:text-[#003a75] font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </button>
            </div>

            <div className="space-y-3">
              {(editData.sources || []).map((source, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-start bg-gray-50 p-3 rounded-lg">
                  <div className="col-span-4">
                    <label className="block text-xs text-gray-500 mb-1">Source</label>
                    <input
                      type="text"
                      value={source.source}
                      onChange={(e) => updateSource(index, 'source', e.target.value)}
                      placeholder="e.g., Groceries"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input
                        type="number"
                        value={source.amount}
                        onChange={(e) => updateSource(index, 'amount', Number(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                    <select
                      value={source.frequency}
                      onChange={(e) => updateSource(index, 'frequency', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annually">Annually</option>
                    </select>
                  </div>
                  <div className="col-span-2 pt-5">
                    <button
                      onClick={() => removeSource(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mt-6">
            <div className="text-sm text-gray-600 mb-1">Total Monthly Expenses</div>
            <div className="text-3xl font-bold text-[#00458c]">
              {formatINR(calculateTotal())}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCard;
