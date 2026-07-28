/** 武學顯示名（原創，非現代 IP） */
export const SKILL_NAMES: Record<string, string> = {
  art_stone_palm: '裂石殘掌',
  art_bridge_step: '斷橋步',
  art_tomb_sword: '無銘劍意',
  art_lake_breath: '寒湖吐納',
  art_rain_sword: '聽雨劍意',
  art_nine_shadow: '九影迷踪步',
  art_cold_palm: '寒霜掌',
  art_iron_body: '鐵布衫（入門）',
  art_moon_sword: '弄月劍法',
  art_void_breath: '空冥吐納',
  art_river_fist: '長河拳',
  art_silk_hand: '柔絲手',
  art_thunder_blade: '驚雷刀',
};

export function skillLabel(id: string): string {
  return SKILL_NAMES[id] ?? id.replace(/^art_/, '').replace(/_/g, '·');
}
