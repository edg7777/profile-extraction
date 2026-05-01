import React from 'react';
import { useProfileStore } from '@/store/profile-store';
import { generateItemId } from '@/core/profile';
import type { ProjectExperience } from '@/types/profile';

export default function Projects() {
  const { currentProfile, updateCurrentProfile } = useProfileStore();
  if (!currentProfile) return null;

  const items = currentProfile.projectExperience;

  const addItem = () => {
    const newItem: ProjectExperience = {
      id: generateItemId(),
      name: '', role: '', startDate: '', endDate: '',
      techStack: '', description: '',
    };
    updateCurrentProfile((p) => ({ ...p, projectExperience: [...p.projectExperience, newItem] }));
  };

  const updateItem = (id: string, field: string, value: string) => {
    updateCurrentProfile((p) => ({
      ...p,
      projectExperience: p.projectExperience.map((e) => e.id === id ? { ...e, [field]: value } : e),
    }));
  };

  const removeItem = (id: string) => {
    updateCurrentProfile((p) => ({
      ...p,
      projectExperience: p.projectExperience.filter((e) => e.id !== id),
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">项目经历</h2>
        <button onClick={addItem} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
          + 添加项目
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-gray-400 text-center py-12">暂无项目经历，点击上方按钮添加</p>
      )}

      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-5 relative">
            <button onClick={() => removeItem(item.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm">删除</button>
            <div className="text-sm text-gray-400 mb-3">#{idx + 1}</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
                <input value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="请输入项目名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">担任角色</label>
                <input value={item.role} onChange={(e) => updateItem(item.id, 'role', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="如：前端负责人" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                <input type="month" value={item.startDate} onChange={(e) => updateItem(item.id, 'startDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                <input type="month" value={item.endDate} onChange={(e) => updateItem(item.id, 'endDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">技术栈</label>
                <input value={item.techStack} onChange={(e) => updateItem(item.id, 'techStack', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="如：React, Node.js, MySQL" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
              <textarea value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 resize-y" placeholder="描述项目内容、你的贡献与成果..." />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
