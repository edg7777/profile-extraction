import React, { useState, useRef, useEffect } from 'react';
import { useProfileStore } from '@/store/profile-store';
import { parsePdfFile } from '@/core/parser/pdf-parser';
import { extractProfileFromText } from '@/core/parser/resume-extractor';
import { extractProfileWithLlm } from '@/core/parser/llm-extractor';
import { getLlmConfig } from '@/utils/storage';
import type { LlmConfig } from '@/utils/storage';
import type { Profile } from '@/types/profile';

type ParseStatus = 'idle' | 'reading' | 'extracting' | 'preview' | 'done' | 'error';

export default function ResumeUpload() {
  const { saveProfile, setActiveProfile, loadProfiles } = useProfileStore();
  const [status, setStatus] = useState<ParseStatus>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [parsedProfile, setParsedProfile] = useState<Profile | null>(null);
  const [rawText, setRawText] = useState('');
  const [llmConfig, setLlmConfigState] = useState<LlmConfig | null>(null);
  const [parseMode, setParseMode] = useState<'auto' | 'llm' | 'regex'>('auto');
  const [usedMode, setUsedMode] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getLlmConfig().then(setLlmConfigState);
  }, []);

  const isLlmAvailable = llmConfig?.enabled && llmConfig?.apiKey;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setStatus('error');
      setStatusMsg('目前仅支持 PDF 格式的简历文件');
      return;
    }

    try {
      setStatus('reading');
      setStatusMsg('正在读取 PDF 文件...');

      const result = await parsePdfFile(file);
      setRawText(result.fullText);

      const profileName = file.name.replace(/\.pdf$/i, '');
      const shouldUseLlm = parseMode === 'llm' || (parseMode === 'auto' && isLlmAvailable);

      if (shouldUseLlm && llmConfig) {
        setStatus('extracting');
        setStatusMsg('正在通过 AI 智能解析简历...');

        const profile = await extractProfileWithLlm(
          result.fullText,
          llmConfig,
          profileName,
          (progress) => {
            setStatusMsg(`AI 解析中 (${progress.current}/${progress.total}): ${progress.step}`);
          },
        );
        setParsedProfile(profile);
        setUsedMode('AI 智能解析（SmartResume 模式）');
      } else {
        setStatus('extracting');
        setStatusMsg('正在通过规则引擎解析简历...');

        const profile = extractProfileFromText(result.lines, profileName);
        setParsedProfile(profile);
        setUsedMode('规则引擎解析');
      }

      setStatus('preview');
      setStatusMsg('解析完成，请检查以下提取结果：');
    } catch (err) {
      setStatus('error');
      setStatusMsg('解析失败：' + String(err));
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedProfile) return;
    try {
      await saveProfile(parsedProfile);
      await setActiveProfile(parsedProfile.id);
      await loadProfiles();
      setStatus('done');
      setStatusMsg('导入成功！已切换到新导入的简历。');
    } catch (err) {
      setStatus('error');
      setStatusMsg('保存失败：' + String(err));
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setStatusMsg('');
    setParsedProfile(null);
    setRawText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">简历解析导入</h2>
      <p className="text-sm text-gray-500 mb-6">
        上传 PDF 格式的简历文件，系统将自动提取信息并填充到插件中。
      </p>

      {/* Upload Area */}
      {status === 'idle' && (
        <div className="space-y-4">
          {/* Parse Mode Selector */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600 font-medium">解析方式：</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="parseMode" value="auto" checked={parseMode === 'auto'}
                onChange={() => setParseMode('auto')} className="text-primary-600" />
              <span className="text-sm text-gray-700">自动</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="parseMode" value="llm" checked={parseMode === 'llm'}
                onChange={() => setParseMode('llm')} className="text-primary-600"
                disabled={!isLlmAvailable} />
              <span className={`text-sm ${isLlmAvailable ? 'text-gray-700' : 'text-gray-400'}`}>AI 智能解析</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="parseMode" value="regex" checked={parseMode === 'regex'}
                onChange={() => setParseMode('regex')} className="text-primary-600" />
              <span className="text-sm text-gray-700">规则引擎</span>
            </label>
          </div>

          {/* LLM Status */}
          {!isLlmAvailable && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                💡 AI 智能解析未启用。前往「设置」页面配置 LLM API 后可获得更精准的解析效果（借鉴 SmartResume 方案）。
                当前将使用规则引擎进行基础解析。
              </p>
            </div>
          )}
          {isLlmAvailable && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700">
                ✅ AI 智能解析已启用（{llmConfig?.model}），将使用 LLM 进行高精度简历解析。
              </p>
            </div>
          )}

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
            </svg>
            <span className="text-sm font-medium text-gray-700">点击上传简历 PDF</span>
            <span className="text-xs text-gray-400 mt-1">支持 .pdf 格式</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Loading */}
      {(status === 'reading' || status === 'extracting') && (
        <div className="flex flex-col items-center py-12">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-600">{statusMsg}</p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-700">{statusMsg}</p>
          <button onClick={handleReset} className="mt-3 text-sm text-primary-600 hover:underline">
            重新上传
          </button>
        </div>
      )}

      {/* Done */}
      {status === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-700">{statusMsg}</p>
          <button onClick={handleReset} className="mt-3 text-sm text-primary-600 hover:underline">
            继续上传
          </button>
        </div>
      )}

      {/* Preview */}
      {status === 'preview' && parsedProfile && (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700">{statusMsg}</p>
            {usedMode && <p className="text-xs text-blue-500 mt-1">使用方式：{usedMode}</p>}
          </div>

          <div className="space-y-4 mb-6">
            {/* Basic Info */}
            <PreviewSection title="基本信息">
              <PreviewGrid items={[
                ['姓名', parsedProfile.basic.name],
                ['性别', parsedProfile.basic.gender],
                ['手机', parsedProfile.basic.phone],
                ['邮箱', parsedProfile.basic.email],
                ['生日', parsedProfile.basic.birthday],
                ['籍贯', parsedProfile.basic.hometown],
                ['现居', parsedProfile.basic.currentCity],
                ['民族', parsedProfile.basic.ethnicity],
                ['政治面貌', parsedProfile.basic.politicalStatus],
              ]} />
            </PreviewSection>

            {/* Education */}
            {parsedProfile.education.length > 0 && (
              <PreviewSection title={`教育经历 (${parsedProfile.education.length})`}>
                {parsedProfile.education.map((edu, i) => (
                  <div key={i} className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">
                    <span className="font-medium">{edu.school || '未知学校'}</span>
                    {edu.major && <span className="ml-2 text-gray-500">{edu.major}</span>}
                    {edu.degree && <span className="ml-2 text-gray-400">{edu.degree}</span>}
                    {edu.startDate && <span className="ml-2 text-gray-400">{edu.startDate} ~ {edu.endDate}</span>}
                  </div>
                ))}
              </PreviewSection>
            )}

            {/* Work Experience */}
            {parsedProfile.workExperience.length > 0 && (
              <PreviewSection title={`工作/实习经历 (${parsedProfile.workExperience.length})`}>
                {parsedProfile.workExperience.map((w, i) => (
                  <div key={i} className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">
                    <span className="font-medium">{w.company || '未知公司'}</span>
                    {w.position && <span className="ml-2 text-gray-500">{w.position}</span>}
                    {w.startDate && <span className="ml-2 text-gray-400">{w.startDate} ~ {w.endDate}</span>}
                    {w.description && <p className="text-gray-400 mt-1 text-xs line-clamp-2">{w.description}</p>}
                  </div>
                ))}
              </PreviewSection>
            )}

            {/* Projects */}
            {parsedProfile.projectExperience.length > 0 && (
              <PreviewSection title={`项目经历 (${parsedProfile.projectExperience.length})`}>
                {parsedProfile.projectExperience.map((p, i) => (
                  <div key={i} className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">
                    <span className="font-medium">{p.name}</span>
                    {p.role && <span className="ml-2 text-gray-500">{p.role}</span>}
                    {p.startDate && <span className="ml-2 text-gray-400">{p.startDate} ~ {p.endDate}</span>}
                  </div>
                ))}
              </PreviewSection>
            )}

            {/* Awards */}
            {parsedProfile.awards.length > 0 && (
              <PreviewSection title={`获奖情况 (${parsedProfile.awards.length})`}>
                {parsedProfile.awards.map((a, i) => (
                  <div key={i} className="text-sm text-gray-700 py-1">
                    {a.name}{a.level && ` (${a.level})`}{a.date && ` - ${a.date}`}
                  </div>
                ))}
              </PreviewSection>
            )}

            {/* Self Evaluation */}
            {parsedProfile.selfEvaluation && (
              <PreviewSection title="自我评价">
                <p className="text-sm text-gray-600 whitespace-pre-line">{parsedProfile.selfEvaluation}</p>
              </PreviewSection>
            )}

            {/* Job Intention */}
            {(parsedProfile.jobIntention.position || parsedProfile.jobIntention.city.length > 0) && (
              <PreviewSection title="求职意向">
                <PreviewGrid items={[
                  ['期望职位', parsedProfile.jobIntention.position],
                  ['期望城市', parsedProfile.jobIntention.city.join(', ')],
                  ['期望薪资', parsedProfile.jobIntention.salary],
                  ['到岗时间', parsedProfile.jobIntention.entryDate],
                ]} />
              </PreviewSection>
            )}
          </div>

          {/* Raw Text Toggle */}
          <details className="mb-6">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
              查看 PDF 原始文本
            </summary>
            <pre className="mt-2 bg-gray-50 rounded-lg p-4 text-xs text-gray-600 max-h-60 overflow-y-auto whitespace-pre-wrap">
              {rawText}
            </pre>
          </details>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirmImport}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              确认导入
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function PreviewGrid({ items }: { items: [string, string][] }) {
  const filtered = items.filter(([, v]) => v);
  if (filtered.length === 0) {
    return <p className="text-sm text-gray-400">未解析到相关信息</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
      {filtered.map(([label, value]) => (
        <div key={label} className="text-sm">
          <span className="text-gray-400">{label}：</span>
          <span className="text-gray-700">{value}</span>
        </div>
      ))}
    </div>
  );
}
