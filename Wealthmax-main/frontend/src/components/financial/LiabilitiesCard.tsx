import { useState, useEffect } from 'react';
import { Edit, Save, Loader2 } from 'lucide-react';
import { Liability, financialService } from '../../services/financial.service';

const formatINR = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

const LiabilitiesCard = () => {
  const [liability, setLiability] = useState<Liability | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Liability>({
    home_loan: 0,
    personal_loan: 0,
    car_loan: 0,
    credit_card_loan: 0,
    business_loan: 0,
    other_liabilities: 0
  });

  const fetchLiability = async () => {
    try {
      setLoading(true);
      const data = await financialService.getLiability();
      setLiability(data);
      setEditData({
        home_loan: data.home_loan || 0,
        personal_loan: data.personal_loan || 0,
        car_loan: data.car_loan || 0,
        credit_card_loan: data.credit_card_loan || 0,
        business_loan: data.business_loan || 0,
        other_liabilities: data.other_liabilities || 0
      });
    } catch (error) {
      console.error('Failed to fetch liability:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiability();
  }, []);

  const handleEdit = () => {
    setEditData({
      home_loan: liability?.home_loan || 0,
      personal_loan: liability?.personal_loan || 0,
      car_loan: liability?.car_loan || 0,
      credit_card_loan: liability?.credit_card_loan || 0,
      business_loan: liability?.business_loan || 0,
      other_liabilities: liability?.other_liabilities || 0
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await financialService.updateLiability(editData);
      await fetchLiability();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save liability:', error);
    } finally {
      setSaving(false);
    }
  };

  const calculateTotal = () => {
    return editData.home_loan + editData.personal_loan + editData.car_loan +
           editData.credit_card_loan + editData.business_loan + editData.other_liabilities;
  };

  const fields = [
    { key: 'home_loan', label: 'Home Loan' },
    { key: 'personal_loan', label: 'Personal Loan' },
    { key: 'car_loan', label: 'Car Loan' },
    { key: 'credit_card_loan', label: 'Credit Card Loan' },
    { key: 'business_loan', label: 'Business Loan' },
    { key: 'other_liabilities', label: 'Other Liabilities' }
  ];

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
          <h3 className="text-xl font-bold text-[#00458c]">Liabilities</h3>
          <p className="text-sm text-gray-500">Track your outstanding debts</p>
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
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Liabilities</div>
            <div className="text-3xl font-bold text-[#00458c]">
              {formatINR(calculateTotal())}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">{label}</span>
                <span className="font-semibold text-gray-900">{formatINR((liability as any)[key] || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    value={(editData as any)[key]}
                    onChange={(e) => setEditData(prev => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mt-6">
            <div className="text-sm text-gray-600 mb-1">Total Liabilities</div>
            <div className="text-3xl font-bold text-[#00458c]">
              {formatINR(calculateTotal())}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiabilitiesCard;
