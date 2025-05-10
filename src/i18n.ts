
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'zh'];
export const defaultLocale = 'en';

// Simplified messages for testing to rule out issues with the large messages object
const minimalMessagesData = {
  en: {
    LoginPage: {
      title: "MediAdmin Login",
      description: "Enter your credentials to access the admin panel",
      emailLabel: "Email",
      emailPlaceholder: "admin@medadmin.com",
      passwordLabel: "Password",
      passwordPlaceholder: "password",
      loginButton: "Login",
      loggingInButton: "Logging In...",
      copyright: "© {year} MediAdmin. All rights reserved."
    },
    UserNav: {
      profile: "Profile",
      settings: "Settings",
      support: "Support",
      logout: "Log out"
    },
    AppLayout: {
      dashboard: "Dashboard",
      userManagement: "User Management",
      videoManagement: "Video Management",
      analysisManagement: "Analysis Management",
      loadingApp: "Loading MediAdmin..."
    },
    DashboardPage: {
      title: "Dashboard",
      totalDoctors: "Total Doctors",
      totalDoctorsDesc: "Number of active doctors",
      totalPatients: "Total Patients",
      totalPatientsDesc: "Registered patients in system",
      uploadedVideos: "Uploaded Videos",
      uploadedVideosDesc: "Consultation videos",
      dataAnalyses: "Data Analyses",
      dataAnalysesDesc: "Analyses performed",
      analysisTrendsTitle: "Data Analysis Trends",
      analysisTrendsDesc: "Number of data analyses per day over the last few months.",
      noData: "No dashboard data available.",
      errorLoading: "Error Loading Dashboard",
      retry: "Retry",
      loading: "Loading dashboard...",
      noTrendData: "No analysis trend data available."
    },
    ToastMessages: {
      error: "Error",
      loginSuccessTitle: "Login Successful",
      loginSuccessDesc: "Welcome back!"
    },
    Common: {
      cancel: "Cancel",
      retry: "Retry",
      delete: "Delete",
      notApplicable: "N/A",
      saveChanges: "Save Changes"
    }
    // Add other essential keys if needed for basic page rendering during debugging
  },
  zh: {
    LoginPage: {
      title: "医疗管理后台",
      description: "输入您的凭据以访问管理面板",
      emailLabel: "邮箱",
      emailPlaceholder: "admin@medadmin.com",
      passwordLabel: "密码",
      passwordPlaceholder: "密码",
      loginButton: "登录",
      loggingInButton: "登录中...",
      copyright: "© {year} MediAdmin. 版权所有。"
    },
    UserNav: {
      profile: "个人资料",
      settings: "设置",
      support: "支持",
      logout: "登出"
    },
    AppLayout: {
      dashboard: "仪表盘",
      userManagement: "用户管理",
      videoManagement: "视频管理",
      analysisManagement: "分析管理",
      loadingApp: "正在加载 MediAdmin..."
    },
     DashboardPage: {
      title: "仪表盘",
      totalDoctors: "医生总数",
      totalDoctorsDesc: "活跃医生数量",
      totalPatients: "患者总数",
      totalPatientsDesc: "系统中注册的患者",
      uploadedVideos: "已上传视频",
      uploadedVideosDesc: "会诊视频",
      dataAnalyses: "数据分析",
      dataAnalysesDesc: "已执行的分析",
      analysisTrendsTitle: "数据分析趋势",
      analysisTrendsDesc: "过去几个月每日数据分析数量。",
      noData: "无仪表盘数据。",
      errorLoading: "加载仪表盘时出错",
      retry: "重试",
      loading: "正在加载仪表盘...",
      noTrendData: "无分析趋势数据。"
    },
    ToastMessages: {
      error: "错误",
      loginSuccessTitle: "登录成功",
      loginSuccessDesc: "欢迎回来！"
    },
    Common: {
      cancel: "取消",
      retry: "重试",
      delete: "删除",
      notApplicable: "不适用",
      saveChanges: "保存更改"
    }
  }
};

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  const isValidLocale = locales.includes(locale as any);
  if (!isValidLocale) {
    console.error(`[i18n.ts] Invalid locale detected: "${locale}". Expected one of: ${locales.join(', ')}. Calling notFound().`);
    notFound();
  }

  // @ts-ignore
  const selectedMessages = minimalMessagesData[locale] || minimalMessagesData[defaultLocale];

  if (!selectedMessages) {
    // This case should ideally not be hit if isValidLocale check is comprehensive
    // and defaultLocale is always in minimalMessagesData.
    console.error(`[i18n.ts] No messages found for locale: ${locale} or defaultLocale ${defaultLocale}. This indicates an issue in i18n.ts. Calling notFound().`);
    notFound();
  }
  
  return {
    messages: selectedMessages
  };
});
