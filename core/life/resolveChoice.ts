/**
 * 統一抉擇結算入口（ADR-001）
 * 目前委派 eventEngine.applyChoice；敘事覆蓋與 RuntimeView 在此匯聚，避免呼叫端分叉。
 */
import type { GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { toRuntimeView, type RuntimeEventView } from '@interfaces/eventRuntime';
import { applyChoice as applyChoiceImpl, type ResolveResult } from './eventEngine';

export type { ResolveResult };

export function viewEvent(event: GameEvent): RuntimeEventView {
  return toRuntimeView(event);
}

export function resolveChoice(
  state: LifeGameState,
  event: GameEvent,
  choiceId: string,
): ResolveResult {
  return applyChoiceImpl(state, event, choiceId);
}
