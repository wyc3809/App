# 水墨動效片段（可直接引用）

```css
@keyframes inkFadeUp {
  from { opacity: 0; transform: translateY(10px); filter: blur(2px); }
  to   { opacity: 1; transform: translateY(0); filter: blur(0); }
}

@keyframes sealStamp {
  0%   { opacity: 0; transform: scale(1.35) rotate(-12deg); }
  45%  { opacity: 1; transform: scale(0.96) rotate(-6deg); }
  100% { opacity: 0; transform: scale(1) rotate(-8deg); }
}

@keyframes pageYear {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-8px); }
}

.ink-enter { animation: inkFadeUp 0.55s ease both; }
.seal-once { animation: sealStamp 0.9s ease forwards; }
```

原則：慢、薄、少；一次畫面最多兩種動效同時出現。
