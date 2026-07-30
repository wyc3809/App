import { playInkTap } from '../audio/inkAudio';

const PRESS_SEL = [
  'button',
  '[role="button"]',
  '.ink-btn',
  '.ink-choice',
  '.ink-tab',
  '.ink-practice-btn',
  '.ink-icon-btn',
  '.ink-chronicle-toggle',
  '.ink-combat-action',
  '.ink-combat-filter',
  '.ink-combat-detail-btn',
  '.ink-combat-log-toggle',
].join(',');

const PRESSED = 'is-pressed';

function findPressable(el: EventTarget | null): HTMLElement | null {
  if (!(el instanceof Element)) return null;
  const hit = el.closest(PRESS_SEL);
  if (!(hit instanceof HTMLElement)) return null;
  if (hit.hasAttribute('disabled')) return null;
  if (hit.getAttribute('aria-disabled') === 'true') return null;
  if (hit instanceof HTMLButtonElement && hit.disabled) return null;
  return hit;
}

/**
 * 觸控／滑鼠共用按壓態：mobile 上 :active 常失效，且入場／脈衝動畫會鎖住 transform。
 * 在 pointerdown 加 .is-pressed，pointerup／cancel／離開時移除。
 */
export function installPressFeedback(): () => void {
  if (typeof document === 'undefined') return () => {};

  let current: HTMLElement | null = null;
  let pointerId: number | null = null;

  const clear = () => {
    if (current) {
      current.classList.remove(PRESSED);
      current = null;
    }
    pointerId = null;
  };

  const onDown = (e: PointerEvent) => {
    if (e.button != null && e.button !== 0) return;
    const target = findPressable(e.target);
    if (!target) return;
    clear();
    current = target;
    pointerId = e.pointerId;
    target.classList.add(PRESSED);
    try {
      target.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    playInkTap();
  };

  const onUp = (e: PointerEvent) => {
    if (pointerId != null && e.pointerId !== pointerId) return;
    clear();
  };

  const onCancel = (e: PointerEvent) => {
    if (pointerId != null && e.pointerId !== pointerId) return;
    clear();
  };

  document.addEventListener('pointerdown', onDown, { capture: true, passive: true });
  document.addEventListener('pointerup', onUp, { capture: true, passive: true });
  document.addEventListener('pointercancel', onCancel, { capture: true, passive: true });
  document.addEventListener('lostpointercapture', clear);
  window.addEventListener('blur', clear);

  return () => {
    clear();
    document.removeEventListener('pointerdown', onDown, true);
    document.removeEventListener('pointerup', onUp, true);
    document.removeEventListener('pointercancel', onCancel, true);
    document.removeEventListener('lostpointercapture', clear);
    window.removeEventListener('blur', clear);
  };
}
