import { useCallback, useEffect, useState } from 'react';
import { useLifeStore } from './store/lifeStore';
import { LifeGameScreen } from './components/LifeGameScreen';
import { LifeStartGate, LifeStartScreen } from './components/LifeStartScreen';
import { resetLifeSave } from './store/lifeStore';

export default function App() {
  const state = useLifeStore((s) => s.state);
  const newLife = useLifeStore((s) => s.newLife);
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

  const handleStart = useCallback(
    async (seed?: number) => {
      await resetLifeSave();
      newLife(seed);
    },
    [newLife],
  );

  const handleContinue = useCallback(async () => {
    const ok = await continueLife();
    if (!ok) setCanResume(false);
  }, [continueLife]);

  if (state) {
    return <LifeGameScreen state={state} />;
  }

  return (
    <>
      <LifeStartGate onReady={onReady} />
      <LifeStartScreen
        onStart={(seed) => void handleStart(seed)}
        onContinue={() => void handleContinue()}
        resumeHint={canResume ? resumeHint : undefined}
      />
    </>
  );
}
