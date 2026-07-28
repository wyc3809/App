import { useCallback, useEffect, useState } from 'react';
import { useLifeStore, resetLifeSave } from './store/lifeStore';
import { InkPlayScreen } from './components/ink/InkPlayScreen';
import { InkStartGate, InkStartScreen } from './components/ink/InkStartScreen';
import { InkCreateScreen } from './components/ink/InkCreateScreen';

export default function App() {
  const state = useLifeStore((s) => s.state);
  const creating = useLifeStore((s) => s.creating);
  const newLife = useLifeStore((s) => s.newLife);
  const beginCreate = useLifeStore((s) => s.beginCreate);
  const continueLife = useLifeStore((s) => s.continueLife);
  const bootstrap = useLifeStore((s) => s.bootstrap);
  const [canResume, setCanResume] = useState(false);
  const [resumeHint, setResumeHint] = useState<string | undefined>();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const onReady = useCallback((has: boolean, hint?: string) => {
    setCanResume(has);
    setResumeHint(hint);
  }, []);

  const handleStart = useCallback(async () => {
    await resetLifeSave();
    beginCreate();
  }, [beginCreate]);

  const handleSeed = useCallback(async () => {
    await resetLifeSave();
    newLife({ seed: 42, birthplace: '千燈鎮', name: '沈雲舟' });
  }, [newLife]);

  const handleContinue = useCallback(async () => {
    const ok = await continueLife();
    if (!ok) setCanResume(false);
  }, [continueLife]);

  if (state) {
    return <InkPlayScreen state={state} />;
  }

  if (creating) {
    return <InkCreateScreen />;
  }

  return (
    <>
      <InkStartGate onReady={onReady} />
      <InkStartScreen
        onStart={() => void handleStart()}
        onContinue={() => void handleContinue()}
        resumeHint={canResume ? resumeHint : undefined}
        onSeedDebug={() => void handleSeed()}
      />
    </>
  );
}
