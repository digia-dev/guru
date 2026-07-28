import { useRef, useCallback } from 'react';

export function useAutoSave(saveFn: () => Promise<void>, delay: number = 5000) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const schedule = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) {
        schedule();
        return;
      }
      isSavingRef.current = true;
      try {
        await saveFn();
      } finally {
        isSavingRef.current = false;
      }
    }, delay);
  }, [saveFn, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    isSavingRef.current = true;
    try {
      await saveFn();
    } finally {
      isSavingRef.current = false;
    }
  }, [saveFn]);

  return { schedule, cancel, saveNow, isSaving: isSavingRef };
}
