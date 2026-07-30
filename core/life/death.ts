import type { LifeGameState } from '@interfaces/lifeEngine';

/** 統一寫入死因，供墓誌與年譜使用 */
export function recordDeath(state: LifeGameState, cause: string): void {
  const text = cause.trim() || '江湖路斷，墨盡人散。';
  state.character.flags.death_cause = text;
  state.character.alive = false;
  if (state.character.health > 0) {
    /* keep residual hp for combat loss flavor unless already zeroed */
  }
}

export function deathCauseOf(state: LifeGameState): string | undefined {
  const v = state.character.flags.death_cause;
  return typeof v === 'string' && v.length ? v : undefined;
}
