# AutoFill Resume — 浏览器简历自动填充插件设计文档

## 1. 项目概述

### 1.1 背景与痛点

秋招/春招期间，求职者需要在数十甚至上百个公司的招聘网站上填写简历。每家公司的简历模板格式不同，字段名称各异，导致：

- 每次都要重复上传、解析、手动补全简历信息
- 不同网站字段映射不一致（如"手机号"vs"联系电话"vs"Mobile"）
- 大量重复劳动，极易出错或遗漏

### 1.2 产品目标

开发一款兼容 **Chrome** 和 **Edge**（基于 Manifest V3）的浏览器插件，实现：

1. 用户只需 **维护一份标准简历数据**
2. 在任意公司招聘页面 **一键自动识别并填充** 表单字段
3. 支持主流招聘平台及企业自建招聘系统

### 1.3 目标用户

应届毕业生、社招求职者、需要批量投递简历的求职者

---

## 2. 核心功能

### 2.1 简历数据管理（Profile Manager）

| 功能 | 描述 |
|------|------|
| 手动录入 | 通过插件 Popup / Options 页面表单录入个人信息 |
| 简历解析导入 | 上传 PDF/Word 简历，自动解析为结构化数据 |
| 多份简历 | 支持保存多份 Profile（如：技术岗版、产品岗版） |
| 数据编辑 | 随时增删改个人信息条目 |
| 导入/导出 | 支持 JSON 格式导入导出，方便备份与迁移 |

### 2.2 标准简历数据模型（Profile Schema）

```jsonc
{
  "basic": {
    "name": "张三",
    "gender": "男",
    "birthday": "1999-06-15",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "idCard": "110101199906150011",
    "politicalStatus": "共青团员",
    "ethnicity": "汉族",
    "hometown": "北京市海淀区",
    "currentCity": "上海市",
    "avatar": "<base64 or url>"
  },
  "education": [
    {
      "school": "XX大学",
      "degree": "本科",          // 本科/硕士/博士/大专
      "major": "计算机科学与技术",
      "startDate": "2017-09",
      "endDate": "2021-06",
      "gpa": "3.8/4.0",
      "rank": "前10%"
    }
  ],
  "workExperience": [
    {
      "company": "XX科技有限公司",
      "position": "前端开发实习生",
      "department": "技术部",
      "startDate": "2020-06",
      "endDate": "2020-09",
      "description": "负责xxx..."
    }
  ],
  "projectExperience": [
    {
      "name": "XX管理系统",
      "role": "前端负责人",
      "startDate": "2020-03",
      "endDate": "2020-06",
      "techStack": "React, Node.js, MySQL",
      "description": "项目描述..."
    }
  ],
  "skills": [
    { "name": "JavaScript/TypeScript", "level": "熟练" },
    { "name": "React", "level": "熟练" },
    { "name": "Python", "level": "了解" }
  ],
  "awards": [
    {
      "name": "全国大学生数学建模竞赛一等奖",
      "date": "2019-11",
      "level": "国家级"
    }
  ],
  "certificates": [
    { "name": "CET-6", "date": "2019-06", "score": "580" }
  ],
  "selfEvaluation": "本人热爱技术...",
  "jobIntention": {
    "position": "前端开发工程师",
    "city": ["上海", "北京", "深圳"],
    "salary": "15k-25k",
    "entryDate": "2021-07"
  },
  "socialLinks": {
    "github": "https://github.com/zhangsan",
    "blog": "https://zhangsan.dev",
    "linkedin": ""
  }
}
```

### 2.3 智能表单识别与填充（AutoFill Engine）

#### 2.3.1 识别策略（优先级从高到低）

1. **平台适配规则（Site Adapter）**
   - 为主流招聘平台编写专用适配器（如：牛客、智联、前程无忧、Boss直聘、各大厂官网等）
   - 通过 URL 匹配激活对应适配器
   - 精准映射表单字段 → Profile 字段

