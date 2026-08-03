/** 宣紙遠山 + 墨漬 + 竹角（素材包 SVG） */
import type { InkPlace, InkSeason } from './sceneVariants';
import { INK_DECOR } from '../../ui/inkAssets';

export function InkScrollBackdrop({
  variant = 'play',
  quiet = false,
  season,
  place,
  omen = false,
}: {
  variant?: 'hero' | 'play';
  quiet?: boolean;
  season?: InkSeason;
  place?: InkPlace;
  omen?: boolean;
}) {
  const scene = [
    season ? `ink-backdrop--${season}` : '',
    place ? `ink-backdrop--${place}` : '',
    omen ? 'ink-backdrop--omen' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`ink-backdrop ink-backdrop--${variant}${quiet ? ' ink-backdrop--quiet' : ''}${scene ? ` ${scene}` : ''}`}
      aria-hidden
    >
      <img className="ink-mountains-img" src={INK_DECOR.mountains()} alt="" draggable={false} />
      {variant === 'hero' && (
        <img className="ink-boat-img" src={INK_DECOR.boat()} alt="" draggable={false} />
      )}
      <img className="ink-blots-img" src={INK_DECOR.blots()} alt="" draggable={false} />
      <img className="ink-bamboo-img" src={INK_DECOR.bamboo()} alt="" draggable={false} />
      <div className="ink-mist-layer" />
      <div className="ink-mist-layer ink-mist-layer--soft" />
      <div className="ink-brush-sweep" />
      <div className="ink-paper-edge" />
    </div>
  );
}

export function InkSealStamp({
  text,
  onDone,
}: {
  text: string;
  onDone?: () => void;
}) {
  return (
    <div className="ink-seal-overlay" onAnimationEnd={() => onDone?.()} aria-live="polite">
      <span className="ink-seal-stamp">{text}</span>
    </div>
  );
}

/** 結果匣角印／題簽裝飾 */
export function InkResultSeal({ text = '定' }: { text?: string }) {
  return (
    <span className="ink-result-seal" aria-hidden>
      {text}
    </span>
  );
}

/** 事件橫幅（水墨 900×260） */
export function InkEventBanner({ src, alt = '' }: { src: string; alt?: string }) {
  return (
    <div className="ink-event-banner">
      <img src={src} alt={alt} draggable={false} />
    </div>
  );
}
