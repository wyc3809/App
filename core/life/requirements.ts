import type { EventRequirement, LifeGameState, NatureAttr } from '@interfaces/lifeEngine';
import { ensureNature } from './nature';

function flagMatch(
  flags: Record<string, boolean | number | string>,
  expected: Record<string, boolean | number | string>,
): boolean {
  for (const [k, v] of Object.entries(expected)) {
    if (flags[k] !== v) return false;
  }
  return true;
}

export function meetsRequirements(
  state: LifeGameState,
  req: EventRequirement | undefined,
  eventId?: string,
): boolean {
  if (!req) return true;
  const c = state.character;

  if (req.minAge !== undefined && c.age < req.minAge) return false;
  if (req.maxAge !== undefined && c.age > req.maxAge) return false;
  if (req.minMoney !== undefined && c.money < req.minMoney) return false;
  if (req.minHealth !== undefined && c.health < req.minHealth) return false;
  if (req.minMartial !== undefined && c.martial < req.minMartial) return false;
  if (req.minReputation !== undefined && c.reputation < req.minReputation) return false;

  if (req.minAttrs) {
    for (const [k, v] of Object.entries(req.minAttrs)) {
      const key = k as keyof typeof c.attributes;
      if ((c.attributes[key] ?? 0) < (v ?? 0)) return false;
    }
  }
  if (req.maxAttrs) {
    for (const [k, v] of Object.entries(req.maxAttrs)) {
      const key = k as keyof typeof c.attributes;
      if ((c.attributes[key] ?? 0) > (v ?? 0)) return false;
    }
  }

  const nature = ensureNature(c);
  if (req.minNature) {
    for (const [k, v] of Object.entries(req.minNature)) {
      if ((nature[k as NatureAttr] ?? 0) < (v ?? 0)) return false;
    }
  }
  if (req.maxNature) {
    for (const [k, v] of Object.entries(req.maxNature)) {
      if ((nature[k as NatureAttr] ?? 0) > (v ?? 0)) return false;
    }
  }

  if (req.flags && !flagMatch(c.flags, req.flags)) return false;
  if (req.notFlags) {
    for (const f of req.notFlags) {
      if (c.flags[f]) return false;
    }
  }

  if (req.sectRequired && !c.sectId) return false;
  if (req.noSect && c.sectId) return false;

  if (req.once && eventId && state.completedEvents.includes(eventId)) return false;

  if (req.tags?.length) {
    const hasAll = req.tags.every((t) => c.flags[`tag_${t}`] || state.worldFlags[`tag_${t}`]);
    if (!hasAll) return false;
  }
  if (req.anyTag?.length) {
    const hasAny = req.anyTag.some((t) => c.flags[`tag_${t}`] || state.worldFlags[`tag_${t}`]);
    if (!hasAny) return false;
  }

  return true;
}
