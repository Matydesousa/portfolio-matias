/** Observe completed taps without taking ownership of scroll or browser zoom. */
export function observeTouchTaps(options: {
  allowed: () => boolean;
  accepts: (target: EventTarget | null) => boolean;
  tap?: (event: PointerEvent) => void;
  doubleTap?: (event: PointerEvent) => void;
}) {
  const fingers = new Set<number>();
  let start:
    | {
        id: number;
        x: number;
        y: number;
        time: number;
        target: EventTarget | null;
      }
    | undefined;
  let previous: { x: number; y: number; time: number } | undefined;
  const reset = () => {
    start = previous = undefined;
    fingers.clear();
  };
  window.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType !== 'touch') {
        previous = undefined;
        return;
      }
      fingers.add(event.pointerId);
      if (
        !event.isPrimary ||
        fingers.size !== 1 ||
        !options.allowed() ||
        !options.accepts(event.target)
      ) {
        start = previous = undefined;
        return;
      }
      start = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
        target: event.target,
      };
    },
    { passive: true },
  );
  window.addEventListener(
    'pointermove',
    (event) => {
      if (
        start?.id === event.pointerId &&
        Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8
      )
        start = previous = undefined;
    },
    { passive: true },
  );
  window.addEventListener(
    'pointerup',
    (event) => {
      fingers.delete(event.pointerId);
      if (start?.id !== event.pointerId) return;
      const down = start;
      start = undefined;
      const now = performance.now();
      if (
        fingers.size ||
        !options.allowed() ||
        !options.accepts(event.target) ||
        event.target !== down.target ||
        now - down.time > 450 ||
        Math.hypot(event.clientX - down.x, event.clientY - down.y) > 8
      ) {
        previous = undefined;
        return;
      }
      options.tap?.(event);
      if (!options.doubleTap) return;
      if (
        previous &&
        now - previous.time <= 420 &&
        Math.hypot(event.clientX - previous.x, event.clientY - previous.y) <= 28
      ) {
        previous = undefined;
        options.doubleTap(event);
      } else previous = { x: event.clientX, y: event.clientY, time: now };
    },
    { passive: true },
  );
  window.addEventListener('pointercancel', reset, { passive: true });
  window.addEventListener('scroll', reset, { passive: true });
  window.addEventListener('resize', reset, { passive: true });
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', reset);
  return reset;
}
