import React from 'react';
import { useProfileStore } from '@/store/profile-store';
import { generateItemId } from '@/core/profile';
import type { Skill } from '@/types/profile';

const LEVEL_OPTIONS = ['了解', '熟悉', '熟练', '精通'];

export default function Skills() {
  const { currentProfile, updateCurrentProfile } = useProfileStore();
  if (!currentProfile) return null;

  const items = currentProfile.skills;

  const addItem = () => {
    const newItem: Skill = { id: generateItemId(), name: '', level: '' };
    updateCurrentProfile((p) => ({ ...p, skills: [...p.skills, newItem] }));
  };

  const updateItem = (id: string, field: string, value: string) => {
    updateCurrentProfile((p) => ({
      ...p,
      skills: p.skills.map((e) => e.id === id ? { ...e, [field]: value } : e),
    }));
  };

  const removeItem = (id: string) => {
    updateCurrentProfile((p) => ({
      ...p,
      skills: p.skills.filter((e) => e.id !== id),
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">专业技能</h2>
        <button onClick={addItem} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
          + 添加技能
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-gray-400 text-center py-12">暂无技能，点击上方按钮添加</p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border border-gray-200 rounded-lg p-4">
            <div className="flex-1">
              <input value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="技能名称，如 JavaScript" />
            </div>
            <div className="w-32">
              <select value={item.level} onChange={(e) => updateItem(item.id, 'level', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
                <option value="">程度</option>
                {LEVEL_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 text-sm">删除</button>
          </div>
        ))}
      </div>
    </div>
  );
}