2. **语义匹配（Generic Matcher）**
   - 对未适配的网站，使用通用匹配算法
   - 分析 `<label>`、`placeholder`、`name`、`id`、`aria-label` 等属性
   - 构建 **字段同义词表**（如 `["手机号", "电话", "mobile", "phone", "联系方式"]` → `basic.phone`）
   - 使用余弦相似度或编辑距离进行模糊匹配

3. **上下文推断**
   - 根据表单分组（fieldset）和前后字段推断未识别字段
   - 如：在"教育经历"区块中的"开始时间"→ `education[].startDate`

#### 2.3.2 填充策略

| 表单元素 | 填充方式 |
|----------|----------|
| `<input type="text">` | 直接 setValue + 触发 input/change 事件 |
| `<input type="date">` | 格式化日期后填入 |
| `<select>` | 匹配 option 文本，选中最佳匹配项 |
| `<input type="radio">` | 根据值匹配点击 |
| `<input type="checkbox">` | 根据值匹配勾选 |
| `<textarea>` | 直接填入长文本 |
| `contenteditable` | 模拟输入 |
| React/Vue 受控组件 | 通过 `nativeInputValueSetter` 或模拟键盘事件绕过框架接管 |
| 自定义下拉框 | 模拟点击展开 → 搜索 → 选择 |

#### 2.3.3 填充流程

```
用户打开招聘页面
    ↓
Content Script 注入 → 检测是否为表单页面
    ↓
匹配 Site Adapter（有则用专用规则，无则用通用匹配）
    ↓
扫描页面表单元素 → 构建字段列表
    ↓
字段映射：表单字段 ↔ Profile 字段
    ↓
用户点击「一键填充」或浮窗触发
    ↓
逐字段填入 → 触发原生事件 → 处理动态加载
    ↓
高亮已填字段（绿色）/ 未识别字段（黄色）/ 需确认字段（橙色）
    ↓
用户检查 & 手动补充 → 确认提交
```

### 2.4 平台适配器系统（Site Adapter）

```
src/adapters/
  ├── base.ts              // 基类，定义适配器接口
  ├── nowcoder.ts          // 牛客网
  ├── zhilian.ts           // 智联招聘
  ├── 51job.ts             // 前程无忧
  ├── boss.ts              // Boss直聘
  ├── lagou.ts             // 拉勾
  ├── liepin.ts            // 猎聘
  ├── alibaba.ts           // 阿里巴巴
  ├── tencent.ts           // 腾讯
  ├── bytedance.ts         // 字节跳动
  ├── meituan.ts           // 美团
  ├── baidu.ts             // 百度
  ├── huawei.ts            // 华为
  ├── xiaomi.ts            // 小米
  └── generic.ts           // 通用适配器（兜底）
```

**适配器接口定义：**

```typescript
interface SiteAdapter {
  // 匹配条件
  matches(url: string): boolean;

  // 扫描当前页面所有可填字段，返回字段描述列表
  scanFields(document: Document): FormField[];

  // 将 Profile 数据映射到表单字段
  mapProfileToFields(profile: Profile, fields: FormField[]): FieldMapping[];

  // 执行填充
  fillFields(mappings: FieldMapping[]): FillResult;

  // 处理动态加载（如翻页、展开更多）
  handleDynamicContent?(): Promise<void>;
}
```

### 2.5 用户交互

#### 2.5.1 Popup 弹窗

- 显示当前 Profile 概要
- 「一键填充」按钮
- 切换 Profile 版本
- 快速跳转到 Options 完整编辑页

#### 2.5.2 悬浮操作栏（Content Script 注入）

- 检测到表单时在页面右下角显示悬浮按钮
- 点击展开：一键填充 / 选择 Profile / 查看匹配结果
- 可拖拽、可折叠、可关闭

#### 2.5.3 Options 页面（完整管理界面）

- Profile 数据完整编辑（分 Tab：基本信息 / 教育经历 / 工作经历 / 项目经历 / 技能 / 获奖 / 求职意向）
- 简历文件上传与解析
- 适配器管理（启用/禁用、查看适配平台列表）
- 填充历史记录
- 设置项（自动填充开关、填充延迟、主题等）

