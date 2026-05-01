import type { Profile } from '@/types/profile';
import type { LlmConfig } from '@/utils/storage';
import { createEmptyProfile, generateItemId } from '@/core/profile';

// SmartResume-style system prompt
const SYSTEM_PROMPT = `你是一个专业的简历解析助手。你的任务是从简历文本中提取结构化信息。
严格遵守以下规则：
1. 只提取简历中明确存在的信息，不要推断或编造
2. 如果某个字段在简历中未提及，使用空字符串 ""
3. 日期格式统一为 YYYY-MM（如 2020-09），如果只有年份则为 YYYY
4. 如果日期写的是"至今"、"present"，endDate 填写 "至今"
5. 返回标准 JSON 格式，不要包含注释或多余文字`;

// Inspired by SmartResume's BASIC_INFO_PROMPT
const BASIC_INFO_PROMPT = `从以下简历文本中提取基本个人信息，返回如下 JSON 格式：
{
  "name": "姓名",
  "gender": "性别（男/女）",
  "birthday": "出生日期，格式 YYYY-MM",
  "phone": "手机号码，保留原始格式",
  "email": "电子邮箱",
  "idCard": "身份证号",
  "politicalStatus": "政治面貌",
  "ethnicity": "民族",
  "hometown": "籍贯/户籍所在地",
  "currentCity": "现居城市"
}

注意：
- name：提取候选人全名
- phone：保留原始格式，包括国际区号
- gender：仅当简历中明确提及时才填写
- currentCity 与 hometown 是不同字段，不要混淆`;

// Inspired by SmartResume's EDUCATION_PROMPT
const EDUCATION_PROMPT = `从以下简历文本中提取教育经历，返回 JSON 数组格式：
[
  {
    "school": "学校名称，使用简历原文",
    "degree": "学历层次（本科/硕士/博士/大专/高中）",
    "major": "专业名称",
    "startDate": "入学时间，格式 YYYY-MM",
    "endDate": "毕业时间，格式 YYYY-MM，在读填 至今",
    "gpa": "GPA 成绩，如 3.8/4.0",
    "rank": "排名信息，如 前10%"
  }
]

注意：
- 按时间倒序排列（最近的在前）
- school 使用简历中的原始名称
- degree 只填学历层次，不要填学位类型`;

// Inspired by SmartResume's WORK_EXPERIENCE_PROMPT
const WORK_EXPERIENCE_PROMPT = `从以下简历文本中提取工作/实习经历，返回 JSON 数组格式：
[
  {
    "company": "公司名称，使用简历原文",
    "position": "职位名称，使用简历原文",
    "department": "部门",
    "startDate": "开始时间，格式 YYYY-MM",
    "endDate": "结束时间，格式 YYYY-MM，在职填 至今",
    "description": "工作描述，包含工作职责、业绩、使用的技术等",
    "isInternship": false
  }
]

注意：
- 包含正式工作和实习经历
- isInternship：如果是实习岗位设为 true，否则 false
- description：保留原文的工作描述内容，不要缩减
- 按时间倒序排列`;

const PROJECT_PROMPT = `从以下简历文本中提取项目经历，返回 JSON 数组格式：
[
  {
    "name": "项目名称",
    "role": "担任角色",
    "startDate": "开始时间，格式 YYYY-MM",
    "endDate": "结束时间，格式 YYYY-MM",
    "techStack": "使用的技术栈",
    "description": "项目描述，保留原文"
  }
]`;

const OTHER_INFO_PROMPT = `从以下简历文本中提取其他信息，返回如下 JSON 格式：
{
  "selfEvaluation": "自我评价/个人总结，保留原文",
  "jobIntention": {
    "position": "期望职位",
    "city": ["期望城市数组"],
    "salary": "期望薪资",
    "entryDate": "到岗时间"
  },
  "socialLinks": {
    "github": "GitHub 链接",
    "blog": "博客/个人网站链接",
    "linkedin": "LinkedIn 链接"
  },
  "awards": [
    {
      "name": "奖项名称",
      "date": "获奖时间，格式 YYYY-MM",
      "level": "级别（国家级/省级/校级等）"
    }
  ],
  "certificates": [
    {
      "name": "证书名称",
      "date": "获证时间",
      "score": "成绩/分数"
    }
  ]
}`;

async function callLlm(config: LlmConfig, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      enable_thinking: false,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseJsonResponse(text: string): any {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      return JSON.parse(match[1].trim());
    }
    // Try to find JSON object or array
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error('无法解析 LLM 返回的 JSON');
  }
}

export interface LlmExtractionProgress {
  step: string;
  current: number;
  total: number;
}

