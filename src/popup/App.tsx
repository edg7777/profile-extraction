import React, { useEffect, useState } from 'react';
import { useProfileStore } from '@/store/profile-store';
import type { FillResult } from '@/types/form';

export default function App() {
  const { init, loading, profiles, currentProfile, activeProfileId, setActiveProfile } = useProfileStore();
  const [fillResult, setFillResult] = useState<FillResult | null>(null);
  const [filling, setFilling] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    init();
  }, []);

  const handleFill = async () => {
    if (!currentProfile) return;
    setFilling(true);
    setStatus('正在填充...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setStatus('无法获取当前标签页');
        setFilling(false);
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'FILL_FORM',
        data: { profile: currentProfile },
      });

      if (response?.success) {
        setFillResult(response.data);
        setStatus(`填充完成：${response.data.filled}/${response.data.total} 个字段`);
      } else {
        setStatus(response?.error || '填充失败，请确保页面已加载');
      }
    } catch (err) {
      setStatus('填充失败：页面可能未加载完成或不支持');
    }

    setFilling(false);
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
        <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">AR</span>
        </div>
        <h1 className="text-base font-bold text-gray-900">AutoFill Resume</h1>
      </div>

      {/* Profile Selector */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">当前简历</label>
        <select
          value={activeProfileId || ''}
          onChange={(e) => setActiveProfile(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Profile Summary */}
      {currentProfile && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
          <div className="grid grid-cols-2 gap-1 text-gray-600">
            <div><span className="text-gray-400">姓名：</span>{currentProfile.basic.name || '未填写'}</div>
            <div><span className="text-gray-400">电话：</span>{currentProfile.basic.phone || '未填写'}</div>
            <div><span className="text-gray-400">邮箱：</span>{currentProfile.basic.email || '未填写'}</div>
            <div><span className="text-gray-400">学历：</span>{currentProfile.education[0]?.degree || '未填写'}</div>
          </div>
        </div>
      )}

      {/* Fill Button */}
      <button
        onClick={handleFill}
        disabled={filling || !currentProfile}
        className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium mb-3"
      >
        {filling ? '填充中...' : '一键填充当前页面'}
      </button>

      {/* Status */}
      {status && (
        <div className={`text-xs p-2 rounded-lg mb-3 ${
          status.includes('完成') ? 'bg-green-50 text-green-700' :
          status.includes('失败') ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {status}
        </div>
      )}

      {/* Fill Result Details */}
      {fillResult && (
        <div className="text-xs space-y-1 mb-3 max-h-40 overflow-y-auto">
          {fillResult.details.map((d, i) => (
            <div key={i} className={`flex items-center gap-1 ${
              d.status === 'filled' ? 'text-green-600' :
              d.status === 'needs_confirm' ? 'text-orange-600' :
              d.status === 'skipped' ? 'text-gray-400' :
              'text-red-600'
            }`}>
              <span>{d.status === 'filled' ? '✓' : d.status === 'needs_confirm' ? '?' : d.status === 'skipped' ? '-' : '✗'}</span>
              <span>{d.label}</span>
              {d.message && <span className="text-gray-400 ml-auto">{d.message}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <button
        onClick={openOptions}
        className="w-full py-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        管理简历数据 →
      </button>
    </div>
  );
}