---

## 3. 技术架构

### 3.1 技术栈

| 层级 | 技术选型 |
|------|----------|
| 插件标准 | Manifest V3（兼容 Chrome & Edge） |
| 前端框架 | React 18 + TypeScript |
| 样式方案 | TailwindCSS + shadcn/ui |
| 构建工具 | Vite + CRXJS（或 Plasmo） |
| 存储 | chrome.storage.local（Profile 数据） |
| 简历解析 | pdf.js（PDF） + mammoth.js（Word） + 自定义 NLP 提取 |
| 状态管理 | Zustand |
| 表单匹配 | 自研规则引擎 + 同义词词典 |
| 打包 | 单一构建产出兼容 Chrome / Edge |

### 3.2 模块结构

```
profile-extraction/
├── manifest.json                 // MV3 清单文件
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── design.md                     // 本设计文档
│
├── src/
│   ├── background/
│   │   └── service-worker.ts     // Service Worker（MV3 后台）
│   │
│   ├── content/
│   │   ├── index.ts              // Content Script 入口
│   │   ├── detector.ts           // 表单检测器
│   │   ├── filler.ts             // 填充执行器
│   │   ├── highlighter.ts        // 已填字段高亮
│   │   └── floating-bar/         // 悬浮操作栏 UI
│   │       ├── App.tsx
│   │       └── index.tsx
│   │
│   ├── popup/
│   │   ├── App.tsx               // Popup 主界面
│   │   ├── index.tsx
│   │   └── index.html
│   │
│   ├── options/
│   │   ├── App.tsx               // Options 完整管理页
│   │   ├── index.tsx
│   │   ├── index.html
│   │   └── pages/
│   │       ├── BasicInfo.tsx
│   │       ├── Education.tsx
│   │       ├── WorkExperience.tsx
│   │       ├── Projects.tsx
│   │       ├── Skills.tsx
│   │       ├── Awards.tsx
│   │       ├── JobIntention.tsx
│   │       ├── ResumeUpload.tsx
│   │       ├── AdapterManager.tsx
│   │       ├── FillHistory.tsx
│   │       └── Settings.tsx
│   │
│   ├── adapters/                 // 平台适配器
│   │   ├── base.ts
│   │   ├── registry.ts           // 适配器注册表
│   │   ├── generic.ts            // 通用适配器
│   │   ├── nowcoder.ts
│   │   ├── zhilian.ts
│   │   └── ...
│   │
│   ├── core/
│   │   ├── profile.ts            // Profile 数据模型 & CRUD
│   │   ├── matcher.ts            // 字段语义匹配引擎
│   │   ├── synonyms.ts           // 同义词词典
│   │   ├── parser/
│   │   │   ├── pdf-parser.ts     // PDF 简历解析
│   │   │   └── word-parser.ts    // Word 简历解析
│   │   └── events.ts             // 表单事件模拟工具
│   │
│   ├── store/
│   │   └── profile-store.ts      // Zustand 状态管理
│   │
│   ├── utils/
│   │   ├── storage.ts            // chrome.storage 封装
│   │   ├── message.ts            // 消息通信封装
│   │   └── dom.ts                // DOM 操作工具
│   │
│   └── types/
│       ├── profile.d.ts          // Profile 类型定义
│       ├── adapter.d.ts          // 适配器类型定义
│       └── form.d.ts             // 表单字段类型定义
│
├── public/
│   └── icons/
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
│
└── tests/
    ├── matcher.test.ts
    ├── parser.test.ts
    └── adapters/
        └── generic.test.ts
```

### 3.3 消息通信架构

```
┌──────────────┐     chrome.runtime      ┌──────────────────┐
│   Popup UI   │ ◄──── message ────────► │  Service Worker   │
└──────────────┘                         │  (Background)     │
                                         └────────┬─────────┘
┌──────────────┐     chrome.tabs               │
│  Options UI  │ ◄──── message ────────────────┤
└──────────────┘                               │
                                               │ chrome.tabs.sendMessage
┌──────────────┐     chrome.runtime            │
│Content Script│ ◄──── message ────────────────┘
│ + 悬浮栏     │
└──────────────┘

数据存储：chrome.storage.local（所有上下文共享）
```

