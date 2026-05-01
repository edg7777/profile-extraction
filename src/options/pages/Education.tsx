import React from 'react';
import { useProfileStore } from '@/store/profile-store';
import { generateItemId } from '@/core/profile';
import type { Education as EducationType } from '@/types/profile';

const DEGREE_OPTIONS = ['大专', '本科', '硕士', '博士'];

export default function Education() {
  const { currentProfile, updateCurrentProfile } = useProfileStore();
  if (!currentProfile) return null;

  const items = currentProfile.education;

  const addItem = () => {
    const newItem: EducationType = {
      id: generateItemId(),
      school: '', degree: '', major: '',
      startDate: '', endDate: '', gpa: '', rank: '',
    };
    updateCurrentProfile((p) => ({ ...p, education: [...p.education, newItem] }));
  };

  const updateItem = (id: string, field: string, value: string) => {
    updateCurrentProfile((p) => ({
      ...p,
      education: p.education.map((e) => e.id === id ? { ...e, [field]: value } : e),
    }));
  };

  const removeItem = (id: string) => {
    updateCurrentProfile((p) => ({
      ...p,
      education: p.education.filter((e) => e.id !== id),
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">教育经历</h2>
        <button onClick={addItem} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
          + 添加教育经历
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-gray-400 text-center py-12">暂无教育经历，点击上方按钮添加</p>
      )}

      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-5 relative">
            <button
              onClick={() => removeItem(item.id)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm"
            >
              删除
            </button>
            <div className="text-sm text-gray-400 mb-3">#{idx + 1}</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学校名称</label>
                <input value={item.school} onChange={(e) => updateItem(item.id, 'school', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="请输入学校名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学历</label>
                <select value={item.degree} onChange={(e) => updateItem(item.id, 'degree', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
                  <option value="">请选择</option>
                  {DEGREE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">专业</label>
                <input value={item.major} onChange={(e) => updateItem(item.id, 'major', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="请输入专业" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                <input value={item.gpa} onChange={(e) => updateItem(item.id, 'gpa', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="如 3.8/4.0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">入学时间</label>
                <input type="month" value={item.startDate} onChange={(e) => updateItem(item.id, 'startDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">毕业时间</label>
                <input type="month" value={item.endDate} onChange={(e) => updateItem(item.id, 'endDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">排名</label>
                <input value={item.rank} onChange={(e) => updateItem(item.id, 'rank', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="如 前10%" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
