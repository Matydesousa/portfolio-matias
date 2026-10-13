/** Reversible depth with brief damping; native scrolling stays untouched. */
export function initializeScrollDepth() {
  const root = document.documentElement;
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(
      '.intro > p, .intro > h1, .intro > button, .back-link, .case-header > p, .case-header > h1, .case-header > .tags, .case-actions, .list-heading, .repository-list > li, .about > h2, .about > p, .about-stack > h3, .stack-groups > div, .about > details > summary, .experience-list, .contact > div, .case-image, .case-body > h2, .case-body > p, .gallery-heading, .project-features > div, .workflow-list > li, .project-example, .gallery-grid > li, .decision-list > li, .project-ribbon, .site-footer',
    ),
  );
  const targets = new Map<
    HTMLElement,
    { top: number; height: number; visible: boolean; progress: number }
  >();
  let enabled = false;
  let frame = 0;
  let measureNext = true;
  let documentHeight = 0;
  let lastTime = 0;
  let lastScroll = scrollY;
  let gesture: { element: HTMLElement; pointerId: number } | null = null;

  elements.forEach((element, index) => {
    element.classList.add('motion-reveal');
    element.style.setProperty('--depth-side', index % 2 ? '1' : '-1');
    targets.set(element, { top: 0, height: 0, visible: false, progress: -1 });
  });

  function render(
    element: HTMLElement,
    state: { progress: number },
    progress: number,
  ) {
    if (state.progress === progress) return;
    element.classList.toggle('is-revealed', progress === 1);
    if (progress === 1) element.style.removeProperty('--depth-progress');
    else {
      // The same curve runs backwards when scrolling up.
      element.style.setProperty(
        '--depth-progress',
        String((1 - progress) ** 2 * (1 + 2 * progress)),
      );
    }
    state.progress = progress;
  }

  function available() {
    return (
      enabled && !document.hidden && !document.querySelector('dialog[open]')
    );
  }

  function paint(now = performance.now()) {
    frame = 0;
    const active = available();
    root.dataset.scrollDepth = active ? 'on' : 'off';
    if (!active || !targets.size) return;

    const measuring = measureNext;
    const jump = Math.abs(scrollY - lastScroll) > innerHeight * 0.75;
    const delta = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    const blend = 1 - Math.exp(-delta / 0.065);
    lastTime = now;
    lastScroll = scrollY;

    if (measureNext) {
      // Measure layout without transforms, avoiding feedback from the entrance.
      root.dataset.scrollMeasuring = '';
      targets.forEach((state, element) => {
        const bounds = element.getBoundingClientRect();
        state.top = bounds.top + scrollY;
        state.height = bounds.height;
        // Chromium retains layout boxes for closed details content.
        const collapsed = element.closest('details:not([open])');
        state.visible =
          element.getClientRects().length > 0 &&
          (!collapsed ||
            element === collapsed.querySelector(':scope > summary'));
      });
      documentHeight = root.scrollHeight;
      delete root.dataset.scrollMeasuring;
      measureNext = false;
    }

    const start = innerHeight * 0.98;
    const travel = Math.min(360, innerHeight * 0.4);
    const endOfScroll = Math.max(0, documentHeight - innerHeight);
    let settling = false;
    targets.forEach((state, element) => {
      if (!state.visible) return;
      // Keep the hit target stable between pointerdown and the native click.
      if (gesture?.element === element) return;
      const beginsAt = state.top - start;
      // Fit the final blocks into the available scroll, in both directions.
      const distance = Math.max(1, Math.min(travel, endOfScroll - beginsAt));
      let progress = Math.max(0, Math.min(1, (scrollY - beginsAt) / distance));
      const focused = element.contains(document.activeElement);
      if (focused) {
        progress = 1;
      }
      const onScreen =
        state.top - scrollY < innerHeight + 80 &&
        state.top + state.height - scrollY > -80;
      const immediate =
        measuring || jump || focused || !onScreen || state.progress < 0;
      const eased = immediate
        ? progress
        : state.progress + (progress - state.progress) * blend;
      if (Math.abs(eased - progress) < 0.0005) {
        render(element, state, progress);
        element.classList.remove('is-depth-moving');
      } else {
        render(element, state, eased);
        element.classList.add('is-depth-moving');
        settling = true;
      }
    });
    root.toggleAttribute('data-scroll-settling', settling);
    if (settling) frame = requestAnimationFrame(paint);
  }

  function schedule(measure = false) {
    measureNext ||= measure;
    if (!frame && available()) frame = requestAnimationFrame(paint);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    root.dataset.scrollDepth = 'off';
    root.removeAttribute('data-scroll-settling');
    gesture = null;
    elements.forEach((element) => element.classList.remove('is-depth-moving'));
  }

  window.addEventListener('scroll', () => schedule(), { passive: true });
  window.addEventListener('resize', () => schedule(true), { passive: true });
  window.addEventListener('pageshow', () => schedule(true));
  document.fonts.ready.then(() => schedule(true));
  new ResizeObserver(() => schedule(true)).observe(document.body);
  document.addEventListener('toggle', () => schedule(true), true);
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      const element = (event.target as Element).closest<HTMLElement>(
        '.motion-reveal',
      );
      if (element && targets.has(element)) {
        gesture = { element, pointerId: event.pointerId };
      }
    },
    true,
  );
  const release = (event: PointerEvent) => {
    if (gesture?.pointerId !== event.pointerId) return;
    gesture = null;
    schedule();
  };
  document.addEventListener('pointerup', release, true);
  document.addEventListener('pointercancel', release, true);
  window.addEventListener('blur', () => {
    gesture = null;
    schedule();
  });
  document.addEventListener('focusin', (event) => {
    const element = (event.target as Element).closest<HTMLElement>(
      '.motion-reveal',
    );
    const state = element && targets.get(element);
    if (element && state && gesture?.element !== element)
      render(element, state, 1);
  });
  document.addEventListener('focusout', () => schedule());
  document.querySelectorAll('dialog').forEach((dialog) => {
    new MutationObserver(() => {
      if (dialog.open) stop();
      else schedule(true);
    }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else schedule(true);
  });

  return {
    configure(active: boolean) {
      enabled = active;
      stop();
      if (!active) {
        targets.forEach((state, element) => render(element, state, 1));
      } else {
        measureNext = true;
        paint();
      }
    },
  };
}
