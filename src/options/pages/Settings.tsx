import React, { useState, useEffect } from 'react';
import { useProfileStore } from '@/store/profile-store';
import { getLlmConfig, saveLlmConfig } from '@/utils/storage';
import type { LlmConfig } from '@/utils/storage';

export default function Settings() {
  const { currentProfile, saveProfile } = useProfileStore();
  const [importStatus, setImportStatus] = useState('');
  const [llmConfig, setLlmConfig] = useState<LlmConfig>({
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    model: 'gpt-4o-mini',
    enabled: false,
  });
  const [llmSaveStatus, setLlmSaveStatus] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    getLlmConfig().then(setLlmConfig);
  }, []);

  const handleSaveLlmConfig = async () => {
    try {
      await saveLlmConfig(llmConfig);
      setLlmSaveStatus('保存成功');
      setTimeout(() => setLlmSaveStatus(''), 2000);
    } catch {
      setLlmSaveStatus('保存失败');
    }
  };

  const handleTestLlm = async () => {
    setLlmSaveStatus('正在测试连接...');
    try {
      const res = await fetch(llmConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: llmConfig.model,
          messages: [{ role: 'user', content: '请回复 ok' }],
          max_tokens: 10,
        }),
      });
      if (res.ok) {
        setLlmSaveStatus('✅ 连接成功！');
      } else {
        const errText = await res.text();
        setLlmSaveStatus(`❌ 连接失败 (${res.status}): ${errText.substring(0, 100)}`);
      }
    } catch (err) {
      setLlmSaveStatus(`❌ 连接失败: ${String(err)}`);
    }
    setTimeout(() => setLlmSaveStatus(''), 5000);
  };

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

        {/* LLM Config */}
        <div className="border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-md font-medium text-gray-900">AI 智能解析配置</h3>
              <p className="text-sm text-gray-500 mt-1">配置 LLM API 以启用 SmartResume 风格的高精度简历解析</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={llmConfig.enabled}
                onChange={(e) => setLlmConfig({ ...llmConfig, enabled: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded" />
              <span className="text-sm text-gray-700">启用</span>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">API 地址</label>
              <input type="text" value={llmConfig.apiEndpoint}
                onChange={(e) => setLlmConfig({ ...llmConfig, apiEndpoint: e.target.value })}
                placeholder="https://api.openai.com/v1/chat/completions"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <p className="text-xs text-gray-400 mt-1">支持 OpenAI 兼容接口（如 OpenAI、DeepSeek、本地 Ollama 等）</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">API Key</label>
              <div className="flex gap-2">
                <input type={showApiKey ? 'text' : 'password'} value={llmConfig.apiKey}
                  onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <button onClick={() => setShowApiKey(!showApiKey)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  {showApiKey ? '隐藏' : '显示'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">密钥仅存储在本地浏览器中，不会发送到除 API 地址以外的任何服务器</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">模型名称</label>
              <input type="text" value={llmConfig.model}
                onChange={(e) => setLlmConfig({ ...llmConfig, model: e.target.value })}
                placeholder="gpt-4o-mini"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <p className="text-xs text-gray-400 mt-1">推荐：gpt-4o-mini、gpt-4o、deepseek-chat 等</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveLlmConfig}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                保存配置
              </button>
              <button onClick={handleTestLlm}
                disabled={!llmConfig.apiKey || !llmConfig.apiEndpoint}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                测试连接
              </button>
              {llmSaveStatus && (
                <span className={`self-center text-sm ${llmSaveStatus.includes('成功') ? 'text-green-600' : llmSaveStatus.includes('失败') ? 'text-red-600' : 'text-gray-500'}`}>
                  {llmSaveStatus}
                </span>
              )}
            </div>
          </div>
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
