import React from 'react';
import { useProfileStore } from '@/store/profile-store';

export default function JobIntention() {
  const { currentProfile, updateCurrentProfile } = useProfileStore();
  if (!currentProfile) return null;

  const { jobIntention } = currentProfile;

  const update = (field: string, value: any) => {
    updateCurrentProfile((p) => ({
      ...p,
      jobIntention: { ...p.jobIntention, [field]: value },
    }));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">求职意向</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">期望职位</label>
          <input value={jobIntention.position} onChange={(e) => update('position', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="如：前端开发工程师" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">期望薪资</label>
          <input value={jobIntention.salary} onChange={(e) => update('salary', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="如：15k-25k" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">期望城市（逗号分隔）</label>
          <input value={jobIntention.city.join(', ')} onChange={(e) => update('city', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="如：上海, 北京, 深圳" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">到岗时间</label>
          <input value={jobIntention.entryDate} onChange={(e) => update('entryDate', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="如：随时到岗 / 2024-07" />
        </div>
      </div>
    </div>
  );
}
