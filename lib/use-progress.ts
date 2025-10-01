// Shared progress state hook - NO MORE DUPLICATION!

import { useState, useRef } from 'react';
import { ProgressState } from './types';

export function useProgress() {
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    current: 0,
    total: 0,
    currentItem: "",
    stage: "",
    successCount: 0,
    errorCount: 0,
    errors: []
  });
  const isCancelledRef = useRef(false);

  const resetProgress = () => {
    setProgress({
      current: 0,
      total: 0,
      currentItem: "",
      stage: "",
      successCount: 0,
      errorCount: 0,
      errors: []
    });
    isCancelledRef.current = false;
  };

  const startProgress = (total: number, stage: string) => {
    resetProgress();
    setProgress(prev => ({ ...prev, total, stage }));
    setShowProgress(true);
  };

  const updateProgress = (current: number, total: number, currentItem: string, stage: string, successCount: number, errorCount: number, errors: string[]) => {
    setProgress(prev => ({
      ...prev,
      current,
      total,
      currentItem,
      stage,
      successCount,
      errorCount,
      errors
    }));
  };

  const completeProgress = () => {
    setShowProgress(false);
    resetProgress();
  };

  const cancelProgress = () => {
    isCancelledRef.current = true;
    setShowProgress(false);
    resetProgress();
  };

  return {
    showProgress,
    setShowProgress,
    progress,
    setProgress,
    isCancelledRef,
    startProgress,
    updateProgress,
    completeProgress,
    cancelProgress
  };
}
