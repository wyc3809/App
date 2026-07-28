import { useCallback, useEffect, useState } from 'react';
import { useLifeStore, resetLifeSave } from './store/lifeStore';
import { InkPlayScreen } from './components/ink/InkPlayScreen';
import { InkStartGate, InkStartScreen } from './components/ink/InkStartScreen';

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
    return <InkPlayScreen state={state} />;
  }

  return (
    <>
      <InkStartGate onReady={onReady} />
      <InkStartScreen
        onStart={(seed) => void handleStart(seed)}
        onContinue={() => void handleContinue()}
        resumeHint={canResume ? resumeHint : undefined}
      />
    </>
  );
}