### 3.4 核心流程时序图

```
User            Popup/Float     ContentScript     ServiceWorker     Storage
 │                 │                 │                 │                │
 │  打开招聘页面    │                 │                 │                │
 │────────────────►│                 │                 │                │
 │                 │   页面加载       │                 │                │
 │                 │────────────────►│                 │                │
 │                 │                 │  检测表单        │                │
 │                 │                 │──┐               │                │
 │                 │                 │◄─┘               │                │
 │                 │  显示悬浮按钮   │                  │                │
 │                 │◄────────────────│                  │                │
 │                 │                 │                  │                │
 │  点击一键填充   │                 │                  │                │
 │────────────────►│                 │                  │                │
 │                 │  请求 Profile    │                  │                │
 │                 │─────────────────────────────────────────────────────►│
 │                 │  返回 Profile    │                  │                │
 │                 │◄─────────────────────────────────────────────────────│
 │                 │  填充指令        │                  │                │
 │                 │────────────────►│                  │                │
 │                 │                 │  扫描字段         │                │
 │                 │                 │  匹配映射         │                │
 │                 │                 │  逐字段填充       │                │
 │                 │                 │  高亮反馈         │                │
 │                 │  填充结果       │                   │                │
 │                 │◄────────────────│                   │                │
 │  查看结果       │                 │                   │                │
 │◄────────────────│                 │                   │                │
```

---

## 4. 字段匹配引擎详细设计

### 4.1 同义词词典结构

```typescript
// synonyms.ts
const SYNONYM_MAP: Record<string, string[]> = {
  "basic.name":     ["姓名", "名字", "真实姓名", "Full Name", "Name", "name"],
  "basic.phone":    ["手机号", "手机", "电话", "联系电话", "Mobile", "Phone", "Tel", "phone"],
  "basic.email":    ["邮箱", "电子邮箱", "E-mail", "Email", "email"],
  "basic.gender":   ["性别", "Gender", "gender"],
  "basic.birthday": ["出生日期", "生日", "Birthday", "Date of Birth", "DOB"],
  // ... 覆盖所有 Profile 字段
};
```

### 4.2 匹配算法

```
输入：表单元素 HTMLElement
  ↓
提取候选文本：label.textContent / placeholder / name / id / aria-label / 前置文本节点
  ↓
预处理：去空格、转小写、去特殊符号
  ↓
精确匹配：在同义词表中查找完全匹配
  ↓（未命中）
模糊匹配：计算与同义词表中所有词的编辑距离，取最小值 < 阈值
  ↓（未命中）
上下文推断：根据所在 fieldset/section 标题 + 字段顺序推断
  ↓（仍未命中）
标记为「未识别」，等待用户手动映射
```

### 4.3 用户手动映射反馈

- 未识别字段显示橙色高亮 + 下拉选择器
- 用户手动选择对应 Profile 字段后，自动学习该网站的映射规则
- 映射规则存储在 `chrome.storage.local` 中，下次访问同一网站自动应用

---

## 5. 简历解析模块设计

### 5.1 PDF 解析

```
PDF 文件
  ↓  pdf.js
纯文本 + 位置信息
  ↓  分段算法（基于行距、字体大小、加粗检测）
文本块分组（标题 + 内容）
  ↓  NLP 关键词匹配
结构化 Profile 数据
```

### 5.2 Word 解析

```
DOCX 文件
  ↓  mammoth.js
HTML 结构
  ↓  DOM 解析 + 段落/表格识别
结构化 Profile 数据
```

### 5.3 关键段落识别关键词

