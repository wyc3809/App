# 繼續開發用提示詞（貼到另一個 AI）

## 1) 擴寫事件

```
讀取 STYLE-BIBLE.md 與 writing/event-voice.md、event-templates.md。
請把「夜雨投店」擴成完整事件：title、body（60–90字）、3個批註選項、
各選項 effects（stat/flag/money/hp 之一）、一句 epilogue。
輸出 TypeScript 物件，可直接貼入 data/events/catalog.ts。
不要出現版權門派名，不要在正文寫數值。
```

## 2) 做一屏水墨 UI（React）

```
依 STYLE-BIBLE.md 與 tokens/colors.json，用 React + CSS 做「開卷」首屏：
品牌「江湖一生」最大、一句副句、兩個 CTA（續寫前緣／開卷新篇）、
底部遠山可用我提供的 svg/decor/mountains-wide.svg。
禁止卡片牆與 stats。直角、淡墨線、朱砂只用於主 CTA 文字或小印。
```

## 3) 批量出圖

```
使用 prompts/image-generation.md 的通用前綴與負向，
為人生十階段各產一則 Midjourney 提示（直幅 3:4），
每則註明建議檔名（stage-birth.png …）。
```

## 4) 對齊現有程式

```
這是 Vite React 專案《江湖一生》。請只擴 data/events，不改引擎隨機為 Math.random。
屬性鍵：bone/root→根骨、insight→悟性、luck→福緣、charm→魅力、courage→膽識
（若附件有 interfaces，以附件為準）。
```

## 5) 文案潤色

```
把下列系統腔改成批註聲腔（見 event-voice.md）：
「選擇：A 攻擊 B 逃跑 C 交談。獲得金幣+20」
```
