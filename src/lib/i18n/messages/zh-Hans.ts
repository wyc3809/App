import type { MessageTree } from "../types";

export const zhHans: MessageTree = {
  nav: {
    home: "首页",
    accounts: "账户",
    ledger: "记账",
    insights: "分析",
  },
  loading: "正在加载你的资产…",
  intro: {
    skip: "跳过",
    next: "下一步",
    back: "上一步",
    welcome: {
      title: "欢迎使用 WorthBook",
      subtitle:
        "离线追踪净资产、账户与日常记账 — 数据只保存在本设备，不会上传。",
      loadDemo: "加载演示组合",
    },
    features: {
      title: "主要功能",
      subtitle: "底部四个分页涵盖完整财务概览。",
      home: {
        title: "首页",
        desc: "一眼看到总净资产、趋势与账户列表。",
      },
      accounts: {
        title: "账户",
        desc: "新增资产与负债，支持分类、余额与历史记录。",
      },
      ledger: {
        title: "记账",
        desc: "记录收入与支出 — 可选择链接到账户。",
      },
      insights: {
        title: "分析",
        desc: "增长、配置、现金流与类别图表。",
      },
    },
    ledger: {
      title: "第一笔记账",
      subtitle: "记一笔账大约 30 秒。",
      step1: "点底部「记账」分页。",
      step2: "选「支出」或「收入」，再选类别（例如：饮食）。",
      step3: "用数字键盘输入金额，点「完成」。",
      step4: "可选择链接账户，余额会自动更新。",
    },
    start: {
      title: "准备开始？",
      subtitle: "选任何一条路都可以 — 之后可在设置更改。",
      addAccount: "新增第一个账户",
      openLedger: "打开记账",
      loadDemo: "加载演示组合",
      skip: "空白开始",
    },
  },
  settings: {
    eyebrow: "偏好设置",
    title: "设置",
    subtitle: "离线优先。你的余额不会离开此浏览器。",
    display: "显示",
    language: "语言",
    languageEn: "English",
    languageZhHant: "繁體中文",
    languageZhHans: "简体中文",
    theme: "主题",
    themeLight: "浅色",
    themeDark: "深色",
    themeLightHint: "白底 + 绿色重点",
    themeDarkHint: "深色底 + 亮绿重点",
    privacyTitle: "隐私模式",
    privacyDesc: "以圆点遮盖余额",
  },
};
