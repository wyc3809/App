type Props = {
  onStart: (seed?: number) => void;
  onContinue?: () => void;
  resumeHint?: string;
};

export function StartScreen({ onStart, onContinue, resumeHint }: Props) {
  return (
    <div className="phone">
      <header className="title-hero">
        <p className="eyebrow">Jianghu Engine™ 2.1</p>
        <h1>江湖引擎</h1>
        <p className="tagline">你不是主角，只是其中一位居民。</p>
      </header>
      <section className="panel intro-panel">
        <p>武俠世界模擬器 · 直版人生</p>
        <ul>
          <li>萬物皆由引擎推演</li>
          <li>NPC 與你共用同一套規則</li>
          <li>一切行動都會寫入歷史</li>
          <li>進度自動存檔，關閉後可延續江湖</li>
        </ul>
      </section>
      {onContinue && (
        <button type="button" className="btn-primary" onClick={onContinue}>
          延續江湖
          {resumeHint && <span className="btn-sub">{resumeHint}</span>}
        </button>
      )}
      <button type="button" className={onContinue ? 'btn-ghost' : 'btn-primary'} onClick={() => onStart()}>
        {onContinue ? '新開一局' : '踏入江湖'}
      </button>
      <button type="button" className="btn-ghost" onClick={() => onStart(42)}>
        固定種子（除錯）
      </button>
    </div>
  );
}
