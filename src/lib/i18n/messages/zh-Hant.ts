import type { MessageTree } from "../types";

export const zhHant: MessageTree = {
  nav: {
    home: "首頁",
    accounts: "帳戶",
    ledger: "記帳",
    insights: "分析",
  },
  loading: "正在載入你的資產…",
  intro: {
    skip: "略過",
    next: "下一步",
    back: "上一步",
    welcome: {
      title: "歡迎使用 WorthBook",
      subtitle:
        "離線追蹤淨資產、帳戶同日常記帳 — 資料只儲存在此裝置，唔會上傳。",
      loadDemo: "載入示範組合",
    },
    features: {
      title: "主要功能",
      subtitle: "底部四個分頁涵蓋完整財務概覽。",
      home: {
        title: "首頁",
        desc: "一眼睇到總淨資產、趨勢同帳戶列表。",
      },
      accounts: {
        title: "帳戶",
        desc: "新增資產同負債，支援分類、結餘同歷史記錄。",
      },
      ledger: {
        title: "記帳",
        desc: "記錄收入同支出 — 可選擇連結到帳戶。",
      },
      insights: {
        title: "分析",
        desc: "增長、配置、現金流同類別圖表。",
      },
    },
    ledger: {
      title: "第一筆記帳",
      subtitle: "記一筆帳大概 30 秒。",
      step1: "㩒底部「記帳」分頁。",
      step2: "揀「支出」或「收入」，再揀類別（例如：飲食）。",
      step3: "用數字鍵盤輸入金額，㩒「完成」。",
      step4: "可選擇連結帳戶，餘額會自動更新。",
    },
    start: {
      title: "準備開始？",
      subtitle: "揀任何一條路都得 — 之後可喺設定更改。",
      addAccount: "新增第一個帳戶",
      openLedger: "開啟記帳",
      loadDemo: "載入示範組合",
      skip: "空白開始",
    },
  },
  settings: {
    eyebrow: "偏好設定",
    title: "設定",
    subtitle: "離線優先。你的結餘唔會離開此瀏覽器。",
    display: "顯示",
    language: "語言",
    languageEn: "English",
    languageZhHant: "繁體中文",
    languageZhHans: "简体中文",
    theme: "主題",
    themeLight: "淺色",
    themeDark: "深色",
    themeLightHint: "白底 + 綠色重點",
    themeDarkHint: "深色底 + 亮綠重點",
    privacyTitle: "私隱模式",
    privacyDesc: "以圓點遮蓋結餘",
  },
};
