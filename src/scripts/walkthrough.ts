import type { TourStop } from '../data/walkthroughs';
import { getUI, documentLocale } from '../i18n/ui';

/** A guided visit to real DOM content, activated only by the visitor. */
export function initializeWalkthrough() {
  const t = getUI(documentLocale());
  const dialog = document.querySelector<HTMLDialogElement>('.page-tour');
  if (!dialog) return;
  const stops = (JSON.parse(dialog.dataset.stops || '[]') as TourStop[]).filter(
    (stop) => document.querySelector(stop.target),
  );
  if (!stops.length) return;
  const card = dialog.querySelector<HTMLElement>('.tour-card')!;
  const countdown = dialog.querySelector<HTMLElement>('.tour-countdown-fill')!;
  const spotlight = dialog.querySelector<HTMLElement>('.tour-spotlight')!;
  const heading = dialog.querySelector<HTMLElement>('#tour-title')!;
  const message = dialog.querySelector<HTMLElement>('#tour-message')!;
  const play = dialog.querySelector<HTMLButtonElement>('.tour-play')!;
  const previous = dialog.querySelector<HTMLButtonElement>('.tour-previous')!;
  const forward = dialog.querySelector<HTMLButtonElement>('.tour-forward')!;
  const next = dialog.querySelector<HTMLButtonElement>('.tour-next')!;
  const navigation = dialog.querySelector<HTMLElement>('.tour-navigation')!;
  const close = dialog.querySelector<HTMLButtonElement>('.tour-close')!;
  const follow = dialog.querySelector<HTMLAnchorElement>('.tour-follow')!;
  const linkSlot = dialog.querySelector<HTMLElement>('.tour-link-slot')!;
  const copy = dialog.querySelector<HTMLElement>('.tour-copy')!;
  const connector = dialog.querySelector<SVGPathElement>(
    '.tour-connector path',
  )!;
  const endpoint = dialog.querySelector<SVGCircleElement>(
    '.tour-connector circle',
  )!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const openedDetails = new Set<HTMLDetailsElement>();
  const scrollSpace = document.createElement('div');
  scrollSpace.className = 'tour-scroll-space';
  scrollSpace.setAttribute('aria-hidden', 'true');
  let index = 0;
  let target: HTMLElement | null = null;
  let focus: HTMLElement | null = null;
  let playing = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let countdownAnimation: Animation | undefined;
  let readingDuration = 0;
  let remainingTime = 0;
  let readingStartedAt = 0;
  let readingActive = false;
  let frame = 0;
  let scrollFrame = 0;
  let scrollVersion = 0;
  let travelling = false;
  interface Geometry {
    x: number;
    y: number;
    width: number;
    height: number;
    cardX: number;
    cardY: number;
    cardWidth: number;
    cardHeight: number;
    placement: string;
  }
  let painted: Geometry | undefined;
  let fitted: HTMLElement | null = null;
  let touchY = 0;
  const motionAllowed = () =>
    !reduced.matches && document.documentElement.dataset.motion !== 'off';

  function stopReading() {
    clearTimeout(timer);
    if (readingActive)
      remainingTime = Math.max(
        0,
        remainingTime - (performance.now() - readingStartedAt),
      );
    readingActive = false;
    countdownAnimation?.cancel();
    countdownAnimation = undefined;
    countdown.style.transform = `scaleX(${readingDuration ? remainingTime / readingDuration : 1})`;
  }

  function resetReading() {
    stopReading();
    readingDuration = 0;
    remainingTime = 0;
    countdown.style.transform = 'scaleX(1)';
  }

  function pause() {
    stopReading();
    playing = false;
    dialog!.dataset.playing = 'false';
    play.textContent = index === stops.length - 1 ? t.repeat : t.resume;
    play.setAttribute('aria-pressed', 'false');
  }

  function schedule(resume = false) {
    stopReading();
    if (!playing || !dialog!.open || travelling || document.hidden) return;
    // Reading starts after the camera has arrived, with extra time for long copy.
    const words = `${heading.textContent} ${message.textContent}`
      .trim()
      .split(/\s+/).length;
    if (!resume || !readingDuration) {
      readingDuration = Math.max(8500, words * 340 + 2500);
      remainingTime = readingDuration;
    }
    dialog!.dataset.readingTime = String(readingDuration);
    readingStartedAt = performance.now();
    readingActive = true;
    const fraction = remainingTime / readingDuration;
    countdown.style.transform = `scaleX(${fraction})`;
    countdownAnimation = countdown.animate(
      [{ transform: `scaleX(${fraction})` }, { transform: 'scaleX(0)' }],
      {
        duration: remainingTime,
        easing: motionAllowed()
          ? 'linear'
          : `steps(${Math.max(1, Math.ceil(remainingTime / 1000))}, end)`,
        fill: 'forwards',
      },
    );
    timer = setTimeout(() => {
      readingActive = false;
      remainingTime = 0;
      countdownAnimation?.cancel();
      countdownAnimation = undefined;
      countdown.style.transform = 'scaleX(0)';
      if (index === stops.length - 1) {
        pause();
        return;
      }
      visit(index + 1);
    }, remainingTime);
  }

  function restoreFocus() {
    if (!fitted) return;
    fitted.classList.remove('tour-focus-image', 'tour-focus-window');
    fitted.style.removeProperty('--tour-focus-width');
    fitted.style.removeProperty('--tour-focus-height');
    fitted.scrollTop = 0;
    fitted = null;
    spotlight.removeAttribute('tabindex');
    spotlight.removeAttribute('role');
    spotlight.removeAttribute('aria-label');
    spotlight.setAttribute('aria-hidden', 'true');
  }

  function fitFocus() {
    restoreFocus();
    // Keep the homepage's framing; project content must be framed in full.
    if (!focus || !target?.closest('.case-main')) return;
    const viewportWidth = window.visualViewport?.width || innerWidth;
    const viewportHeight = Math.min(
      window.visualViewport?.height || innerHeight,
      navigation.getBoundingClientRect().top - 12,
    );
    const clearance = navigationClearance();
    dialog!.style.setProperty(
      '--tour-card-height',
      `${Math.max(0, viewportHeight - 24)}px`,
    );
    const bounds = focus.getBoundingClientRect();
    const cardWidth = card.offsetWidth;
    const sideWidth = viewportWidth - 12 - bounds.left - cardWidth - 32;
    const beside =
      viewportWidth - bounds.right >= cardWidth + 32 ||
      bounds.left >= cardWidth + 44;
    const image = focus.matches('img')
      ? (focus as HTMLImageElement)
      : focus.matches('.image-stage')
        ? focus.querySelector<HTMLImageElement>('img')
        : null;
    const useSide = image ? sideWidth >= 280 : beside;
    if (!useSide) {
      // On a narrow screen, share the space with the actual project content.
      dialog!.style.setProperty(
        '--tour-card-height',
        `${Math.max(220, (viewportHeight - clearance - 50) * 0.55)}px`,
      );
    }
    const stackedHeight = Math.max(
      80,
      viewportHeight - clearance - card.offsetHeight - 50,
    );
    fitted = focus;
    if (image) {
      const ratio =
        (image.naturalWidth || image.width) /
        (image.naturalHeight || image.height);
      const height = useSide ? viewportHeight - clearance - 20 : stackedHeight;
      const width = Math.min(
        bounds.width,
        useSide ? sideWidth : bounds.width,
        height * ratio,
      );
      focus.style.setProperty('--tour-focus-width', `${width}px`);
      focus.classList.add('tour-focus-image');
    } else if (
      bounds.height > (beside ? viewportHeight - clearance - 20 : stackedHeight)
    ) {
      focus.style.setProperty(
        '--tour-focus-height',
        `${beside ? viewportHeight - clearance - 20 : stackedHeight}px`,
      );
      focus.classList.add('tour-focus-window');
      spotlight.removeAttribute('aria-hidden');
      spotlight.setAttribute('role', 'region');
      spotlight.setAttribute('aria-label', t.highlighted);
      spotlight.tabIndex = 0;
    }
  }

  function navigationClearance() {
    return Math.max(
      64,
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--navigation-clearance',
        ),
      ) || 64,
    );
  }

  function measure(scrollOffset = 0): Geometry {
    const bounds = focus!.getBoundingClientRect();
    // Reserve a separate, stable area for advancing, including enlarged text.
    const viewportHeight = Math.min(
      window.visualViewport?.height || innerHeight,
      navigation.getBoundingClientRect().top - 12,
    );
    if (!target?.closest('.case-main'))
      dialog!.style.setProperty(
        '--tour-card-height',
        `${Math.max(0, viewportHeight - 24 - Math.min(180, Math.max(112, viewportHeight * 0.2)))}px`,
      );
    const viewportWidth = window.visualViewport?.width || innerWidth;
    const inset = 12;
    const targetTop = bounds.top - scrollOffset;
    if (target?.closest('.case-main')) {
      const leftPadding = focus!.matches(
        '.workflow-list > li, .decision-list > li',
      )
        ? 28
        : 8;
      const x = bounds.left - leftPadding;
      const y = targetTop - 8;
      const width = bounds.width + leftPadding + 8;
      const height = bounds.height + 16;
      const cardWidth = card.offsetWidth;
      const cardHeight = card.offsetHeight;
      let cardX = Math.max(
        inset,
        Math.min(viewportWidth - cardWidth - inset, bounds.left),
      );
      let cardY = y + height + 22;
      let placement = 'below';
      if (viewportWidth - (x + width) >= cardWidth + 24) {
        cardX = x + width + 24;
        cardY = Math.max(
          inset,
          Math.min(viewportHeight - cardHeight - inset, y),
        );
        placement = 'beside';
      } else if (x >= cardWidth + 24 + inset) {
        cardX = x - cardWidth - 24;
        cardY = Math.max(
          inset,
          Math.min(viewportHeight - cardHeight - inset, y),
        );
        placement = 'before';
      }
      return {
        x,
        y,
        width,
        height,
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        placement,
      };
    }
    const y = Math.max(inset, Math.min(viewportHeight - 40, targetTop - 8));
    let bottom = Math.max(
      y + 24,
      Math.min(viewportHeight - inset, bounds.bottom - scrollOffset + 8),
    );
    const x = Math.max(
      inset,
      Math.min(viewportWidth - inset - 24, bounds.left - 8),
    );
    const width = Math.max(
      24,
      Math.min(viewportWidth - inset, bounds.right + 8) - x,
    );
    const cardHeight = card.offsetHeight;
    const cardWidth = card.offsetWidth;
    let cardX = Math.max(
      inset,
      Math.min(viewportWidth - cardWidth - inset, bounds.left),
    );
    let cardY = bottom + 22;
    let placement = 'below';
    if (viewportWidth - bounds.right > cardWidth + 40) {
      cardX = bounds.right + 24;
      cardY = Math.max(
        inset,
        Math.min(viewportHeight - cardHeight - inset, targetTop),
      );
      placement = 'beside';
    } else if (
      cardY + cardHeight > viewportHeight - inset &&
      y - cardHeight - 22 >= inset
    ) {
      cardY = y - cardHeight - 22;
      placement = 'above';
    } else if (cardY + cardHeight > viewportHeight - inset) {
      cardY = Math.max(inset, viewportHeight - cardHeight - inset);
      // Highlight the visible part of a tall target, without drawing over copy.
      bottom = Math.max(y + 1, Math.min(bottom, cardY - 22));
    }
    return {
      x,
      y,
      width,
      height: bottom - y,
      cardX,
      cardY,
      cardWidth,
      cardHeight,
      placement,
    };
  }

  function paint(geometry: Geometry) {
    painted = geometry;
    const g = geometry;
    Object.assign(spotlight.style, {
      left: `${g.x}px`,
      top: `${g.y}px`,
      width: `${g.width}px`,
      height: `${g.height}px`,
    });
    Object.assign(card.style, { left: `${g.cardX}px`, top: `${g.cardY}px` });
    dialog!.dataset.placement = g.placement;
    const clamp = (value: number, low: number, high: number) =>
      Math.max(low, Math.min(value, high));
    let startX = g.cardX + 28,
      startY = g.cardY - 1;
    let endX = clamp(startX, g.x + 12, g.x + g.width - 12),
      endY = g.y + g.height + 2;
    if (g.placement === 'above') {
      startY = g.cardY + g.cardHeight + 1;
      endY = g.y - 2;
    } else if (g.placement === 'beside' || g.placement === 'before') {
      const before = g.placement === 'before';
      startX = before ? g.cardX + g.cardWidth + 1 : g.cardX - 1;
      startY = g.cardY + 28;
      endX = before ? g.x - 2 : g.x + g.width + 2;
      endY = clamp(startY, g.y + 12, g.y + g.height - 12);
    }
    const horizontal = g.placement === 'beside' || g.placement === 'before';
    const middleX = (startX + endX) / 2,
      middleY = (startY + endY) / 2;
    connector.setAttribute(
      'd',
      `M${startX},${startY} C${horizontal ? middleX : startX},${horizontal ? startY : middleY} ${horizontal ? middleX : endX},${horizontal ? endY : middleY} ${endX},${endY}`,
    );
    endpoint.setAttribute('cx', String(endX));
    endpoint.setAttribute('cy', String(endY));
  }

  function position() {
    if (!dialog!.open || !focus || travelling) return;
    paint(measure());
  }

  function updatePosition() {
    if (frame || !dialog!.open || travelling) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      position();
    });
  }

  function moveToTarget(animate = motionAllowed()) {
    if (!focus || !dialog!.open) return;
    resetReading();
    cancelAnimationFrame(scrollFrame);
    cancelAnimationFrame(frame);
    frame = 0;
    const version = ++scrollVersion;
    fitFocus();
    const startY = window.scrollY;
    const clearance = navigationClearance();
    const endY = Math.max(
      0,
      Math.min(
        document.documentElement.scrollHeight - innerHeight,
        startY + focus.getBoundingClientRect().top - clearance,
      ),
    );
    const destination = measure(endY - startY);
    const origin = painted || destination;
    const startTime = performance.now();
    const duration = animate ? 850 : 0;
    travelling = duration > 0;
    dialog!.dataset.travelling = String(travelling);
    const tick = (now: number) => {
      if (!dialog!.open || version !== scrollVersion) return;
      const progress = duration ? Math.min(1, (now - startTime) / duration) : 1;
      const eased =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      window.scrollTo({
        top: startY + (endY - startY) * eased,
        behavior: 'instant',
      });
      const lerp = (from: number, to: number) => from + (to - from) * eased;
      paint({
        ...destination,
        x: lerp(origin.x, destination.x),
        y: lerp(origin.y, destination.y),
        width: lerp(origin.width, destination.width),
        height: lerp(origin.height, destination.height),
        cardX: lerp(origin.cardX, destination.cardX),
        cardY: lerp(origin.cardY, destination.cardY),
      });
      if (progress < 1) scrollFrame = requestAnimationFrame(tick);
      else {
        scrollFrame = 0;
        travelling = false;
        dialog!.dataset.travelling = 'false';
        position();
        schedule();
      }
    };
    if (duration) scrollFrame = requestAnimationFrame(tick);
    else tick(startTime);
  }

  function visit(destination: number) {
    restoreFocus();
    index = Math.max(0, Math.min(destination, stops.length - 1));
    target = document.querySelector<HTMLElement>(stops[index].target);
    if (!target) return;
    focus = stops[index].focus
      ? target.querySelector<HTMLElement>(stops[index].focus!) || target
      : target;
    const details = target.closest('details');
    if (details && !details.open) {
      openedDetails.add(details);
      details.open = true;
    }
    target.classList.add('is-revealed');
    target.closest('.motion-reveal')?.classList.add('is-revealed');
    heading.textContent = stops[index].title;
    message.textContent = stops[index].message;
    copy.scrollTop = 0;
    dialog!.dataset.target = stops[index].target;
    dialog!.dataset.focus = stops[index].focus || '';
    previous.disabled = index === 0;
    forward.disabled = index === stops.length - 1;
    if (previous.disabled && document.activeElement === previous)
      forward.focus({ preventScroll: true });
    if (forward.disabled && document.activeElement === forward)
      next.focus({ preventScroll: true });
    next.textContent = index === stops.length - 1 ? t.finish : `${t.next} →`;
    const link = target.matches('a[href]')
      ? (target as HTMLAnchorElement)
      : null;
    follow.hidden = !link;
    linkSlot.hidden = !link;
    if (!link && document.activeElement === follow)
      close.focus({ preventScroll: true });
    if (link) {
      follow.href = link.href;
      follow.target = link.target;
      follow.rel = link.rel;
      follow.textContent = link.classList.contains('repository-link')
        ? `${t.openProject} ↗`
        : `${t.openRepository} ↗`;
    }
    copy.getAnimations().forEach((animation) => animation.cancel());
    if (motionAllowed())
      copy.animate(
        [
          { opacity: 0, transform: 'translateY(6px)', filter: 'blur(2px)' },
          { opacity: 1, transform: 'none', filter: 'blur(0)' },
        ],
        {
          duration: 360,
          delay: painted ? 350 : 100,
          easing: 'cubic-bezier(0.16,1,0.3,1)',
          fill: 'backwards',
        },
      );
    moveToTarget();
  }

  function manualVisit(destination: number) {
    visit(destination);
  }
  previous.addEventListener('click', () => manualVisit(index - 1));
  forward.addEventListener('click', () => manualVisit(index + 1));
  next.addEventListener('click', () => {
    if (index === stops.length - 1) dialog!.close();
    else manualVisit(index + 1);
  });
  close.addEventListener('click', () => dialog!.close());
  follow.addEventListener('click', () => dialog!.close());
  play.addEventListener('click', () => {
    if (playing) pause();
    else {
      playing = true;
      dialog!.dataset.playing = 'true';
      play.textContent = t.pause;
      play.setAttribute('aria-pressed', 'true');
      if (index === stops.length - 1) visit(0);
      else schedule(true);
    }
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      manualVisit(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('close', () => {
    pause();
    resetReading();
    cancelAnimationFrame(scrollFrame);
    cancelAnimationFrame(frame);
    scrollVersion++;
    frame = 0;
    travelling = false;
    painted = undefined;
    copy.getAnimations().forEach((animation) => animation.cancel());
    dialog!.getAnimations().forEach((animation) => animation.cancel());
    for (const details of openedDetails) details.open = false;
    openedDetails.clear();
    restoreFocus();
    scrollSpace.remove();
    let focusTarget = target;
    if (focusTarget?.closest('details:not([open])'))
      focusTarget = focusTarget.closest('details')!.querySelector('summary');
    if (focusTarget) {
      const hadTabIndex = focusTarget.hasAttribute('tabindex');
      if (!hadTabIndex) focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll: true });
      if (!hadTabIndex)
        focusTarget.addEventListener(
          'blur',
          () => focusTarget!.removeAttribute('tabindex'),
          { once: true },
        );
    }
  });
  document
    .querySelectorAll<HTMLButtonElement>('[data-tour-start]')
    .forEach((trigger) => {
      trigger.hidden = false;
      trigger.addEventListener('click', () => {
        // Let even footer targets reach the same camera position as earlier stops.
        document.body.append(scrollSpace);
        dialog!.showModal();
        if (motionAllowed())
          dialog!.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 220,
            easing: 'ease-out',
          });
        playing = true;
        dialog!.dataset.playing = 'true';
        play.textContent = t.pause;
        play.setAttribute('aria-pressed', 'true');
        visit(0);
        close.focus({ preventScroll: true });
      });
    });
  function configure() {
    if (!motionAllowed()) {
      cancelAnimationFrame(scrollFrame);
      scrollVersion++;
      copy.getAnimations().forEach((animation) => animation.cancel());
      dialog!.getAnimations().forEach((animation) => animation.cancel());
      if (dialog!.open) moveToTarget();
    } else {
      if (!playing)
        play.textContent = index === stops.length - 1 ? t.repeat : t.resume;
    }
    updatePosition();
  }
  new MutationObserver(configure).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-motion'],
  });
  reduced.addEventListener('change', configure);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pause();
      cancelAnimationFrame(scrollFrame);
      scrollVersion++;
      travelling = false;
      dialog!.dataset.travelling = 'false';
    }
  });
  window.addEventListener('scroll', updatePosition, { passive: true });
  const resize = () => {
    if (dialog!.open) moveToTarget(false);
  };
  window.addEventListener('resize', resize, { passive: true });
  window.visualViewport?.addEventListener('resize', resize);
  const sizeObserver = new ResizeObserver(updatePosition);
  sizeObserver.observe(card);
  sizeObserver.observe(navigation);
  // The modal covers the actual page: forward reading gestures to a tall block.
  function scrollContent(delta: number) {
    if (!focus?.classList.contains('tour-focus-window')) return;
    pause();
    focus.scrollTop += delta;
  }
  spotlight.addEventListener(
    'wheel',
    (event) => {
      if (!focus?.classList.contains('tour-focus-window')) return;
      event.preventDefault();
      scrollContent(event.deltaY);
    },
    { passive: false },
  );
  spotlight.addEventListener('pointerdown', (event) => {
    if (!focus?.classList.contains('tour-focus-window')) return;
    touchY = event.clientY;
    spotlight.setPointerCapture(event.pointerId);
  });
  spotlight.addEventListener('pointermove', (event) => {
    if (!spotlight.hasPointerCapture(event.pointerId)) return;
    scrollContent(touchY - event.clientY);
    touchY = event.clientY;
  });
  spotlight.addEventListener('keydown', (event) => {
    const delta =
      event.key === 'ArrowDown'
        ? 40
        : event.key === 'ArrowUp'
          ? -40
          : event.key === 'PageDown'
            ? focus!.clientHeight * 0.8
            : event.key === 'PageUp'
              ? -focus!.clientHeight * 0.8
              : 0;
    if (delta) {
      event.preventDefault();
      scrollContent(delta);
    }
  });
}
