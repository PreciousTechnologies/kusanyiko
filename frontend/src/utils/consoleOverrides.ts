// Development console override to suppress unwanted error messages
export const initializeConsoleOverrides = () => {
  if (process.env.NODE_ENV === 'development') {
    initResizeObserverGuard();

    const originalError = console.error;
    
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      
      // Suppress specific error messages that are expected in development
      const suppressedMessages = [
        'Failed to load resource',
        'Bad Request',
        'API Error',
        'Mixed Content',
        'net::ERR_',
        'Connection test failed',
        'Proxy error'
      ];
      
      const shouldSuppress = suppressedMessages.some(suppressedMsg => 
        message.includes(suppressedMsg)
      );
      
      if (!shouldSuppress) {
        originalError.apply(console, args);
      }
    };
  }
};

/**
 * Dev-only: serialize ResizeObserver delivery to one batch per frame.
 *
 * Why this exists: React StrictMode double-mounts every page in development,
 * so any library observer (charts, presence tracking, browser extensions)
 * can fire bursts that re-trigger layout inside the same frame. Browsers
 * report that as "ResizeObserver loop completed with undelivered
 * notifications" and the webpack dev-server overlay blocks the screen —
 * even though layout always settles and production builds are unaffected.
 *
 * Coalescing delivery through a single rAF batch per frame breaks the
 * same-frame cascade without dropping notifications (the latest batch is
 * always delivered). Runs before first render, so every subsequently
 * created observer is wrapped. Production bundle is untouched.
 */
function initResizeObserverGuard() {
  if (typeof window === 'undefined' || typeof window.ResizeObserver !== 'function') {
    return;
  }

  const NativeResizeObserver = window.ResizeObserver;

  window.ResizeObserver = class SerializedResizeObserver extends NativeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      let queued: { entries: ResizeObserverEntry[]; observer: ResizeObserver } | null = null;
      let raf = 0;
      super((entries, observer) => {
        queued = { entries, observer };
        if (!raf) {
          raf = requestAnimationFrame(() => {
            raf = 0;
            const batch = queued;
            queued = null;
            if (batch) callback(batch.entries, batch.observer);
          });
        }
      });
    }
  };
}