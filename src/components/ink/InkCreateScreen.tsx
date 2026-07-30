import { useState } from 'react';
import { InkScrollBackdrop } from './InkDecor';
import { useLifeStore } from '../../store/lifeStore';
import { playInkTap } from '../../audio/inkAudio';

export function InkCreateScreen() {
  const newLife = useLifeStore((s) => s.newLife);
  const cancelCreate = useLifeStore((s) => s.cancelCreate);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  return (
    <div className="scroll-shell ink-enter">
      <InkScrollBackdrop variant="hero" />
      <header className="ink-hero">
        <h1 className="ink-brand" style={{ fontSize: '2.2rem' }}>
          立卷
        </h1>
        <p className="ink-tagline">出生地已定 · 千燈鎮</p>
        <p className="ink-rule" aria-hidden />
      </header>

      <section className="ink-panel">
        <label className="ink-field">
          <span>姓名</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="留空則隨機取名"
            maxLength={8}
          />
        </label>
        <label className="ink-field">
          <span>性別</span>
          <select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')}>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </label>
        <p className="ink-note">十六歲離家，屬性與福緣將於落筆時生成。</p>
      </section>

      <div className="ink-cta-stack">
        <button
          type="button"
          className="ink-btn ink-btn--primary"
          onClick={() => {
            playInkTap();
            newLife({
              name: name.trim() || undefined,
              gender,
              birthplace: '千燈鎮',
            });
          }}
        >
          落筆開卷
        </button>
        <button
          type="button"
          className="ink-btn ink-btn--ghost"
          onClick={() => {
            playInkTap();
            cancelCreate();
          }}
        >
          返回
        </button>
      </div>
    </div>
  );
}
