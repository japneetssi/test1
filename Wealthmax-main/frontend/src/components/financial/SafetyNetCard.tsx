import { useState, useEffect } from 'react';
import { Edit, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { SafetyNet, Dependent, financialService } from '../../services/financial.service';

const formatINR = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

const SafetyNetCard = () => {
  const [safetyNet, setSafetyNet] = useState<SafetyNet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<SafetyNet>({
    emergency_fund: 0,
    life_insurance: 0,
    health_insurance: 0,
    general_insurance: 0,
    dependents: []
  });

  const fetchSafetyNet = async () => {
    try {
      setLoading(true);
      const data = await financialService.getSafetyNet();
      setSafetyNet(data);
      setEditData({
        emergency_fund: data.emergency_fund || 0,
        life_insurance: data.life_insurance || 0,
        health_insurance: data.health_insurance || 0,
        general_insurance: data.general_insurance || 0,
        dependents: data.dependents || []
      });
    } catch (error) {
      console.error('Failed to fetch safety net:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafetyNet();
  }, []);

  const handleEdit = () => {
    setEditData({
      emergency_fund: safetyNet?.emergency_fund || 0,
      life_insurance: safetyNet?.life_insurance || 0,
      health_insurance: safetyNet?.health_insurance || 0,
      general_insurance: safetyNet?.general_insurance || 0,
      dependents: safetyNet?.dependents || []
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await financialService.updateSafetyNet(editData);
      await fetchSafetyNet();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save safety net:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDependent = () => {
    setEditData(prev => ({
      ...prev,
      dependents: [...(prev.dependents || []), { name: '', age: 0, income: 0 }]
    }));
  };

  const handleRemoveDependent = (index: number) => {
    setEditData(prev => ({
      ...prev,
      dependents: (prev.dependents || []).filter((_, i) => i !== index)
    }));
  };

  const handleDependentChange = (index: number, field: keyof Dependent, value: any) => {
    setEditData(prev => {
      const newDependents = [...(prev.dependents || [])];
      newDependents[index] = { ...newDependents[index], [field]: value };
      return { ...prev, dependents: newDependents };
    });
  };

  const calculateTotal = () => {
    return editData.emergency_fund + editData.life_insurance + 
           editData.health_insurance + editData.general_insurance;
  };

  const fields = [
    { key: 'emergency_fund', label: 'Emergency Fund', color: 'from-blue-50 to-cyan-50' },
    { key: 'life_insurance', label: 'Life/Term Insurance', color: 'from-green-50 to-emerald-50' },
    { key: 'health_insurance', label: 'Health Insurance', color: 'from-purple-50 to-pink-50' },
    { key: 'general_insurance', label: 'General Insurance', color: 'from-orange-50 to-amber-50' }
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
          <h3 className="text-xl font-bold text-[#00458c]">Safety Net</h3>
          <p className="text-sm text-gray-500">Your financial protection</p>
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
          <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Protection</div>
            <div className="text-3xl font-bold text-[#00458c]">
              {formatINR(calculateTotal())}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(({ key, label, color }) => (
              <div key={key} className={`bg-gradient-to-r ${color} rounded-lg p-4`}>
                <div className="text-sm text-gray-600 mb-1">{label}</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatINR((safetyNet as any)[key] || 0)}
                </div>
              </div>
            ))}
          </div>

          {safetyNet?.dependents && safetyNet.dependents.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Dependents</h4>
              <div className="space-y-3">
                {safetyNet.dependents.map((dep, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center border border-gray-100">
                    <div>
                      <div className="font-semibold text-gray-900">{dep.name}</div>
                      <div className="text-sm text-gray-500">Age: {dep.age}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Income</div>
                      <div className="font-semibold text-gray-900">{formatINR(dep.income)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(({ key, label, color }) => (
              <div key={key} className={`bg-gradient-to-r ${color} rounded-lg p-4`}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    value={(editData as any)[key]}
                    onChange={(e) => setEditData(prev => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-800">Dependents</h4>
              <button
                onClick={handleAddDependent}
                className="flex items-center gap-1 text-sm text-[#00458c] font-medium hover:text-[#003a75] transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Dependent
              </button>
            </div>
            
            <div className="space-y-4">
              {(editData.dependents || []).map((dep, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
                  <button
                    onClick={() => handleRemoveDependent(idx)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-8">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={dep.name}
                        onChange={(e) => handleDependentChange(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
                        placeholder="Dependent Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                      <input
                        type="number"
                        value={dep.age || ''}
                        onChange={(e) => handleDependentChange(idx, 'age', Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
                        placeholder="Age"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Income</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                        <input
                          type="number"
                          value={dep.income || ''}
                          onChange={(e) => handleDependentChange(idx, 'income', Number(e.target.value) || 0)}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#00458c] focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!editData.dependents || editData.dependents.length === 0) && (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm">
                  No dependents added. Click "Add Dependent" to include family members.
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-lg p-4 mt-6">
            <div className="text-sm text-gray-600 mb-1">Total Protection</div>
            <div className="text-3xl font-bold text-[#00458c]">
              {formatINR(calculateTotal())}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyNetCard;
