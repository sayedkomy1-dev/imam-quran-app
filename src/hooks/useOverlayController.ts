import { useEffect, useState, useCallback, useId } from 'react';

// Single Global Active Overlay State Store
let currentActiveDropdownId: string | null = null;
let currentActiveModalId: string | null = null;
const listeners = new Set<() => void>();

function notifyAll() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}

/**
 * Global single-active overlay controller.
 * Opening any dropdown automatically closes any other dropdown or modal.
 * Pressing Escape, clicking outside, or scrolling closes active dropdowns.
 */
export const OverlayManager = {
  getActiveDropdownId(): string | null {
    return currentActiveDropdownId;
  },
  getActiveModalId(): string | null {
    return currentActiveModalId;
  },
  openDropdown(id: string) {
    if (currentActiveDropdownId !== id) {
      currentActiveDropdownId = id;
      notifyAll();
    }
  },
  closeDropdown(id?: string) {
    if (!id || currentActiveDropdownId === id) {
      if (currentActiveDropdownId !== null) {
        currentActiveDropdownId = null;
        notifyAll();
      }
    }
  },
  toggleDropdown(id: string) {
    if (currentActiveDropdownId === id) {
      currentActiveDropdownId = null;
    } else {
      currentActiveDropdownId = id;
    }
    notifyAll();
  },
  openModal(id: string) {
    currentActiveDropdownId = null; // Close any open dropdowns when modal opens
    currentActiveModalId = id;
    notifyAll();
  },
  closeModal(id?: string) {
    if (!id || currentActiveModalId === id) {
      if (currentActiveModalId !== null) {
        currentActiveModalId = null;
        notifyAll();
      }
    }
  },
  closeAll() {
    let changed = false;
    if (currentActiveDropdownId !== null) {
      currentActiveDropdownId = null;
      changed = true;
    }
    if (currentActiveModalId !== null) {
      currentActiveModalId = null;
      changed = true;
    }
    if (changed) notifyAll();
  },
};

// Global DOM listeners for click outside, escape, and window scroll
if (typeof window !== 'undefined') {
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') {
        if (currentActiveDropdownId !== null) {
          OverlayManager.closeDropdown();
        }
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'scroll',
    () => {
      if (currentActiveDropdownId !== null) {
        OverlayManager.closeDropdown();
      }
    },
    { capture: true, passive: true }
  );
}

/**
 * Hook to participate in the Single Active Overlay system.
 */
export function useOverlayController(customId?: string) {
  const generatedId = useId();
  const id = customId || generatedId;
  const [, setTick] = useState(0);

  useEffect(() => {
    const rerender = () => setTick((t) => t + 1);
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
    };
  }, []);

  const isOpen = currentActiveDropdownId === id;
  const open = useCallback(() => OverlayManager.openDropdown(id), [id]);
  const close = useCallback(() => OverlayManager.closeDropdown(id), [id]);
  const toggle = useCallback(() => OverlayManager.toggleDropdown(id), [id]);

  return {
    id,
    isOpen,
    open,
    close,
    toggle,
    closeAll: OverlayManager.closeAll,
    activeDropdownId: currentActiveDropdownId,
    activeModalId: currentActiveModalId,
  };
}