export async function extractProfileWithLlm(
  resumeText: string,
  config: LlmConfig,
  profileName: string,
  onProgress?: (progress: LlmExtractionProgress) => void,
): Promise<Profile> {
  const profile = createEmptyProfile(profileName);
  const total = 4;

  // Step 1: Basic info
  onProgress?.({ step: '正在提取基本信息...', current: 1, total });
  try {
    const basicResult = await callLlm(
      config,
      SYSTEM_PROMPT,
      BASIC_INFO_PROMPT + '\n\n简历文本：\n' + resumeText
    );
    const basicData = parseJsonResponse(basicResult);
    profile.basic = {
      name: basicData.name || '',
      gender: basicData.gender || '',
      birthday: basicData.birthday || '',
      phone: basicData.phone || '',
      email: basicData.email || '',
      idCard: basicData.idCard || '',
      politicalStatus: basicData.politicalStatus || '',
      ethnicity: basicData.ethnicity || '',
      hometown: basicData.hometown || '',
      currentCity: basicData.currentCity || '',
      avatar: '',
    };
  } catch (err) {
    console.error('提取基本信息失败:', err);
  }

  // Step 2: Education
  onProgress?.({ step: '正在提取教育经历...', current: 2, total });
  try {
    const eduResult = await callLlm(
      config,
      SYSTEM_PROMPT,
      EDUCATION_PROMPT + '\n\n简历文本：\n' + resumeText
    );
    const eduData = parseJsonResponse(eduResult);
    const eduArray = Array.isArray(eduData) ? eduData : (eduData.education || eduData.data || []);
    profile.education = eduArray.map((e: any) => ({
      id: generateItemId(),
      school: e.school || '',
      degree: e.degree || e.degreeLevel || '',
      major: e.major || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      gpa: e.gpa || '',
      rank: e.rank || '',
    }));
  } catch (err) {
    console.error('提取教育经历失败:', err);
  }

  // Step 3: Work experience
  onProgress?.({ step: '正在提取工作/实习经历...', current: 3, total });
  try {
    const workResult = await callLlm(
      config,
      SYSTEM_PROMPT,
      WORK_EXPERIENCE_PROMPT + '\n\n简历文本：\n' + resumeText
    );
    const workData = parseJsonResponse(workResult);
    const workArray = Array.isArray(workData) ? workData : (workData.workExperience || workData.data || []);
    profile.workExperience = workArray.map((w: any) => ({
      id: generateItemId(),
      company: w.company || w.companyName || '',
      position: w.position || '',
      department: w.department || '',
      startDate: w.startDate || '',
      endDate: w.endDate || '',
      description: w.description || w.jobDescription || '',
    }));
  } catch (err) {
    console.error('提取工作经历失败:', err);
  }

  // Step 4: Projects + other info
  onProgress?.({ step: '正在提取项目经历和其他信息...', current: 4, total });
  try {
    const projResult = await callLlm(
      config,
      SYSTEM_PROMPT,
      PROJECT_PROMPT + '\n\n简历文本：\n' + resumeText
    );
    const projData = parseJsonResponse(projResult);
    const projArray = Array.isArray(projData) ? projData : (projData.projectExperience || projData.data || []);
    profile.projectExperience = projArray.map((p: any) => ({
      id: generateItemId(),
      name: p.name || '',
      role: p.role || '',
      startDate: p.startDate || '',
      endDate: p.endDate || '',
      techStack: p.techStack || '',
      description: p.description || '',
    }));
  } catch (err) {
    console.error('提取项目经历失败:', err);
  }

  try {
    const otherResult = await callLlm(
      config,
      SYSTEM_PROMPT,
      OTHER_INFO_PROMPT + '\n\n简历文本：\n' + resumeText
    );
    const otherData = parseJsonResponse(otherResult);

    if (otherData.selfEvaluation) {
      profile.selfEvaluation = otherData.selfEvaluation;
    }
    if (otherData.jobIntention) {
      profile.jobIntention = {
        position: otherData.jobIntention.position || '',
        city: Array.isArray(otherData.jobIntention.city) ? otherData.jobIntention.city : [],
        salary: otherData.jobIntention.salary || '',
        entryDate: otherData.jobIntention.entryDate || '',
      };
    }
    if (otherData.socialLinks) {
      profile.socialLinks = {
        github: otherData.socialLinks.github || '',
        blog: otherData.socialLinks.blog || '',
        linkedin: otherData.socialLinks.linkedin || '',
      };
    }
    if (Array.isArray(otherData.awards)) {
      profile.awards = otherData.awards.map((a: any) => ({
        id: generateItemId(),
        name: a.name || '',
        date: a.date || '',
        level: a.level || '',
      }));
    }
    if (Array.isArray(otherData.certificates)) {
      profile.certificates = otherData.certificates.map((c: any) => ({
        id: generateItemId(),
        name: c.name || '',
        date: c.date || '',
        score: c.score || '',
      }));
    }
  } catch (err) {
    console.error('提取其他信息失败:', err);
  }

  return profile;
}
