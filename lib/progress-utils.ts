// Utility functions for sequential progress operations

export interface ProgressState {
  current: number;
  total: number;
  currentItem: string;
  stage: string;
  successCount: number;
  errorCount: number;
  errors: string[];
}

export interface ProgressCallbacks<T = unknown> {
  setProgress: (progress: ProgressState) => void;
  setShowProgress: (show: boolean) => void;
  isCancelledRef: React.MutableRefObject<boolean>;
  onSuccess?: (item: T, index: number) => void;
  onError?: (item: T, index: number, error: string) => void;
  onComplete?: (successCount: number, errorCount: number) => void;
}

export async function executeSequentialOperation<T>(
  items: T[],
  operation: (item: T, index: number) => Promise<{ success: boolean; error?: string }>,
  getItemName: (item: T) => string,
  stageName: string,
  callbacks: ProgressCallbacks<T>
): Promise<void> {
  const { setProgress, setShowProgress, isCancelledRef, onSuccess, onError, onComplete } = callbacks;
  
  // Initialize progress
  setProgress({
    current: 0,
    total: items.length,
    currentItem: "",
    stage: stageName,
    successCount: 0,
    errorCount: 0,
    errors: []
  });
  setShowProgress(true);
  isCancelledRef.current = false;
  
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];
  
  // Process each item sequentially
  for (let i = 0; i < items.length; i++) {
    // Check if cancelled
    if (isCancelledRef.current) {
      setProgress({
        current: items.length,
        total: items.length,
        currentItem: "",
        stage: `${stageName} cancelled`,
        successCount,
        errorCount,
        errors: [...errors, `Operation cancelled after ${i} of ${items.length} items`]
      });
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        setShowProgress(false);
      }, 2000);
      
      return;
    }
    
    const item = items[i];
    const itemName = getItemName(item);
    
    // Update progress
    setProgress({
      current: i,
      total: items.length,
      currentItem: itemName,
      stage: stageName,
      successCount,
      errorCount,
      errors: [...errors]
    });
    
    try {
      const result = await operation(item, i);
      if (result.success) {
        successCount++;
        onSuccess?.(item, i);
      } else {
        errorCount++;
        const errorMessage = result.error || 'Unknown error';
        errors.push(`${itemName}: ${errorMessage}`);
        onError?.(item, i, errorMessage);
      }
    } catch (error) {
      errorCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${itemName}: ${errorMessage}`);
      onError?.(item, i, errorMessage);
    }
    
    // Small delay between operations
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Final progress update
  setProgress({
    current: items.length,
    total: items.length,
    currentItem: "",
    stage: `${stageName} complete`,
    successCount,
    errorCount,
    errors: [...errors]
  });
  
  onComplete?.(successCount, errorCount);
  
  // Auto-close popup after 2 seconds
  setTimeout(() => {
    setShowProgress(false);
  }, 2000);
}
