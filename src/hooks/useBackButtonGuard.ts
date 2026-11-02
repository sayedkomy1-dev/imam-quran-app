import { useCallback, useEffect, useRef, useState } from 'react';

export interface BackButtonGuardOptions {
  /** Whether an internal modal or sub-screen is currently open that can be closed on Back */
  canGoBackInternally: boolean;
  /** Callback to close the active modal or navigate to the previous internal tab/step */
  onInternalBack?: () => void;
  onBackAction?: () => void;
}

export function useBackButtonGuard({
  canGoBackInternally,
  onInternalBack,
  onBackAction,
}: BackButtonGuardOptions) {
  const effectiveBackFn = onInternalBack || onBackAction || (() => {});
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const canGoBackRef = useRef(canGoBackInternally);
  const onInternalBackRef = useRef(effectiveBackFn);
  const allowNextPopRef = useRef(false);

  useEffect(() => {
    canGoBackRef.current = canGoBackInternally;
  }, [canGoBackInternally]);

  useEffect(() => {
    onInternalBackRef.current = effectiveBackFn;
  }, [effectiveBackFn]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Push a guard state onto history so hardware Back triggers popstate instead of immediately leaving
    try {
      window.history.pushState({ imamGuard: true, ts: Date.now() }, '', window.location.href);
    } catch {
      // ignore history errors in restricted environments
    }

    const handlePopState = () => {
      if (allowNextPopRef.current) {
        allowNextPopRef.current = false;
        return;
      }

      if (canGoBackRef.current) {
        // Close open modal or return to previous internal tab
        onInternalBackRef.current();
        try {
          window.history.pushState({ imamGuard: true, ts: Date.now() }, '', window.location.href);
        } catch {
          // ignore
        }
      } else {
        // At root of portal -> show exit confirmation modal
        setShowExitConfirmModal(true);
        try {
          window.history.pushState({ imamGuard: true, ts: Date.now() }, '', window.location.href);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleStayInApp = useCallback(() => {
    setShowExitConfirmModal(false);
    try {
      window.history.pushState({ imamGuard: true, ts: Date.now() }, '', window.location.href);
    } catch {
      // ignore
    }
  }, []);

  const handleConfirmExit = useCallback(() => {
    setShowExitConfirmModal(false);
    allowNextPopRef.current = true;
    try {
      window.history.go(-2);
    } catch {
      window.close();
    }
  }, []);

  return {
    showExitConfirmModal,
    showExitConfirm: showExitConfirmModal,
    setShowExitConfirmModal,
    handleStayInApp,
    cancelExit: handleStayInApp,
    handleConfirmExit,
    confirmExit: handleConfirmExit,
  };
}