| Profile 区块 | 识别关键词 |
|--------------|-----------|
| 基本信息 | 个人信息、基本资料、Personal Info |
| 教育经历 | 教育背景、教育经历、学历、Education |
| 工作经历 | 工作经历、实习经历、Work Experience、Internship |
| 项目经历 | 项目经历、项目经验、Projects |
| 技能 | 专业技能、技术栈、Skills |
| 获奖 | 获奖情况、荣誉奖励、Awards、Honors |
| 自我评价 | 自我评价、个人总结、About Me |

---

## 6. 安全与隐私

| 措施 | 说明 |
|------|------|
| **纯本地存储** | 所有 Profile 数据存储在 `chrome.storage.local`，**不上传任何服务器** |
| **无远程通信** | 插件不进行任何网络请求（除非用户主动开启云同步功能） |
| **最小权限** | Manifest 仅声明必要权限：`activeTab`、`storage`、`scripting` |
| **敏感字段加密** | 身份证号等敏感信息使用 AES 加密存储 |
| **开源透明** | 代码开源，接受社区审计 |

---

## 7. Manifest V3 配置概要

```jsonc
{
  "manifest_version": 3,
  "name": "AutoFill Resume",
  "version": "1.0.0",
  "description": "一键填充招聘网站简历表单，告别重复劳动",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "src/background/service-worker.ts"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/index.ts"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": {
      "16": "public/icons/icon-16.png",
      "48": "public/icons/icon-48.png",
      "128": "public/icons/icon-128.png"
    }
  },
  "options_page": "src/options/index.html",
  "icons": {
    "16": "public/icons/icon-16.png",
    "48": "public/icons/icon-48.png",
    "128": "public/icons/icon-128.png"
  }
}
```

---

## 8. 开发计划

### Phase 1 — MVP（2 周）

- [x] 项目初始化（Vite + CRXJS + React + TS）
- [ ] Profile 数据模型与 CRUD
- [ ] Options 页面：手动录入 Profile
- [ ] Popup 基本 UI
- [ ] 通用适配器（Generic Matcher）：基于同义词表的表单识别与填充
- [ ] 基本表单元素填充（input/select/textarea/radio/checkbox）

### Phase 2 — 核心增强（2 周）

- [ ] PDF / Word 简历解析导入
- [ ] 5+ 主流平台专用适配器（牛客、智联、Boss直聘、前程无忧、拉勾）
- [ ] 悬浮操作栏 UI
- [ ] 填充结果高亮反馈
- [ ] React/Vue 受控组件的填充兼容

### Phase 3 — 体验优化（1 周）

- [ ] 未识别字段手动映射 + 学习记录
- [ ] 多 Profile 切换
- [ ] 填充历史记录
- [ ] 大厂官网适配器（阿里、腾讯、字节、美团、华为、小米等）

### Phase 4 — 扩展能力（持续迭代）

- [ ] 云同步（可选，端到端加密）
- [ ] 社区共享适配器规则
- [ ] 自定义字段扩展
- [ ] 国际化（i18n）
- [ ] Chrome Web Store & Edge Add-ons 发布

---

## 9. 风险与应对

| 风险 | 应对策略 |
|------|----------|
| 招聘网站反自动化检测 | 模拟真实用户输入节奏（随机延迟）、使用 `dispatchEvent` 而非直接赋值 |
| 网站频繁改版导致适配器失效 | 适配器解耦设计，支持热更新；通用适配器兜底 |
| React/Vue 等框架劫持 input 事件 | 使用 `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set` 绕过 |
| 复杂表单（多步骤/动态加载） | 适配器支持 `handleDynamicContent`，使用 MutationObserver 监听 DOM 变化 |
| 简历解析准确率 | 提供解析结果预览，用户可手动修正 |

---

## 10. 竞品参考

| 产品 | 优势 | 不足 |
|------|------|------|
| Chrome 自带自动填充 | 原生集成 | 仅支持基础字段，不支持复杂简历结构 |
| 各招聘平台简历解析 | 平台深度集成 | 每个平台独立，无法跨平台复用 |
| Autofill 类插件 | 通用表单填充 | 不针对招聘场景优化，字段识别弱 |

**本插件差异化**：专注招聘场景，深度适配主流平台，智能语义匹配，一份数据全平台通用。
