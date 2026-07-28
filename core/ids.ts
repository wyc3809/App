import { getRng } from './random';

let idCounter = 0;

function nextSuffix(): string {
  idCounter += 1;
  return idCounter.toString(36).padStart(6, '0');
}

export function resetIdCounter(n = 0): void {
  idCounter = n;
}

export const ids = {
  character: () => `CHR_${nextSuffix()}`,
  city: () => `CITY_${nextSuffix()}`,
  faction: () => `FAC_${nextSuffix()}`,
  item: () => `ITM_${nextSuffix()}`,
  skill: () => `SKL_${nextSuffix()}`,
  quest: () => `QST_${nextSuffix()}`,
  rumor: () => `RMR_${nextSuffix()}`,
  event: () => `EVT_${nextSuffix()}`,
  history: () => `HIS_${nextSuffix()}`,
  memory: () => `MEM_${nextSuffix()}`,
};

export function randomChineseName(): string {
  const rng = getRng();
  const surnames = ['李', '王', '張', '劉', '陳', '楊', '趙', '黃', '周', '吳', '徐', '孫', '馬', '朱', '胡', '林', '郭', '何', '高', '羅'];
  const given = ['無名', '青雲', '秋水', '長風', '明月', '鐵手', '如雪', '天涯', '孤鴻', '凌霄', '忘機', '承影', '聽雨', '斷浪', '問天'];
  return rng.pick(surnames) + rng.pick(given);
}
