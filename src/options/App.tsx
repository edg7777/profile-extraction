import React, { useEffect, useState } from 'react';
import { useProfileStore } from '@/store/profile-store';
import BasicInfo from './pages/BasicInfo';
import Education from './pages/Education';
import WorkExperience from './pages/WorkExperience';
import Projects from './pages/Projects';
import Awards from './pages/Awards';
import JobIntention from './pages/JobIntention';
import Settings from './pages/Settings';
import ResumeUpload from './pages/ResumeUpload';

const TABS = [
  { key: 'basic', label: '基本信息' },
  { key: 'education', label: '教育经历' },
  { key: 'work', label: '工作/实习经历' },
  { key: 'project', label: '项目经历' },
  { key: 'awards', label: '获奖/证书' },
  { key: 'intention', label: '求职意向' },
  { key: 'upload', label: '简历解析' },
  { key: 'settings', label: '设置' },
];

export default function App() {
  const { init, loading, profiles, currentProfile, activeProfileId, setActiveProfile, createProfile, saveProfile, deleteProfile } = useProfileStore();
  const [activeTab, setActiveTab] = useState('basic');
  const [saveStatus, setSaveStatus] = useState<string>('');

  useEffect(() => {
    init();
  }, []);

  const handleSave = async () => {
    if (!currentProfile) return;
    await saveProfile(currentProfile);
    setSaveStatus('已保存');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AR</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">AutoFill Resume</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Selector */}
            <select
              value={activeProfileId || ''}
              onChange={(e) => setActiveProfile(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <button
              onClick={() => createProfile()}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              + 新建简历
            </button>

            {profiles.length > 1 && (
              <button
                onClick={() => {
                  if (activeProfileId && confirm('确定删除该简历？')) {
                    deleteProfile(activeProfileId);
                  }
                }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                删除
              </button>
            )}

            <button
              onClick={handleSave}
              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              保存
            </button>

            {saveStatus && (
              <span className="text-sm text-green-600 font-medium">{saveStatus}</span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar Tabs */}
        <nav className="w-48 shrink-0">
          <ul className="space-y-1">
            {TABS.map((tab) => (
              <li key={tab.key}>
                <button
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <main className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          {activeTab === 'basic' && <BasicInfo />}
          {activeTab === 'education' && <Education />}
          {activeTab === 'work' && <WorkExperience />}
          {activeTab === 'project' && <Projects />}
          {activeTab === 'awards' && <Awards />}
          {activeTab === 'intention' && <JobIntention />}
          {activeTab === 'upload' && <ResumeUpload />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}
