import React, { useState } from 'react';
import { useProfileStore } from '@/store/profile-store';

export default function Settings() {
  const { currentProfile, saveProfile } = useProfileStore();
  const [importStatus, setImportStatus] = useState('');

  const handleExport = () => {
    if (!currentProfile) return;
    const json = JSON.stringify(currentProfile, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-${currentProfile.name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.basic || !data.id) {
          setImportStatus('JSON 格式不正确，缺少必要字段');
          return;
        }
        data.id = crypto.randomUUID();
        data.createdAt = Date.now();
        data.updatedAt = Date.now();
        await saveProfile(data);
        setImportStatus('导入成功！');
      } catch {
        setImportStatus('解析 JSON 失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">设置</h2>

      <div className="space-y-8">
        {/* Export */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="text-md font-medium text-gray-900 mb-2">导出简历数据</h3>
          <p className="text-sm text-gray-500 mb-4">将当前简历导出为 JSON 文件，方便备份或迁移</p>
          <button onClick={handleExport}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
            导出 JSON
          </button>
        </div>

        {/* Import */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="text-md font-medium text-gray-900 mb-2">导入简历数据</h3>
          <p className="text-sm text-gray-500 mb-4">从 JSON 文件导入简历数据，将创建一份新的简历</p>
          <input type="file" accept=".json" onChange={handleImport}
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
          {importStatus && (
            <p className={`mt-2 text-sm ${importStatus.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
              {importStatus}
            </p>
          )}
        </div>

        {/* About */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="text-md font-medium text-gray-900 mb-2">关于</h3>
          <p className="text-sm text-gray-500">AutoFill Resume v1.0.0</p>
          <p className="text-sm text-gray-500">一键填充招聘网站简历表单，告别重复劳动</p>
          <p className="text-sm text-gray-400 mt-2">所有数据均存储在本地浏览器中，不会上传至任何服务器。</p>
        </div>
      </div>
    </div>
  );
}
