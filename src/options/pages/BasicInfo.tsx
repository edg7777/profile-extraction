import React from 'react';
import { useProfileStore } from '@/store/profile-store';

const GENDER_OPTIONS = ['男', '女', '其他'];
const POLITICAL_OPTIONS = ['群众', '共青团员', '中共预备党员', '中共党员', '民主党派', '无党派人士'];

export default function BasicInfo() {
  const { currentProfile, updateCurrentProfile } = useProfileStore();
  if (!currentProfile) return null;

  const { basic } = currentProfile;

  const update = (field: string, value: string) => {
    updateCurrentProfile((p) => ({
      ...p,
      basic: { ...p.basic, [field]: value },
    }));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">基本信息</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label="姓名" value={basic.name} onChange={(v) => update('name', v)} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
          <select
            value={basic.gender}
            onChange={(e) => update('gender', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">请选择</option>
            {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <Field label="出生日期" value={basic.birthday} onChange={(v) => update('birthday', v)} type="date" />
        <Field label="手机号" value={basic.phone} onChange={(v) => update('phone', v)} type="tel" />
        <Field label="邮箱" value={basic.email} onChange={(v) => update('email', v)} type="email" />
        <Field label="身份证号" value={basic.idCard} onChange={(v) => update('idCard', v)} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">政治面貌</label>
          <select
            value={basic.politicalStatus}
            onChange={(e) => update('politicalStatus', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">请选择</option>
            {POLITICAL_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <Field label="民族" value={basic.ethnicity} onChange={(v) => update('ethnicity', v)} />
        <Field label="籍贯" value={basic.hometown} onChange={(v) => update('hometown', v)} />
        <Field label="现居城市" value={basic.currentCity} onChange={(v) => update('currentCity', v)} />
      </div>

      <h3 className="text-md font-semibold text-gray-900 mt-8 mb-4">社交链接</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label="GitHub" value={currentProfile.socialLinks.github} onChange={(v) => updateCurrentProfile((p) => ({ ...p, socialLinks: { ...p.socialLinks, github: v } }))} />
        <Field label="个人博客" value={currentProfile.socialLinks.blog} onChange={(v) => updateCurrentProfile((p) => ({ ...p, socialLinks: { ...p.socialLinks, blog: v } }))} />
        <Field label="LinkedIn" value={currentProfile.socialLinks.linkedin} onChange={(v) => updateCurrentProfile((p) => ({ ...p, socialLinks: { ...p.socialLinks, linkedin: v } }))} />
      </div>

      <h3 className="text-md font-semibold text-gray-900 mt-8 mb-4">自我评价</h3>
      <textarea
        value={currentProfile.selfEvaluation}
        onChange={(e) => updateCurrentProfile((p) => ({ ...p, selfEvaluation: e.target.value }))}
        rows={4}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
        placeholder="请输入自我评价..."
      />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder={`请输入${label}`}
      />
    </div>
  );
}
