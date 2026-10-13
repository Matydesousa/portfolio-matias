/** Small, opt-in discoveries. Never replace content or intercept navigation. */
import { observeTouchTaps } from './touch-taps';
export function initializeDiscoveries() {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const title = document.querySelector<HTMLElement>('.intro h1');
  const spark = title?.querySelector<HTMLButtonElement>('.name-spark');
  const letters = title?.querySelectorAll<HTMLElement>('.intro-letter');
  const animations = new Set<Animation>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const temporary = new Set<Element>();
  const resets: (() => void)[] = [];
  const frames = new Set<number>();
  const techButtons =
    document.querySelectorAll<HTMLButtonElement>('.tech-spark');
  const sky = document.createElement('div');
  sky.className = 'discovery-sky';
  sky.setAttribute('aria-hidden', 'true');
  document.body.prepend(sky);
  let lastWave = -Infinity;
  let lastConstellation = -Infinity;
  let lastTech = -Infinity;
  const active = () =>
    root.dataset.motion === 'on' &&
    !reduced.matches &&
    !document.hidden &&
    !document.querySelector('dialog[open]');
  const touchDiscoveries = new Map<Element, () => void>();
  const visibleDiscoveries = new Set<Element>();
  let touchSettling: ReturnType<typeof setTimeout> | undefined;
  function refreshTouchDiscoveries() {
    cancelWait(touchSettling);
    if (finePointer.matches || !active()) return;
    // Hover discoveries become quiet arrivals once native touch scrolling stops.
    touchSettling = wait(() => {
      visibleDiscoveries.forEach((element) =>
        touchDiscoveries.get(element)?.(),
      );
    }, 160);
  }
  const discoveryObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio >= 0.7)
          visibleDiscoveries.add(entry.target);
        else visibleDiscoveries.delete(entry.target);
      });
      refreshTouchDiscoveries();
    },
    { threshold: [0, 0.7] },
  );

  function animate(
    element: Element,
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    const animation = element.animate(frames, options);
    animations.add(animation);
    const forget = () => animations.delete(animation);
    animation.addEventListener('finish', forget, { once: true });
    animation.addEventListener('cancel', forget, { once: true });
    return animation;
  }

  function wait(callback: () => void, milliseconds: number) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (active()) callback();
    }, milliseconds);
    timers.add(timer);
    return timer;
  }

  function cancelWait(timer: ReturnType<typeof setTimeout> | undefined) {
    if (timer === undefined) return;
    clearTimeout(timer);
    timers.delete(timer);
  }

  function clear() {
    frames.forEach(cancelAnimationFrame);
    frames.clear();
    timers.forEach(clearTimeout);
    timers.clear();
    animations.forEach((animation) => animation.cancel());
    animations.clear();
    temporary.forEach((element) => element.remove());
    temporary.clear();
    lastWave = lastConstellation = -Infinity;
    lastTech = -Infinity;
  }

  function wave(origin = 0) {
    if (!active() || !letters || performance.now() - lastWave < 900) return;
    lastWave = performance.now();
    letters.forEach((letter, index) => {
      // Separate translate from the existing entrance transform.
      animate(
        letter,
        [
          { translate: '0 0', color: 'var(--text)' },
          { translate: '0 -5px', color: 'var(--accent)', offset: 0.38 },
          { translate: '0 0', color: 'var(--text)' },
        ],
        {
          duration: 540,
          delay: Math.abs(index - origin) * 24,
          easing: 'ease-in-out',
        },
      );
    });
  }

  function constellation(x: number, y: number) {
    if (!active() || performance.now() - lastConstellation < 650) return;
    lastConstellation = performance.now();
    const ns = 'http://www.w3.org/2000/svg';
    const drawing = document.createElementNS(ns, 'svg');
    drawing.setAttribute('viewBox', '0 0 180 140');
    drawing.classList.add('discovery-constellation');
    // Clip to the viewport rather than introduce horizontal overflow.
    drawing.style.left = `${Math.max(0, Math.min(innerWidth - 180, x - 90))}px`;
    drawing.style.top = `${Math.max(0, Math.min(innerHeight - 140, y - 70))}px`;
    const points = [
      [22, 82],
      [53, 33],
      [90, 63],
      [131, 22],
      [158, 91],
      [104, 113],
    ];
    const path = document.createElementNS(ns, 'path');
    path.setAttribute(
      'd',
      'M22 82 L53 33 L90 63 L131 22 L158 91 L104 113 L90 63 M53 33 L104 113',
    );
    path.setAttribute('pathLength', '1');
    drawing.append(path);
    points.forEach(([cx, cy]) => {
      const star = document.createElementNS(ns, 'circle');
      star.setAttribute('cx', String(cx));
      star.setAttribute('cy', String(cy));
      star.setAttribute('r', '2');
      drawing.append(star);
    });
    sky.append(drawing);
    temporary.add(drawing);
    animate(path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: 650,
      easing: 'ease-out',
      fill: 'forwards',
    });
    const life = animate(
      drawing,
      [
        { opacity: 0, transform: 'scale(0.82)' },
        { opacity: 0.65, transform: 'scale(1)', offset: 0.28 },
        { opacity: 0.4, transform: 'scale(1.02)', offset: 0.65 },
        { opacity: 0, transform: 'scale(1.06)' },
      ],
      { duration: 1900, easing: 'ease-out' },
    );
    life.addEventListener(
      'finish',
      () => {
        path.getAnimations().forEach((animation) => animation.cancel());
        drawing.remove();
        temporary.delete(drawing);
      },
      { once: true },
    );
  }

  title?.addEventListener('pointerover', (event) => {
    if (!finePointer.matches || event.pointerType === 'touch') return;
    const index = Array.from(letters ?? []).indexOf(
      event.target as HTMLElement,
    );
    if (index >= 0) wave(index);
  });
  title?.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType !== 'touch' || !event.isPrimary) return;
      const index = Array.from(letters ?? []).indexOf(
        event.target as HTMLElement,
      );
      if (index >= 0) wave(index);
    },
    { passive: true },
  );
  spark?.addEventListener('focus', () => wave((letters?.length ?? 1) - 1));
  spark?.addEventListener('click', () => {
    if (!active()) return;
    wave((letters?.length ?? 1) - 1);
    const box = spark.getBoundingClientRect();
    constellation(box.x + box.width / 2, box.y + box.height / 2);
  });

  const emptySurface = (target: EventTarget | null) =>
    target instanceof Element &&
    target.matches('body, main, section, .container');
  window.addEventListener('mousedown', (event) => {
    // A native double click on a blank margin can select a nearby word.
    // Stop that default only on the second click of an empty surface.
    if (
      event.detail === 2 &&
      event.button === 0 &&
      finePointer.matches &&
      active() &&
      emptySurface(event.target) &&
      !window.getSelection()?.toString()
    )
      event.preventDefault();
  });
  window.addEventListener('dblclick', (event) => {
    if (!finePointer.matches || event.button !== 0 || event.defaultPrevented)
      return;
    // Only genuinely empty surfaces: no text, controls, images or 3D object.
    if (!emptySurface(event.target)) return;
    if (window.getSelection()?.toString()) return;
    constellation(event.clientX, event.clientY);
  });
  resets.push(
    observeTouchTaps({
      allowed: () => active() && !window.getSelection()?.toString(),
      accepts: emptySurface,
      doubleTap: (event) => constellation(event.clientX, event.clientY),
    }),
  );

  document
    .querySelectorAll<HTMLAnchorElement>('.repository-link')
    .forEach((link) => {
      const thumbnail = link.querySelector<HTMLElement>('.thumbnail-frame');
      if (!thumbnail) return;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let circuit: SVGSVGElement | undefined;
      function reset() {
        cancelWait(timer);
        timer = undefined;
        circuit
          ?.getAnimations({ subtree: true })
          .forEach((animation) => animation.cancel());
        if (circuit) temporary.delete(circuit);
        circuit?.remove();
        circuit = undefined;
      }
      function discover() {
        if (!active() || circuit || (timer !== undefined && timers.has(timer)))
          return;
        timer = wait(() => {
          const ns = 'http://www.w3.org/2000/svg';
          circuit = document.createElementNS(ns, 'svg');
          circuit.setAttribute('viewBox', '0 0 160 112');
          circuit.setAttribute('aria-hidden', 'true');
          circuit.classList.add('discovery-circuit');
          circuit.innerHTML =
            '<path pathLength="1" d="M6 36V12H34M126 6H150V34M154 76V100H126M34 106H10V78M12 60H26L38 48H62M148 54H136L124 66H102"/><circle cx="62" cy="48" r="2"/><circle cx="102" cy="66" r="2"/><path pathLength="1" class="circuit-code" d="M72 48L64 56L72 64M88 48L96 56L88 64M83 45L77 67"/>';
          thumbnail!.append(circuit);
          temporary.add(circuit);
          circuit
            .querySelectorAll('path')
            .forEach((path) =>
              animate(
                path,
                [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
                { duration: 900, easing: 'ease-out', fill: 'forwards' },
              ),
            );
          animate(circuit, [{ opacity: 0 }, { opacity: 1 }], {
            duration: 350,
            fill: 'forwards',
          });
        }, 650);
      }
      thumbnail.addEventListener('pointerenter', (event) => {
        if (finePointer.matches && event.pointerType !== 'touch') discover();
      });
      thumbnail.addEventListener('pointerleave', reset);
      link.addEventListener('focus', discover);
      link.addEventListener('blur', reset);
      link.addEventListener('click', reset);
      touchDiscoveries.set(thumbnail, discover);
      discoveryObserver.observe(thumbnail);
      // Reset closure references as well as removing temporary DOM.
      resets.push(reset);
    });

  // Technology labels stay readable with or without effects. The control only
  // adds a brief, local visual response; it never filters or invents skill levels.
  techButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!active() || performance.now() - lastTech < 650) return;
      lastTech = performance.now();
      const chip = button.closest('li')!;
      const signal = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      signal.classList.add('tech-signal');
      signal.setAttribute('aria-hidden', 'true');
      signal.setAttribute('viewBox', '0 0 100 40');
      signal.setAttribute('preserveAspectRatio', 'none');
      signal.innerHTML =
        '<path pathLength="1" d="M9 7L3 20L9 33M91 7L97 20L91 33M25 38H75"/>';
      chip.append(signal);
      temporary.add(signal);
      const path = signal.querySelector('path')!;
      animate(path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: 400,
        easing: 'ease-out',
        fill: 'forwards',
      });
      animate(
        chip,
        [
          { boxShadow: '0 0 0 #8bb9ff00' },
          { boxShadow: '0 0 18px #8bb9ff30', offset: 0.3 },
          { boxShadow: '0 0 0 #8bb9ff00' },
        ],
        { duration: 720, easing: 'ease-out' },
      );
      const life = animate(
        signal,
        [
          { opacity: 0, scale: '.96' },
          { opacity: 0.85, scale: '1', offset: 0.25 },
          { opacity: 0, scale: '1.06' },
        ],
        { duration: 900, easing: 'ease-out' },
      );
      life.addEventListener(
        'finish',
        () => {
          path.getAnimations().forEach((animation) => animation.cancel());
          signal.remove();
          temporary.delete(signal);
        },
        { once: true },
      );
    });
  });

  document
    .querySelectorAll<HTMLAnchorElement>('.brand, .contact-links a')
    .forEach((link) => {
      const signature = link.classList.contains('brand');
      let lastTouch = -Infinity;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let drawing: SVGSVGElement | undefined;
      function reset() {
        cancelWait(timer);
        timer = undefined;
        drawing
          ?.getAnimations({ subtree: true })
          .forEach((animation) => animation.cancel());
        if (drawing) temporary.delete(drawing);
        drawing?.remove();
        drawing = undefined;
      }
      function discover(delay = 450) {
        if (!active() || drawing || (timer !== undefined && timers.has(timer)))
          return;
        timer = wait(() => {
          const svg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg',
          );
          drawing = svg;
          svg.classList.add(signature ? 'brand-signature' : 'contact-signal');
          svg.setAttribute('aria-hidden', 'true');
          svg.setAttribute('viewBox', signature ? '0 0 100 60' : '0 0 100 14');
          svg.setAttribute('preserveAspectRatio', 'none');
          svg.innerHTML = signature
            ? '<path pathLength="1" d="M30 3H12Q3 3 3 12V30M70 57H88Q97 57 97 48V30"/><circle cx="97" cy="20" r="1.5"/><circle cx="3" cy="40" r="1.5"/>'
            : '<path pathLength="1" d="M3 9H40L47 3L54 9H97"/><circle cx="3" cy="9" r="1.6"/>';
          link.append(svg);
          temporary.add(svg);
          animate(
            svg.querySelector('path')!,
            [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
            {
              duration: signature ? 800 : 1000,
              easing: 'ease-out',
              fill: 'forwards',
            },
          );
          if (!signature)
            animate(
              svg.querySelector('circle')!,
              [
                { transform: 'translate(0px, 0px)' },
                { transform: 'translate(37px, 0px)', offset: 0.4 },
                { transform: 'translate(44px, -6px)', offset: 0.48 },
                { transform: 'translate(51px, 0px)', offset: 0.56 },
                { transform: 'translate(94px, 0px)' },
              ],
              { duration: 1100, easing: 'linear', fill: 'forwards' },
            );
          const life = animate(
            svg,
            [
              { opacity: 0 },
              { opacity: 0.7, offset: 0.2 },
              { opacity: 0.6, offset: 0.75 },
              { opacity: 0 },
            ],
            { duration: 1500 },
          );
          life.addEventListener('finish', reset, { once: true });
        }, delay);
      }
      link.addEventListener('pointerenter', (event) => {
        if (finePointer.matches && event.pointerType !== 'touch') discover();
      });
      link.addEventListener('pointerleave', (event) => {
        if (event.pointerType !== 'touch' && !link.matches(':focus-visible'))
          reset();
      });
      link.addEventListener('focus', () => discover());
      link.addEventListener('blur', reset);
      link.addEventListener(
        'pointerdown',
        (event) => {
          if (event.pointerType === 'touch') lastTouch = performance.now();
        },
        { passive: true },
      );
      link.addEventListener('click', (event) => {
        reset();
        // Keep navigation immediate. A contact tap plays its signal on the
        // current page (including email-copy), without waiting for hover.
        if (
          !signature &&
          event.detail > 0 &&
          performance.now() - lastTouch < 800
        )
          discover(0);
      });
      if (signature) {
        touchDiscoveries.set(link, () => discover());
        discoveryObserver.observe(link);
      }
      resets.push(reset);
    });

  document
    .querySelectorAll<HTMLAnchorElement>('.gallery-link')
    .forEach((link) => {
      const image = link.querySelector<HTMLImageElement>('img');
      if (!image) return;
      let lens: HTMLDivElement | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let frame = 0;
      let x = 0,
        y = 0;
      let bounds: DOMRect;
      function reset() {
        cancelWait(timer);
        timer = undefined;
        cancelAnimationFrame(frame);
        frames.delete(frame);
        frame = 0;
        lens?.getAnimations().forEach((animation) => animation.cancel());
        if (lens) temporary.delete(lens);
        lens?.remove();
        lens = undefined;
      }
      function paint() {
        if (!lens || !active() || !finePointer.matches) return;
        const w = Math.min(88, bounds.width - 16),
          h = Math.min(76, bounds.height - 16);
        const left = Math.max(8, Math.min(bounds.width - w - 8, x - w / 2));
        const top = Math.max(8, Math.min(bounds.height - h - 8, y - h / 2));
        // Images preserve the aspect ratio of their screenshots. Zoom real
        // pixels without replacing the source or shifting the clickable card.
        const zoom = 2.6;
        lens.style.width = `${w}px`;
        lens.style.height = `${h}px`;
        lens.style.left = `${image!.offsetLeft + left}px`;
        lens.style.top = `${image!.offsetTop + top}px`;
        lens.style.backgroundSize = `${bounds.width * zoom}px ${bounds.height * zoom}px`;
        lens.style.backgroundPosition = `${w / 2 - x * zoom}px ${h / 2 - y * zoom}px`;
      }
      image.addEventListener('pointerenter', (event) => {
        if (!active() || !finePointer.matches || event.pointerType === 'touch')
          return;
        bounds = image.getBoundingClientRect();
        x = event.clientX - bounds.left;
        y = event.clientY - bounds.top;
        timer = wait(() => {
          if (!finePointer.matches || !image.complete || !image.naturalWidth)
            return;
          lens = document.createElement('div');
          lens.className = 'gallery-lens';
          lens.setAttribute('aria-hidden', 'true');
          lens.style.backgroundImage = `url("${image.currentSrc}")`;
          link.append(lens);
          temporary.add(lens);
          paint();
          animate(
            lens,
            [
              { opacity: 0, scale: '.96' },
              { opacity: 1, scale: '1' },
            ],
            { duration: 180, easing: 'ease-out', fill: 'forwards' },
          );
        }, 500);
      });
      image.addEventListener('pointermove', (event) => {
        if (!active() || !finePointer.matches || event.pointerType === 'touch')
          return;
        bounds = image.getBoundingClientRect();
        x = event.clientX - bounds.left;
        y = event.clientY - bounds.top;
        if (!lens || frame) return;
        frame = requestAnimationFrame(() => {
          frames.delete(frame);
          frame = 0;
          paint();
        });
        frames.add(frame);
      });
      image.addEventListener('pointerleave', reset);
      link.addEventListener('click', reset);
      resets.push(reset);
    });

  const experience =
    document.querySelector<HTMLDetailsElement>('.about details');
  const experienceList =
    experience?.querySelector<HTMLElement>('.experience-list');
  let experienceSignal: SVGSVGElement | undefined;
  function syncExperience(enter = false) {
    if (!experience?.open || !experienceList) {
      experienceSignal
        ?.getAnimations({ subtree: true })
        .forEach((animation) => animation.cancel());
      experienceSignal?.remove();
      experienceSignal = undefined;
      return;
    }
    const list = experienceList;
    const listHeight = list.offsetHeight;
    const positions = Array.from(list.querySelectorAll('h3')).map((heading) => {
      // Local layout coordinates keep the rail aligned during scroll depth.
      let y = heading.offsetHeight / 2;
      for (
        let node: HTMLElement | null = heading;
        node && node !== list;
        node = node.offsetParent as HTMLElement | null
      ) {
        y += node.offsetTop;
      }
      return y;
    });
    if (!positions.length) return;
    if (experienceSignal) {
      experienceSignal.setAttribute('viewBox', `0 0 12 ${listHeight}`);
      experienceSignal
        .querySelector('path')!
        .setAttribute('d', `M6 ${positions[0]}V${positions.at(-1)}`);
      experienceSignal
        .querySelectorAll('circle')
        .forEach((node, index) =>
          node.setAttribute('cy', String(positions[index])),
        );
      return;
    }
    const ns = 'http://www.w3.org/2000/svg';
    const signal = document.createElementNS(ns, 'svg');
    signal.classList.add('experience-signal');
    signal.setAttribute('aria-hidden', 'true');
    signal.setAttribute('viewBox', `0 0 12 ${listHeight}`);
    const animateEntrance = enter && active();
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', `M6 ${positions[0]}V${positions.at(-1)}`);
    path.setAttribute('pathLength', '1');
    signal.append(path);
    positions.forEach((y, index) => {
      const node = document.createElementNS(ns, 'circle');
      node.setAttribute('cx', '6');
      node.setAttribute('cy', String(y));
      node.setAttribute('r', '2.2');
      signal.append(node);
      if (animateEntrance)
        animate(
          node,
          [{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 0.45 }],
          { duration: 600, delay: index * 220, fill: 'forwards' },
        );
    });
    list.append(signal);
    // This rail belongs to the expanded section, not to temporary discoveries.
    // Cancelling its entrance leaves the static CSS appearance visible.
    experienceSignal = signal;
    if (!animateEntrance) return;
    animate(path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: 850,
      easing: 'ease-out',
    });
    const life = animate(
      signal,
      [{ opacity: 0 }, { opacity: 0.7, offset: 0.2 }, { opacity: 0.5 }],
      { duration: 1100 },
    );
    life.addEventListener(
      'finish',
      () => {
        signal
          .getAnimations({ subtree: true })
          .forEach((animation) => animation.cancel());
      },
      { once: true },
    );
  }
  experience?.addEventListener('toggle', () => syncExperience(true));
  if (experienceList)
    new ResizeObserver(() => {
      if (experienceSignal) syncExperience();
    }).observe(experienceList);
  syncExperience();

  function configure() {
    if (!active()) {
      clear();
      resets.forEach((reset) => reset());
    }
    if (spark) {
      const available = root.dataset.motion === 'on' && !reduced.matches;
      if (!available && document.activeElement === spark)
        document
          .querySelector<HTMLAnchorElement>('.site-header .brand')
          ?.focus({ preventScroll: true });
      spark.hidden = !available;
      const dot = title?.querySelector<HTMLElement>('[data-name-dot]');
      if (dot) dot.hidden = available;
    }
    techButtons.forEach((button) => {
      const available = root.dataset.motion === 'on' && !reduced.matches;
      if (!available && document.activeElement === button)
        document
          .querySelector<HTMLAnchorElement>('.site-header .brand')
          ?.focus({ preventScroll: true });
      button.hidden = !available;
      const label = button
        .closest('li')
        ?.querySelector<HTMLElement>('[data-tech-label]');
      if (label) label.hidden = available;
    });
    refreshTouchDiscoveries();
  }
  new MutationObserver(configure).observe(root, {
    attributes: true,
    attributeFilter: ['data-motion'],
  });
  document.querySelectorAll('dialog').forEach((dialog) => {
    new MutationObserver(configure).observe(dialog, {
      attributes: true,
      attributeFilter: ['open'],
    });
  });
  document.addEventListener('visibilitychange', configure);
  window.addEventListener('blur', () => {
    clear();
    resets.forEach((reset) => reset());
  });
  window.addEventListener(
    'scroll',
    () => {
      clear();
      resets.forEach((reset) => reset());
      refreshTouchDiscoveries();
    },
    { passive: true },
  );
  window.addEventListener(
    'resize',
    () => {
      clear();
      resets.forEach((reset) => reset());
      refreshTouchDiscoveries();
    },
    { passive: true },
  );
  reduced.addEventListener('change', configure);
  finePointer.addEventListener('change', () => {
    clear();
    resets.forEach((reset) => reset());
  });
  configure();
}
