import { useState, useEffect } from 'react';
import { Edit, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { Asset, OtherAsset, financialService } from '../../services/financial.service';

const formatINR = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

const AssetsCard = () => {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Asset>({
    bank_balance: 0,
    fixed_deposits: 0,
    mutual_funds: 0,
    bonds: 0,
    provident_fund: 0,
    gold_etfs: 0,
    land_property: 0,
    vehicles: 0,
    gold_physical: 0,
    other_assets: []
  });

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const data = await financialService.getAsset();
      setAsset(data);
      setEditData({
        bank_balance: data.bank_balance || 0,
        fixed_deposits: data.fixed_deposits || 0,
        mutual_funds: data.mutual_funds || 0,
        bonds: data.bonds || 0,
        provident_fund: data.provident_fund || 0,
        gold_etfs: data.gold_etfs || 0,
        land_property: data.land_property || 0,
        vehicles: data.vehicles || 0,
        gold_physical: data.gold_physical || 0,
        other_assets: data.other_assets || []
      });
    } catch (error) {
      console.error('Failed to fetch asset:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, []);

  const handleEdit = () => {
    setEditData({
      bank_balance: asset?.bank_balance || 0,
      fixed_deposits: asset?.fixed_deposits || 0,
      mutual_funds: asset?.mutual_funds || 0,
      bonds: asset?.bonds || 0,
      provident_fund: asset?.provident_fund || 0,
      gold_etfs: asset?.gold_etfs || 0,
      land_property: asset?.land_property || 0,
      vehicles: asset?.vehicles || 0,
      gold_physical: asset?.gold_physical || 0,
      other_assets: asset?.other_assets?.map(a => ({ ...a })) || []
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await financialService.updateAsset(editData);
      await fetchAsset();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save asset:', error);
    } finally {
      setSaving(false);
    }
  };

  const addOtherAsset = () => {
    setEditData(prev => ({
      ...prev,
      other_assets: [
        ...(prev.other_assets || []),
        {
          name: '',
          amount: 0
        }
      ]
    }));
  };

  const removeOtherAsset = (index: number) => {
    setEditData(prev => ({
      ...prev,
      other_assets: (prev.other_assets || []).filter((_, i) => i !== index)
    }));
  };

  const updateOtherAsset = (index: number, field: keyof OtherAsset, value: any) => {
    setEditData(prev => ({
      ...prev,
      other_assets: (prev.other_assets || []).map((a, i) =>
        i === index ? { ...a, [field]: value } : a
      )
    }));
  };

  const calculateTotal = () => {
    let total = editData.bank_balance + editData.fixed_deposits + editData.mutual_funds +
                editData.bonds + editData.provident_fund + editData.gold_etfs +
                editData.land_property + editData.vehicles + editData.gold_physical;
    (editData.other_assets || []).forEach(a => total += a.amount);
    return total;
  };

  const calculateFinancialTotal = () => {
    return editData.bank_balance + editData.fixed_deposits + editData.mutual_funds +
           editData.bonds + editData.provident_fund + editData.gold_etfs;
  };

  const calculatePhysicalTotal = () => {
    return editData.land_property + editData.vehicles + editData.gold_physical;
  };

  const calculateOtherTotal = () => {
    return (editData.other_assets || []).reduce((sum, a) => sum + a.amount, 0);
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
          <h3 className="text-xl font-bold text-[#00458c]">Assets</h3>
          <p className="text-sm text-gray-500">Track your wealth and investments</p>
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
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Assets</div>
            <div className="text-3xl font-bold text-[#00458c]">
              {formatINR(calculateTotal())}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#00458c] uppercase tracking-wider">Financial Assets</h4>
              <div className="space-y-2">
                <div className="flex justify-between py-1"><span className="text-gray-600">Bank Balance</span><span className="font-medium">{formatINR(asset?.bank_balance || 0)}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Fixed Deposits</span><span className="font-medium">{formatINR(asset?.fixed_deposits || 0)}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Mutual Funds</span><span className="font-medium">{formatINR(asset?.mutual_funds || 0)}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Bonds</span><span className="font-medium">{formatINR(asset?.bonds || 0)}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Provident Fund</span><span className="font-medium">{formatINR(asset?.provident_fund || 0)}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Gold ETFs</span><span className="font-medium">{formatINR(asset?.gold_etfs || 0)}</span></div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#00458c] uppercase tracking-wider">Physical Assets</h4>
              <div className="space-y-2">
                <div className="flex justify-between py-1"><span className="text-gray-600">Land/Property</span><span className="font-medium">{formatINR(asset?.land_property || 0)}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Vehicles</span><span className="font-medium">{formatINR(asset?.vehicles || 0)}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Gold (Physical)</span><span className="font-medium">{formatINR(asset?.gold_physical || 0)}</span></div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#00458c] uppercase tracking-wider">Other Assets</h4>
              {(asset?.other_assets || []).length > 0 ? (
                <div className="space-y-2">
                  {(asset?.other_assets || []).map((a, i) => (
                    <div key={i} className="flex justify-between py-1 px-2 bg-gray-50 rounded">
                      <span className="text-gray-600">{a.name}</span>
                      <span className="font-medium">{formatINR(a.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No other assets</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#00458c] uppercase tracking-wider">Financial Assets</h4>
              <div className="space-y-3">
                {['bank_balance', 'fixed_deposits', 'mutual_funds', 'bonds', 'provident_fund', 'gold_etfs'].map(field => (
                  <div key={field}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input
                        type="number"
                        value={(editData as any)[field]}
                        onChange={(e) => setEditData(prev => ({ ...prev, [field]: Number(e.target.value) || 0 }))}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#00458c] uppercase tracking-wider">Physical Assets</h4>
              <div className="space-y-3">
                {['land_property', 'vehicles', 'gold_physical'].map(field => (
                  <div key={field}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input
                        type="number"
                        value={(editData as any)[field]}
                        onChange={(e) => setEditData(prev => ({ ...prev, [field]: Number(e.target.value) || 0 }))}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-[#00458c] uppercase tracking-wider">Other Assets</h4>
                <button
                  onClick={addOtherAsset}
                  className="flex items-center gap-1 text-sm text-[#00458c] hover:text-[#003a75] font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              <div className="space-y-3">
                {(editData.other_assets || []).map((a, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <input
                        type="text"
                        value={a.name}
                        onChange={(e) => updateOtherAsset(index, 'name', e.target.value)}
                        placeholder="Asset name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
                      />
                      <button
                        onClick={() => removeOtherAsset(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input
                        type="number"
                        value={a.amount}
                        onChange={(e) => updateOtherAsset(index, 'amount', Number(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Assets</div>
            <div className="text-3xl font-bold text-[#00458c]">
              {formatINR(calculateTotal())}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsCard;
