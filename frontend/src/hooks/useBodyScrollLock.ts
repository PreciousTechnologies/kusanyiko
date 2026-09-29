import { useEffect } from 'react';

// Locks body scroll while ANY modal is open. Reference-counted so nested
// or overlapping modals (e.g. dialog over a form modal) only unlock when
// the last one closes. Without this, the page behind a modal keeps
// scrolling on desktop wheels and mobile touch — the "popup scrolls too"
// complaint.
//
// Usage: useBodyScrollLock(isOpen) — pass a boolean, arrays not needed.
let lockCount = 0;
let originalOverflow = '';

function lock() {
  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow;
  }
}

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return () => {
      unlock();
    };
  }, [active]);
}

export default useBodyScrollLock;
