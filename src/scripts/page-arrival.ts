/** Orbit until engagement or five visible seconds, using the existing scene loop. */
export function createPageArrival(canvas: HTMLCanvasElement) {
  const animations = new Set<Animation>();
  let started = false;
  let engaged = false;
  let waiting = false;
  let assemblyTrigger: Event | null = null;
  let assemblingSince: number | null = null;
  let waitingSince: number | null = null;
  let waitingRemaining = 5000;
  const duration = 1800;

  function finish() {
    waiting = false;
    waitingSince = null;
    assemblingSince = null;
    if (canvas.dataset.assembly) canvas.dataset.assembly = 'complete';
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  }

  function engage(event?: Event, now = performance.now()) {
    engaged = true;
    animations.forEach((animation) => animation.cancel());
    animations.clear();
    if (!waiting) return;
    assemblyTrigger = event ?? null;
    waiting = false;
    waitingSince = null;
    assemblingSince = now;
    canvas.dataset.assembly = 'running';
  }

  window.addEventListener('scroll', engage, { passive: true });
  window.addEventListener('wheel', engage, { passive: true });
  window.addEventListener('pagehide', finish);
  document.addEventListener('pointerdown', engage, true);
  document.addEventListener('click', engage, true);
  document.addEventListener('keydown', engage, true);
  document.addEventListener('visibilitychange', () => {
    if (!waiting) return;
    if (document.hidden && waitingSince !== null) {
      waitingRemaining = Math.max(
        0,
        waitingRemaining - (performance.now() - waitingSince),
      );
      waitingSince = null;
    } else if (!document.hidden && waitingSince === null) {
      waitingSince = performance.now();
    }
  });

  return {
    finish,
    isAssemblyTrigger(event: Event) {
      return event === assemblyTrigger;
    },
    get assembling() {
      return assemblingSince !== null;
    },
    progress(now: number) {
      if (waiting) {
        if (waitingSince === null || now - waitingSince < waitingRemaining)
          return 0;
        engage(undefined, waitingSince + waitingRemaining);
      }
      if (assemblingSince === null) return 1;
      const progress = Math.min(
        1,
        Math.max(0, (now - assemblingSince) / duration),
      );
      if (progress === 1) {
        assemblingSince = null;
        canvas.dataset.assembly = 'complete';
      }
      return progress;
    },
    start(allowed: boolean, sculptureVisible: boolean) {
      if (started) return;
      started = true;
      if (!allowed || scrollY > 64 || document.querySelector('dialog[open]'))
        return;
      if (sculptureVisible) {
        waiting = true;
        waitingSince = document.hidden ? null : performance.now();
        canvas.dataset.assembly = 'waiting';
        if (engaged) engage();
      }
      // A background tab keeps its pending cloud, without running text animations.
      if (document.hidden) return;
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.intro-description, .availability, .intro > .tour-trigger, .list-heading, .repository-list > li:first-child, .case-summary, .case-header > .tags, .case-actions, .not-found > p, .not-found > h1, .not-found > a',
        ),
      ).filter((element) => {
        const bounds = element.getBoundingClientRect();
        return (
          bounds.height > 0 &&
          bounds.top >= 0 &&
          bounds.bottom <= innerHeight &&
          (!element.classList.contains('motion-reveal') ||
            element.classList.contains('is-revealed'))
        );
      });
      elements.forEach((element, index) => {
        // Interactive targets never shift during a press/click.
        const interactive =
          element.matches('a, button') ||
          element.querySelector('a, button, summary');
        const animation = element.animate(
          [
            { opacity: 0.72, translate: interactive ? '0 0' : '0 8px' },
            { opacity: 1, translate: '0 0' },
          ],
          {
            duration: 420,
            delay: Math.min(index * 45, 180),
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'backwards',
          },
        );
        animation.id = 'page-arrival';
        animations.add(animation);
        animation.addEventListener(
          'finish',
          () => animations.delete(animation),
          { once: true },
        );
      });
    },
  };
}
