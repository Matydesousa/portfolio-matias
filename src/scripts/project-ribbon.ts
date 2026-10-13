import { RibbonPhysics } from './ribbon-physics';
import { getUI, documentLocale } from '../i18n/ui';

export function initializeProjectRibbon() {
  const element = document.querySelector<HTMLElement>('.project-ribbon');
  if (!element) return;
  const ribbon = element;
  const viewport = ribbon.querySelector<HTMLElement>('.ribbon-viewport')!;
  const track = ribbon.querySelector<HTMLElement>('.ribbon-track')!;
  const original = ribbon.querySelector<HTMLElement>('.ribbon-group')!;
  const status = ribbon.querySelector<HTMLElement>('[data-ribbon-status]')!;
  const t = getUI(documentLocale());
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const physics = new RibbonPhysics();
  const cards = [...track.querySelectorAll<HTMLElement>('.ribbon-card')];
  const slots = [...original.querySelectorAll<HTMLElement>('li')];
  const segments = [...track.querySelectorAll<HTMLElement>('.ribbon-segment')];
  let enhanced = false;
  ribbon.dataset.tone = '0';
  let cycle = 0;
  let radiusX = 0;
  let radiusZ = 0;
  let inclination = -10;
  let projected = false;
  let visible = false;
  let windowActive = true;
  let frame = 0;
  let lastFrame = 0;
  let lastPaint = 0;
  let suppressClick = false;
  let keyboardFocus = false;
  let tilt = 0;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let drag: {
    id: number;
    startX: number;
    startY: number;
    initialTilt: number;
    x: number;
    time: number;
    active: boolean;
  } | null = null;
  // A tour can return focus to the section itself without selecting a card.
  const focusInside = () =>
    viewport.contains(document.activeElement) &&
    (keyboardFocus ||
      Boolean(document.activeElement?.matches(':focus-visible')));
  const motionAllowed = () =>
    !reduced.matches && document.documentElement.dataset.motion !== 'off';
  const available = () =>
    visible &&
    windowActive &&
    !document.hidden &&
    !document.querySelector('dialog[open]:not(.page-tour)');
  const wrap = () => {
    if (cycle) physics.position %= cycle;
  };
  function resetPointer() {
    pointer.x = pointer.y = pointer.targetX = pointer.targetY = 0;
    tilt = 0;
  }
  function paint() {
    if (!enhanced) return;
    viewport.scrollLeft = 0;
    const phase = cycle ? (physics.position / cycle) * Math.PI * 2 : 0;
    track.style.setProperty('--ring-phase', String(phase));
    const pitch = ((inclination + pointer.y * 1.2 + tilt) * Math.PI) / 180;
    const sinPitch = Math.sin(pitch),
      cosPitch = Math.cos(pitch);
    const perspective = 1200;
    // Project the same 3D ring explicitly on small screens. Nested preserve-3d
    // can be flattened by WebKit; independent affine faces retain its depth.
    const projectFace = (x: number, z: number, normal: number) => {
      const y = -z * sinPitch;
      const scale = perspective / (perspective - z * cosPitch + radiusZ);
      const slope = (scale * scale) / perspective;
      const normalSin = Math.sin(normal),
        normalCos = Math.cos(normal);
      const depthX = -normalSin * cosPitch;
      return (
        'matrix(' +
        [
          scale * normalCos + x * slope * depthX,
          scale * normalSin * sinPitch + y * slope * depthX,
          x * slope * sinPitch,
          scale * cosPitch + y * slope * sinPitch,
          x * scale,
          y * scale,
        ].join(',') +
        ')'
      );
    };
    track.style.transform = projected
      ? 'translate(' +
        pointer.x * 7 +
        'px,' +
        (pointer.y * 3 + tilt * 0.6) +
        'px)'
      : 'translate3d(' +
        pointer.x * 7 +
        'px,' +
        (pointer.y * 3 + tilt * 0.6) +
        'px,' +
        -radiusZ +
        'px) rotateX(' +
        (inclination + pointer.y * 1.2 + tilt) +
        'deg) rotateY(' +
        pointer.x * 0.8 +
        'deg)';
    slots.forEach((slot, index) => {
      const angle = phase + (index * Math.PI * 2) / slots.length;
      const sine = Math.sin(angle),
        cosine = Math.cos(angle);
      // Tangent orientation keeps cards rigid instead of stretching an entire ring.
      const normal = Math.atan2(radiusZ * sine, radiusX * cosine);
      // Explicit culling also works on WebKit ports that flatten nested 3D
      // layers. Opacity keeps back cards in the keyboard/accessibility order.
      const faceNormal = Math.cos(normal);
      const facing = projected
        ? faceNormal * cosPitch -
          (radiusZ * cosine * faceNormal + radiusX * sine * Math.sin(normal)) /
            (perspective + radiusZ)
        : faceNormal;
      slot.dataset.facing = facing > 0.06 ? 'front' : 'back';
      slot.style.zIndex = String(100 + Math.round(cosine * 100));
      slot.style.transform = projected
        ? projectFace(radiusX * sine, radiusZ * cosine, normal)
        : 'translate3d(' +
          radiusX * sine +
          'px,0,' +
          radiusZ * cosine +
          'px) rotateY(' +
          normal +
          'rad)';
      cards[index].style.setProperty(
        '--face-light',
        String(0.02 + Math.max(0, Math.cos(normal)) * 0.08),
      );
    });
    const halfStep = Math.PI / segments.length;
    segments.forEach((segment, index) => {
      const angle = phase + (index * Math.PI * 2) / segments.length;
      const sine = Math.sin(angle),
        cosine = Math.cos(angle);
      const x = radiusX - 8,
        z = radiusZ - 8;
      const normal = Math.atan2(z * sine, x * cosine);
      segment.style.setProperty(
        '--band-light',
        String(0.2 + Math.max(0, Math.cos(normal)) * 0.8),
      );
      const width =
        2 * Math.sin(halfStep) * Math.hypot(x * cosine, z * sine) + 0.8;
      segment.style.setProperty('--segment-width', width + 'px');
      segment.style.transform = projected
        ? projectFace(
            x * sine * Math.cos(halfStep),
            z * cosine * Math.cos(halfStep),
            normal,
          )
        : 'translate3d(' +
          x * sine * Math.cos(halfStep) +
          'px,0,' +
          z * cosine * Math.cos(halfStep) +
          'px) rotateY(' +
          normal +
          'rad)';
    });
  }
  function finish(cancelled = false) {
    if (!drag) return;
    const current = drag;
    drag = null;
    if (viewport.hasPointerCapture(current.id))
      viewport.releasePointerCapture(current.id);
    ribbon.removeAttribute('data-dragging');
    if (cancelled || !motionAllowed()) {
      physics.stop();
      tilt = 0;
      paint();
    } else physics.release((performance.now() - current.time) / 1000);
    if (current.active) suppressClick = true;
    if (document.activeElement === viewport) viewport.blur();
    sync();
  }
  function shouldRun() {
    return available() && motionAllowed() && !focusInside() && !drag;
  }
  function tick(now: number) {
    frame = 0;
    if (!shouldRun()) return;
    const interval = Math.abs(physics.velocity) > 80 ? 16 : 32;
    if (now - lastPaint >= interval) {
      const elapsed = Math.min(0.06, (now - lastFrame) / 1000);
      physics.step(elapsed);
      const blend = 1 - Math.exp(-elapsed / 0.14);
      pointer.x += (pointer.targetX - pointer.x) * blend;
      pointer.y += (pointer.targetY - pointer.y) * blend;
      // Small vertical deflection returns gently; it cannot turn the ring over.
      tilt *= Math.exp(-elapsed / 0.28);
      if (Math.abs(tilt) < 0.01) tilt = 0;
      lastFrame = lastPaint = now;
      wrap();
      paint();
    }
    if (shouldRun()) frame = requestAnimationFrame(tick);
    else ribbon.dataset.running = 'false';
  }
  function sync() {
    const allowed = motionAllowed();
    if (enhanced !== allowed) {
      enhanced = allowed;
      ribbon.toggleAttribute('data-enhanced', allowed);
      ribbon.querySelector('#ribbon-title')!.textContent = allowed
        ? t.ribbonTitle
        : t.projects;
      viewport.setAttribute('aria-label', allowed ? t.ribbonTitle : t.projects);
      ribbon
        .querySelectorAll<HTMLElement>('#ribbon-help, #ribbon-keyboard')
        .forEach((help) => {
          help.hidden = !allowed;
        });
      if (allowed) {
        viewport.setAttribute(
          'aria-describedby',
          'ribbon-help ribbon-keyboard',
        );
        measure();
        const focused = cards.findIndex((card) =>
          card.contains(document.activeElement),
        );
        if (focused >= 0) {
          physics.position = (-focused * cycle) / cards.length;
          paint();
        }
        return;
      }
      viewport.removeAttribute('aria-describedby');
      ribbon.removeAttribute('data-projected');
      track.style.removeProperty('transform');
      slots.forEach((slot) => {
        slot.style.removeProperty('transform');
        slot.style.removeProperty('z-index');
        delete slot.dataset.facing;
      });
      status.textContent = '';
      suppressClick = false;
    }
    if (!motionAllowed() && tilt) {
      tilt = 0;
      paint();
    }
    if (
      (!allowed ||
        !available() ||
        document.querySelector('.page-tour[open]')) &&
      drag
    ) {
      finish(true);
      return;
    }
    if ((!motionAllowed() || !available()) && !drag) {
      physics.stop();
      resetPointer();
      paint();
    }
    const run = shouldRun();
    ribbon.dataset.running = String(run);
    if (run && !frame) {
      lastFrame = lastPaint = performance.now();
      frame = requestAnimationFrame(tick);
    } else if (!run) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  function measure() {
    if (!enhanced) return;
    const previous = cycle;
    cards.forEach((card) => {
      card.style.height = 'auto';
    });
    const cardWidth = cards[0].offsetWidth;
    const cardHeight = Math.max(...cards.map((card) => card.offsetHeight));
    const compact = viewport.clientWidth < 660;
    projected = compact;
    ribbon.toggleAttribute('data-projected', projected);
    inclination = compact ? -16 : -10;
    radiusX = Math.max(
      cardWidth * (compact ? 0.65 : 0.85),
      (viewport.clientWidth - cardWidth * (compact ? 0.55 : 0.24)) / 2,
    );
    radiusZ = compact
      ? Math.max(56, Math.min(104, radiusX * 0.62))
      : Math.min(210, Math.max(110, radiusX * 0.48));
    cycle = 2 * Math.PI * radiusX;
    physics.position = previous ? (physics.position * cycle) / previous : 0;
    const rise = radiusZ * Math.sin((-inclination * Math.PI) / 180);
    ribbon.style.setProperty('--card-height', cardHeight + 'px');
    ribbon.style.setProperty('--band-height', cardHeight * 0.68 + 'px');
    ribbon.style.setProperty('--ring-radius-x', radiusX + 'px');
    ribbon.style.setProperty('--ring-radius-z', radiusZ + 'px');
    ribbon.style.setProperty(
      '--ring-height',
      cardHeight + rise * (compact ? 2 : 1) + (compact ? 28 : 10) + 'px',
    );
    ribbon.style.setProperty('--ring-lift', rise * 0.8 + 'px');
    ribbon.style.setProperty(
      '--ring-perspective',
      Math.max(1200, radiusX * 3) + 'px',
    );
    cards.forEach((card) => {
      card.style.height = '';
    });
    wrap();
    physics.stop();
    tilt = 0;
    paint();
    sync();
  }
  function move(direction: number) {
    finish(true);
    physics.stop();
    physics.position += (direction * cycle) / cards.length;
    wrap();
    paint();
  }
  function changeColor() {
    ribbon.dataset.tone = String((Number(ribbon.dataset.tone) + 1) % 3);
    status.textContent = t.ribbonColorChanged;
  }
  window.addEventListener(
    'pointermove',
    (event) => {
      if (
        !motionAllowed() ||
        !available() ||
        !fine.matches ||
        event.pointerType !== 'mouse' ||
        drag ||
        focusInside()
      )
        return;
      pointer.targetX = Math.max(
        -1,
        Math.min(1, (event.clientX / innerWidth) * 2 - 1),
      );
      pointer.targetY = Math.max(
        -1,
        Math.min(1, (event.clientY / innerHeight) * 2 - 1),
      );
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    pointer.targetX = pointer.targetY = 0;
  });
  viewport.addEventListener('pointerdown', (event) => {
    keyboardFocus = false;
    if (!enhanced) {
      suppressClick = false;
      return;
    }
    if (
      drag ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      !available()
    )
      return;
    if (event.pointerType === 'mouse') event.preventDefault();
    suppressClick = false;
    physics.stop();
    drag = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialTilt: tilt,
      x: event.clientX,
      time: performance.now(),
      active: false,
    };
    sync();
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.startX,
      dy = event.clientY - drag.startY;
    if (!drag.active) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 7) return;
      drag.active = true;
      viewport.setPointerCapture(drag.id);
      ribbon.dataset.dragging = 'true';
      if (focusInside()) (document.activeElement as HTMLElement)?.blur();
    }
    const now = performance.now();
    tilt = motionAllowed()
      ? Math.max(-2.2, Math.min(2.2, drag.initialTilt + dy * 0.025))
      : 0;
    physics.drag(
      event.clientX - drag.x,
      Math.min(0.08, (now - drag.time) / 1000),
    );
    drag.x = event.clientX;
    drag.time = now;
    wrap();
    paint();
  });
  // Single-finger gestures belong to the object from their starting surface.
  // Keep a native Touch Events fallback for Safari; taps and page pinch remain native.
  viewport.addEventListener(
    'touchmove',
    (event) => {
      if (drag?.active && event.touches.length === 1 && event.cancelable)
        event.preventDefault();
    },
    { passive: false },
  );
  // Before the drag threshold there is no pointer capture: release may be outside.
  window.addEventListener('pointerup', (event) => {
    if (event.pointerId === drag?.id) finish();
  });
  window.addEventListener('pointercancel', (event) => {
    if (event.pointerId === drag?.id) finish(true);
  });
  viewport.addEventListener('lostpointercapture', (event) => {
    // Touch starts with implicit capture on the image/link. Its bubbling loss
    // during transfer to the viewport is not a loss of our active grab.
    if (event.target === viewport && event.pointerId === drag?.id) finish(true);
  });
  viewport.addEventListener('dragstart', (event) => event.preventDefault());
  viewport.addEventListener(
    'click',
    (event) => {
      if (
        suppressClick &&
        !(event instanceof MouseEvent && event.detail === 0)
      ) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
        return;
      }
      if (!enhanced) return;
      if (
        !(event.target as Element).closest('a') &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        !event.altKey
      )
        changeColor();
    },
    true,
  );
  viewport.addEventListener('keydown', (event) => {
    keyboardFocus = true;
    sync();
    if (!enhanced) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if ([' ', 'Enter'].includes(event.key) && event.target === viewport) {
      event.preventDefault();
      if (!event.repeat) changeColor();
      return;
    }
    if (
      ['ArrowUp', 'ArrowDown'].includes(event.key) &&
      event.target === viewport &&
      motionAllowed()
    ) {
      event.preventDefault();
      tilt = Math.max(
        -2.2,
        Math.min(2.2, tilt + (event.key === 'ArrowUp' ? -0.7 : 0.7)),
      );
      paint();
      return;
    }
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? 1 : -1);
    const links = [...original.querySelectorAll<HTMLAnchorElement>('a')];
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (index >= 0)
      links[
        (index + (event.key === 'ArrowLeft' ? -1 : 1) + links.length) %
          links.length
      ].focus({ preventScroll: true });
  });
  ribbon.addEventListener('focusin', (event) => {
    if (!enhanced) return;
    if (!focusInside()) return;
    physics.stop();
    resetPointer();
    const card = (event.target as Element).closest<HTMLElement>('.ribbon-card');
    if (card && original.contains(card))
      physics.position = (-cards.indexOf(card) * cycle) / cards.length;
    paint();
    sync();
  });
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Tab') keyboardFocus = true;
    },
    true,
  );
  ribbon.addEventListener('focusout', () =>
    queueMicrotask(() => {
      wrap();
      paint();
      sync();
    }),
  );
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(viewport);
  new ResizeObserver(measure).observe(viewport);
  const textObserver = new ResizeObserver(measure);
  cards.forEach((card) =>
    card
      .querySelectorAll('h3, p')
      .forEach((node) => textObserver.observe(node)),
  );
  new MutationObserver(sync).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-motion'],
  });
  const modalObserver = new MutationObserver(sync);
  document.querySelectorAll('dialog').forEach((dialog) =>
    modalObserver.observe(dialog, {
      attributes: true,
      attributeFilter: ['open'],
    }),
  );
  reduced.addEventListener('change', sync);
  fine.addEventListener('change', () => {
    resetPointer();
    paint();
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('blur', () => {
    windowActive = false;
    finish(true);
    sync();
  });
  window.addEventListener('focus', () => {
    windowActive = true;
    sync();
  });
  window.addEventListener('pageshow', sync);
  sync();
}
