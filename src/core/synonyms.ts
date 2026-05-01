export const SYNONYM_MAP: Record<string, string[]> = {
  // 基本信息
  'basic.name': ['姓名', '名字', '真实姓名', '用户名', 'Full Name', 'Name', 'name', 'fullname', 'username', 'realname'],
  'basic.gender': ['性别', 'Gender', 'gender', 'sex', 'Sex'],
  'basic.birthday': ['出生日期', '出生年月', '生日', 'Birthday', 'Date of Birth', 'DOB', 'birthday', 'birth_date', 'birthdate'],
  'basic.phone': ['手机号', '手机', '电话', '联系电话', '手机号码', '电话号码', 'Mobile', 'Phone', 'Tel', 'Telephone', 'phone', 'mobile', 'tel', 'cellphone'],
  'basic.email': ['邮箱', '电子邮箱', '邮件', '电子邮件', 'E-mail', 'Email', 'email', 'mail'],
  'basic.idCard': ['身份证', '身份证号', '身份证号码', '证件号码', 'ID Card', 'ID Number', 'idcard', 'id_number'],
  'basic.politicalStatus': ['政治面貌', '政治身份', 'Political Status', 'political'],
  'basic.ethnicity': ['民族', 'Ethnicity', 'Nation', 'ethnicity', 'nation'],
  'basic.hometown': ['籍贯', '户籍', '户籍所在地', '家乡', 'Hometown', 'Native Place', 'hometown', 'native_place', 'birthplace'],
  'basic.currentCity': ['现居城市', '现居住地', '所在城市', '当前城市', '居住地', 'Current City', 'Location', 'current_city', 'city', 'location'],
  'basic.avatar': ['头像', '照片', '个人照片', 'Avatar', 'Photo', 'avatar', 'photo'],

  // 教育经历
  'education.school': ['学校', '毕业院校', '院校名称', '学校名称', 'School', 'University', 'College', 'school', 'university'],
  'education.degree': ['学历', '学位', '学历层次', 'Degree', 'Education Level', 'degree', 'education_level'],
  'education.major': ['专业', '所学专业', '专业名称', 'Major', 'Field of Study', 'major', 'field_of_study'],
  'education.startDate': ['入学时间', '入学日期', '开始时间', 'Start Date', 'start_date', 'enrollment_date'],
  'education.endDate': ['毕业时间', '毕业日期', '结束时间', 'End Date', 'end_date', 'graduation_date'],
  'education.gpa': ['GPA', '绩点', '平均绩点', '成绩', 'gpa', 'grade_point'],
  'education.rank': ['排名', '年级排名', '专业排名', 'Rank', 'Ranking', 'rank'],

  // 工作/实习经历
  'workExperience.company': ['公司', '公司名称', '企业名称', '单位名称', 'Company', 'Organization', 'company', 'employer'],
  'workExperience.position': ['职位', '岗位', '职务', '岗位名称', 'Position', 'Job Title', 'Title', 'position', 'job_title'],
  'workExperience.department': ['部门', '所在部门', 'Department', 'department'],
  'workExperience.startDate': ['入职时间', '开始时间', 'Start Date', 'start_date'],
  'workExperience.endDate': ['离职时间', '结束时间', 'End Date', 'end_date'],
  'workExperience.description': ['工作描述', '工作内容', '职责描述', 'Description', 'Responsibilities', 'description'],

  // 项目经历
  'projectExperience.name': ['项目名称', '项目名', 'Project Name', 'project_name'],
  'projectExperience.role': ['担任角色', '项目角色', '职责', 'Role', 'role'],
  'projectExperience.techStack': ['技术栈', '使用技术', '技术工具', 'Tech Stack', 'Technologies', 'tech_stack'],
  'projectExperience.description': ['项目描述', '项目详情', 'Project Description', 'project_description'],

  // 获奖
  'awards.name': ['获奖名称', '奖项', '荣誉', 'Award', 'Honor', 'award_name'],
  'awards.date': ['获奖时间', 'Award Date', 'award_date'],
  'awards.level': ['奖项级别', '级别', 'Award Level', 'award_level'],

  // 证书
  'certificates.name': ['证书名称', '资格证书', 'Certificate', 'certificate_name'],
  'certificates.date': ['获证时间', 'Certificate Date', 'cert_date'],
  'certificates.score': ['成绩', '分数', 'Score', 'score'],

  // 自我评价
  'selfEvaluation': ['自我评价', '个人总结', '个人简介', '自我介绍', 'Self Evaluation', 'About Me', 'Summary', 'Bio', 'self_evaluation', 'about'],

  // 求职意向
  'jobIntention.position': ['期望职位', '意向岗位', '求职意向', 'Expected Position', 'Job Intention', 'expected_position'],
  'jobIntention.city': ['期望城市', '意向城市', '工作地点', 'Expected City', 'Preferred Location', 'expected_city', 'work_location'],
  'jobIntention.salary': ['期望薪资', '薪资要求', '期望薪酬', 'Expected Salary', 'Salary', 'expected_salary'],
  'jobIntention.entryDate': ['到岗时间', '入职时间', '可到岗时间', 'Available Date', 'Start Date', 'entry_date'],

  // 社交链接
  'socialLinks.github': ['GitHub', 'github', 'Github'],
  'socialLinks.blog': ['博客', '个人网站', 'Blog', 'Website', 'blog', 'website', 'homepage'],
  'socialLinks.linkedin': ['LinkedIn', 'linkedin', 'Linkedin'],
};

export function getSynonymsForPath(profilePath: string): string[] {
  return SYNONYM_MAP[profilePath] || [];
}

export function getAllProfilePaths(): string[] {
  return Object.keys(SYNONYM_MAP);
}
