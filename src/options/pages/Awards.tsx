import React from 'react';
import { useProfileStore } from '@/store/profile-store';
import { generateItemId } from '@/core/profile';
import type { Award, Certificate } from '@/types/profile';

export default function Awards() {
  const { currentProfile, updateCurrentProfile } = useProfileStore();
  if (!currentProfile) return null;

  const awards = currentProfile.awards;
  const certs = currentProfile.certificates;

  const addAward = () => {
    const item: Award = { id: generateItemId(), name: '', date: '', level: '' };
    updateCurrentProfile((p) => ({ ...p, awards: [...p.awards, item] }));
  };

  const updateAward = (id: string, field: string, value: string) => {
    updateCurrentProfile((p) => ({
      ...p,
      awards: p.awards.map((e) => e.id === id ? { ...e, [field]: value } : e),
    }));
  };

  const removeAward = (id: string) => {
    updateCurrentProfile((p) => ({ ...p, awards: p.awards.filter((e) => e.id !== id) }));
  };

  const addCert = () => {
    const item: Certificate = { id: generateItemId(), name: '', date: '', score: '' };
    updateCurrentProfile((p) => ({ ...p, certificates: [...p.certificates, item] }));
  };

  const updateCert = (id: string, field: string, value: string) => {
    updateCurrentProfile((p) => ({
      ...p,
      certificates: p.certificates.map((e) => e.id === id ? { ...e, [field]: value } : e),
    }));
  };

  const removeCert = (id: string) => {
    updateCurrentProfile((p) => ({ ...p, certificates: p.certificates.filter((e) => e.id !== id) }));
  };

  return (
    <div>
      {/* Awards */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">获奖情况</h2>
        <button onClick={addAward} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
          + 添加奖项
        </button>
      </div>

      {awards.length === 0 && <p className="text-gray-400 text-center py-8">暂无获奖记录</p>}

      <div className="space-y-3 mb-10">
        {awards.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border border-gray-200 rounded-lg p-4">
            <div className="flex-1">
              <input value={item.name} onChange={(e) => updateAward(item.id, 'name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="奖项名称" />
            </div>
            <div className="w-32">
              <input value={item.level} onChange={(e) => updateAward(item.id, 'level', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="级别" />
            </div>
            <div className="w-36">
              <input type="month" value={item.date} onChange={(e) => updateAward(item.id, 'date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
            <button onClick={() => removeAward(item.id)} className="text-gray-400 hover:text-red-500 text-sm">删除</button>
          </div>
        ))}
      </div>

      {/* Certificates */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">证书</h2>
        <button onClick={addCert} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
          + 添加证书
        </button>
      </div>

      {certs.length === 0 && <p className="text-gray-400 text-center py-8">暂无证书记录</p>}

      <div className="space-y-3">
        {certs.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border border-gray-200 rounded-lg p-4">
            <div className="flex-1">
              <input value={item.name} onChange={(e) => updateCert(item.id, 'name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="证书名称，如 CET-6" />
            </div>
            <div className="w-28">
              <input value={item.score} onChange={(e) => updateCert(item.id, 'score', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="分数" />
            </div>
            <div className="w-36">
              <input type="month" value={item.date} onChange={(e) => updateCert(item.id, 'date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
            <button onClick={() => removeCert(item.id)} className="text-gray-400 hover:text-red-500 text-sm">删除</button>
          </div>
        ))}
      </div>
    </div>
  );
}
