import { createSculpture, type SculptureInteraction } from './scene';
import { RotationPhysics } from './scene-physics';
import { getUI, documentLocale } from '../i18n/ui';
import { initializeScrollDepth } from './scroll-depth';
import { createPageArrival } from './page-arrival';
import type { SceneWorkerMessage } from './scene-worker';

/** Progressive enhancement: all content and links work without this module. */
export function initializeMotion() {
  const t = getUI(documentLocale());
  const canvas = document.querySelector<HTMLCanvasElement>('.ambient-canvas');
  const toggle = document.querySelector<HTMLButtonElement>('.motion-toggle');
  if (!canvas || !toggle) return;

  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const useWorker =
    !finePointer.matches &&
    typeof Worker !== 'undefined' &&
    'transferControlToOffscreen' in canvas;
  const context = useWorker ? null : canvas.getContext('2d');
  if (!useWorker && !context) return;
  if (context) canvas.dataset.renderer = 'main';
  let sceneWorker: Worker | undefined;
  let workerBusy = false;
  let workerFailed = false;
  let ratio = 1;
  function sendScene(
    message: SceneWorkerMessage,
    transfer: Transferable[] = [],
  ) {
    sceneWorker?.postMessage(message, transfer);
  }
  function clearScene() {
    if (sceneWorker) sendScene({ type: 'clear' });
    else context?.clearRect(0, 0, width, height);
  }
  function startSceneWorker() {
    if (sceneWorker || workerFailed) return;
    try {
      sceneWorker = new Worker(new URL('./scene-worker.ts', import.meta.url), {
        type: 'module',
      });
      sceneWorker.addEventListener('message', () => {
        workerBusy = false;
        canvas!.dataset.renderer = 'worker';
      });
      sceneWorker.addEventListener('error', (event) => {
        // Decorative enhancement may disappear; content and controls still work.
        event.preventDefault();
        workerFailed = true;
        sceneWorker?.terminate();
        sceneWorker = undefined;
        canvas!.hidden = true;
      });
      const offscreen = canvas!.transferControlToOffscreen();
      sendScene({ type: 'init', canvas: offscreen }, [offscreen]);
      sendScene({ type: 'resize', width, height, ratio });
    } catch {
      workerFailed = true;
      sceneWorker?.terminate();
      sceneWorker = undefined;
      canvas!.hidden = true;
    }
  }
  const progress = document.querySelector<HTMLElement>('.reading-progress');
  const atmosphere = document.querySelector<HTMLElement>('.ambient-atmosphere');
  const pulse = atmosphere?.querySelector<HTMLElement>('.ambient-pulse');
  const header = document.querySelector<HTMLElement>('.site-header');
  let ambientFrame = 0;
  let ambientX = 0;
  let ambientY = 0;
  function resetAtmosphere() {
    cancelAnimationFrame(ambientFrame);
    ambientFrame = 0;
    atmosphere?.removeAttribute('data-active');
    pulse?.getAnimations().forEach((animation) => animation.cancel());
  }
  let paused = false;
  try {
    paused = localStorage.getItem('portfolio-motion') === 'off';
  } catch {
    /* Storage is optional. */
  }
  let enabled = false;
  let frame = 0;
  let time = 0;
  let lastFrame = 0;
  let width = 0;
  let height = 0;
  let scroll = 0;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  // Build only when a visible, enabled scene actually needs its first frame.
  // Reduced motion and a saved pause never pay for the decorative mesh.
  let drawSculpture: ReturnType<typeof createSculpture> | undefined;
  let compactScene = false;
  const arrival = createPageArrival(canvas);
  const anchor = document.querySelector<HTMLElement>('.scene-anchor');
  const handle = anchor?.querySelector<HTMLButtonElement>('.scene-handle');
  const physics = new RotationPhysics();
  const interaction: SculptureInteraction = {
    yaw: 0,
    pitch: 0,
    rotationTime: 0,
    wireframe: false,
    assembly: 1,
  };
  const drag = {
    pointerId: null as number | null,
    x: 0,
    y: 0,
    distance: 0,
    time: 0,
    startX: 0,
    startY: 0,
    active: false,
  };
  let suppressClick = false;
  let assemblyActivation = false;
  const scene = { x: 0, y: 0, scale: 100, opacity: 1 };
  const sceneVisible = () =>
    Boolean(anchor) &&
    scene.y > -scene.scale * 2 &&
    scene.y < height + scene.scale * 2;

  function updateProgress() {
    const total = root.scrollHeight - innerHeight;
    scroll = total > 0 ? window.scrollY / total : 0;
    progress?.style.setProperty('--progress', String(scroll));
    const parallax = enabled
      ? Math.min(
          finePointer.matches ? 32 : 14,
          Math.max(0, window.scrollY * 0.035),
        )
      : 0;
    atmosphere?.style.setProperty('--ambient-shift', `${parallax}px`);
    if (anchor) {
      const bounds = anchor.getBoundingClientRect();
      scene.x = bounds.left + bounds.width / 2;
      scene.y = bounds.top + bounds.height / 2 + parallax * 0.6;
      scene.scale = bounds.width * 0.37;
      scene.opacity =
        !handle?.hidden && !finePointer.matches
          ? 0.18
          : width < 700
            ? 0.06
            : width < 1100
              ? 0.12
              : anchor.closest('.case-header')
                ? 0.14
                : 0.32;
    }
    if (enabled && !document.hidden && !frame && sceneVisible()) {
      lastFrame = performance.now();
      frame = requestAnimationFrame(draw);
    }
  }

  function updateNavigationClearance() {
    if (!header) return;
    const style = getComputedStyle(header);
    const clearance =
      style.position === 'sticky'
        ? header.offsetHeight + parseFloat(style.top) + 24
        : 28;
    root.style.setProperty('--navigation-clearance', `${clearance}px`);
  }

  function resize() {
    // Safari's address bar changes viewport height during native scrolling.
    // Preserve momentum for that change; rotation/layout changes still cancel.
    if (width !== innerWidth) cancelDrag();
    width = innerWidth;
    height = innerHeight;
    ratio = Math.min(devicePixelRatio || 1, 1.5);
    if (sceneWorker) sendScene({ type: 'resize', width, height, ratio });
    else if (!workerFailed) {
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    updateNavigationClearance();
    updateProgress();
    configureHandle();
  }

  function endDrag() {
    const pointerId = drag.pointerId;
    if (pointerId !== null) suppressClick = true;
    drag.pointerId = null;
    drag.active = false;
    handle?.removeAttribute('data-dragging');
    root.removeAttribute('data-scene-dragging');
    if (pointerId !== null && handle?.hasPointerCapture(pointerId))
      handle.releasePointerCapture(pointerId);
  }

  function cancelDrag() {
    physics.stop();
    endDrag();
  }

  function configureHandle() {
    if (!handle) return;
    // Keep the decorative object from intercepting text on narrow/zoomed layouts.
    const available =
      enabled &&
      ((finePointer.matches && width >= 1100) ||
        (!finePointer.matches && width < 1100)) &&
      parseFloat(getComputedStyle(root).fontSize) <= 20;
    if (!available) {
      cancelDrag();
      if (document.activeElement === handle)
        header
          ?.querySelector<HTMLAnchorElement>('.brand')
          ?.focus({ preventScroll: true });
    }
    handle.hidden = !available;
  }

  function toggleSculpture() {
    if (!enabled || !handle || handle.hidden) return;
    interaction.wireframe = !interaction.wireframe;
    handle.setAttribute('aria-pressed', String(interaction.wireframe));
  }

  handle?.addEventListener('pointerdown', (event) => {
    if (!enabled || event.button !== 0 || !event.isPrimary || handle.hidden)
      return;
    if (event.pointerType === 'mouse') event.preventDefault();
    physics.stop();
    if (event.pointerType === 'mouse') handle.focus({ preventScroll: true });
    suppressClick = false;
    assemblyActivation = arrival.isAssemblyTrigger(event);
    drag.pointerId = event.pointerId;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.distance = 0;
    drag.time = event.timeStamp;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.active = event.pointerType === 'mouse';
    pointer.x = pointer.targetX;
    pointer.y = pointer.targetY;
    if (drag.active) {
      handle.setPointerCapture(event.pointerId);
      handle.dataset.dragging = 'true';
      root.dataset.sceneDragging = 'true';
    }
  });
  handle?.addEventListener('pointermove', (event) => {
    if (drag.pointerId !== event.pointerId) return;
    if (!drag.active) {
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        cancelDrag();
        return;
      }
      if (Math.abs(dx) < 7) return;
      drag.active = true;
      handle.setPointerCapture(event.pointerId);
      handle.dataset.dragging = 'true';
      root.dataset.sceneDragging = 'true';
    }
    const dx = event.clientX - drag.x,
      dy = event.clientY - drag.y;
    drag.distance += Math.hypot(dx, dy);
    physics.drag(dx, dy, (event.timeStamp - drag.time) / 1000);
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.time = event.timeStamp;
  });
  window.addEventListener('pointerup', (event) => {
    if (drag.pointerId !== event.pointerId) return;
    const moved = drag.distance > 4;
    endDrag();
    if (moved) physics.release((event.timeStamp - drag.time) / 1000);
    else physics.stop();
    suppressClick = moved;
  });
  handle?.addEventListener('pointercancel', () => {
    assemblyActivation = false;
    suppressClick = true;
    cancelDrag();
  });
  handle?.addEventListener('lostpointercapture', () => {
    if (drag.pointerId !== null) cancelDrag();
  });
  handle?.addEventListener('click', (event) => {
    // The gesture that starts assembly only assembles; later clicks toggle the mesh.
    if (assemblyActivation || arrival.isAssemblyTrigger(event)) {
      assemblyActivation = false;
      return;
    }
    if (suppressClick && event.detail !== 0) {
      suppressClick = false;
      return;
    }
    toggleSculpture();
  });
  handle?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ')
      assemblyActivation = arrival.isAssemblyTrigger(event);
    if (
      ![
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'Escape',
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    cancelDrag();
    if (event.key === 'Home') {
      physics.yaw = physics.pitch = interaction.rotationTime = 0;
    } else if (event.key === 'ArrowLeft') physics.yaw -= 0.2;
    else if (event.key === 'ArrowRight') physics.yaw += 0.2;
    else if (event.key === 'ArrowUp') physics.pitch -= 0.2;
    else if (event.key === 'ArrowDown') physics.pitch += 0.2;
  });
  window.addEventListener('blur', cancelDrag);
  window.addEventListener('scroll', cancelDrag, { passive: true });
  document.querySelectorAll('dialog').forEach((dialog) => {
    new MutationObserver(() => {
      if (dialog.open) {
        arrival.finish();
        cancelDrag();
      }
    }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  });

  function draw(timestamp: number) {
    if (!enabled || document.hidden || !sceneVisible() || workerFailed) {
      clearScene();
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(draw);
    // Background motion is slower on small/touch screens; direct manipulation
    // keeps the higher frame rate on desktop.
    const compact = width < 700 || !finePointer.matches;
    const elapsed = timestamp - lastFrame;
    if (
      elapsed <
      (compact
        ? drag.active || physics.moving || arrival.assembling
          ? 32
          : 48
        : arrival.assembling || drag.pointerId !== null || physics.moving
          ? 15
          : 32)
    )
      return;
    interaction.assembly = arrival.progress(timestamp);
    time += Math.min(elapsed, 64) / 1000;
    if (drag.pointerId === null) {
      interaction.rotationTime += Math.min(elapsed, 64) / 1000;
      physics.step(Math.min(elapsed, 64) / 1000);
    }
    interaction.yaw = physics.yaw;
    interaction.pitch = physics.pitch;
    lastFrame = timestamp;
    pointer.x += (pointer.targetX - pointer.x) * 0.055;
    pointer.y += (pointer.targetY - pointer.y) * 0.055;
    if (sceneVisible()) {
      if (useWorker) {
        startSceneWorker();
        if (sceneWorker && !workerBusy) {
          workerBusy = true;
          sendScene({
            type: 'render',
            time,
            x: scene.x + pointer.x * 12,
            y: scene.y + Math.sin(interaction.rotationTime * 0.7) * 8,
            scale: scene.scale,
            pointerX: pointer.x,
            pointerY: pointer.y,
            opacity: scene.opacity,
            compact,
            interaction,
          });
        }
        return;
      }
      const ctx = context!;
      ctx.clearRect(0, 0, width, height);
      if (!drawSculpture || compactScene !== compact) {
        drawSculpture = createSculpture({ compact });
        compactScene = compact;
      }
      drawSculpture(
        ctx,
        time,
        scene.x + pointer.x * 12,
        scene.y + Math.sin(interaction.rotationTime * 0.7) * 8,
        scene.scale,
        pointer.x,
        pointer.y,
        scene.opacity,
        interaction,
      );
    }
  }

  const scrollDepth = initializeScrollDepth();

  const rows = document.querySelectorAll<HTMLElement>(
    '.repository-link, .image-stage, .tour-trigger, .button, .contact-links a, .site-header nav a',
  );
  const resets: (() => void)[] = [];
  rows.forEach((row) => {
    let rectangle: DOMRect;
    let rowFrame = 0;
    let x = 0,
      y = 0;
    const reset = () => {
      cancelAnimationFrame(rowFrame);
      rowFrame = 0;
      row.style.removeProperty('--rotate-x');
      row.style.removeProperty('--rotate-y');
      row.style.removeProperty('--magnet-x');
      row.style.removeProperty('--magnet-y');
      row.removeAttribute('data-pointer');
      row.removeAttribute('data-touch');
    };
    resets.push(reset);
    row.addEventListener('pointerenter', () => {
      rectangle = row.getBoundingClientRect();
    });
    row.addEventListener('pointermove', (event) => {
      if (!enabled || !finePointer.matches || event.pointerType === 'touch')
        return;
      rectangle ??= row.getBoundingClientRect();
      x = event.clientX - rectangle.left;
      y = event.clientY - rectangle.top;
      if (rowFrame) return;
      rowFrame = requestAnimationFrame(() => {
        rowFrame = 0;
        if (!enabled || !finePointer.matches) return;
        row.setAttribute('data-pointer', 'active');
        row.style.setProperty('--spot-x', `${x}px`);
        row.style.setProperty('--spot-y', `${y}px`);
        row.style.setProperty(
          '--magnet-x',
          `${Math.max(-1, Math.min(1, x / rectangle.width - 0.5)) * 5}px`,
        );
        row.style.setProperty(
          '--magnet-y',
          `${Math.max(-1, Math.min(1, y / rectangle.height - 0.5)) * 5}px`,
        );
        row.style.setProperty(
          '--rotate-x',
          `${-(y / rectangle.height - 0.5) * (row.matches('.image-stage') ? 5 : 3)}deg`,
        );
        row.style.setProperty(
          '--rotate-y',
          `${(x / rectangle.width - 0.5) * (row.matches('.image-stage') ? 5 : 2)}deg`,
        );
      });
    });
    row.addEventListener('pointerleave', reset);
    row.addEventListener(
      'pointerdown',
      (event) => {
        if (!enabled || event.pointerType !== 'touch' || !event.isPrimary)
          return;
        const bounds = row.getBoundingClientRect();
        row.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`);
        row.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`);
        row.dataset.touch = '';
      },
      { passive: true },
    );
    row.addEventListener('pointerup', reset);
    row.addEventListener('pointercancel', reset);
    window.addEventListener('scroll', reset, { passive: true });
  });

  function configure() {
    enabled = !paused && !reducedMotion.matches;
    if (!enabled) arrival.finish();
    root.dataset.motion = enabled ? 'on' : 'off';
    scrollDepth.configure(enabled);
    configureHandle();
    if (atmosphere) atmosphere.hidden = !enabled;
    if (atmosphere) atmosphere.dataset.suspended = String(document.hidden);
    toggle!.hidden = false;
    toggle!.disabled = reducedMotion.matches;
    toggle!.textContent = reducedMotion.matches
      ? t.motionReduced
      : paused
        ? t.motionResume
        : t.motionPause;
    toggle!.setAttribute('aria-pressed', String(!enabled));
    updateNavigationClearance();
    updateProgress();
    if (enabled && !document.hidden && !frame && sceneVisible()) {
      lastFrame = performance.now();
      frame = requestAnimationFrame(draw);
    } else if (!enabled) {
      cancelAnimationFrame(frame);
      frame = 0;
      clearScene();
      resets.forEach((reset) => reset());
      resetAtmosphere();
    }
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    try {
      localStorage.setItem('portfolio-motion', paused ? 'off' : 'on');
    } catch {
      /* No persistence required. */
    }
    configure();
  });
  window.addEventListener(
    'pointermove',
    (event) => {
      if (
        !enabled ||
        drag.pointerId !== null ||
        !finePointer.matches ||
        event.pointerType === 'touch' ||
        document.querySelector('dialog[open]')
      )
        return;
      pointer.targetX = (event.clientX / width - 0.5) * 2;
      pointer.targetY = (event.clientY / height - 0.5) * 2;
      ambientX = event.clientX;
      ambientY = event.clientY;
      if (ambientFrame || !atmosphere) return;
      ambientFrame = requestAnimationFrame(() => {
        ambientFrame = 0;
        if (!enabled || !finePointer.matches) return;
        atmosphere.dataset.active = 'true';
        atmosphere.style.setProperty('--ambient-x', `${ambientX}px`);
        atmosphere.style.setProperty('--ambient-y', `${ambientY}px`);
      });
    },
    { passive: true },
  );
  window.addEventListener(
    'pointerdown',
    (event) => {
      if (
        !enabled ||
        !finePointer.matches ||
        event.pointerType === 'touch' ||
        !pulse ||
        document.querySelector('dialog[open]')
      )
        return;
      pulse.style.left = `${event.clientX}px`;
      pulse.style.top = `${event.clientY}px`;
      pulse.getAnimations().forEach((animation) => animation.cancel());
      pulse.animate(
        [
          { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 0.22 },
          { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 },
        ],
        { duration: 650, easing: 'ease-out' },
      );
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', resetAtmosphere);
  window.addEventListener('blur', resetAtmosphere);
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', updateProgress, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelDrag();
      if (atmosphere) atmosphere.dataset.suspended = 'true';
      cancelAnimationFrame(frame);
      frame = 0;
      resets.forEach((reset) => reset());
      resetAtmosphere();
    } else configure();
  });
  reducedMotion.addEventListener('change', configure);
  finePointer.addEventListener('change', () => {
    configureHandle();
    resets.forEach((reset) => reset());
    resetAtmosphere();
    updateProgress();
  });
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    try {
      paused = localStorage.getItem('portfolio-motion') === 'off';
    } catch {
      /* Preserve the current preference if storage is unavailable. */
    }
    resize();
    configure();
  });
  if (header)
    new ResizeObserver(() => {
      updateNavigationClearance();
      configureHandle();
    }).observe(header);
  resize();
  configure();
  arrival.start(enabled, sceneVisible());
}
