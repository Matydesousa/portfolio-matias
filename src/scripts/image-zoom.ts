// Coordinates are CSS pixels relative to the viewport centre; scale 1 fits
// the complete image. Limit panning so a magnified edge cannot leave a gap.
export function createImageZoom(
  viewer: HTMLDialogElement,
  image: HTMLImageElement,
) {
  const stage = viewer.querySelector<HTMLElement>('.image-viewport')!;
  const plus = viewer.querySelector<HTMLButtonElement>('[data-zoom-in]')!;
  const minus = viewer.querySelector<HTMLButtonElement>('[data-zoom-out]')!;
  const reset = viewer.querySelector<HTMLButtonElement>('[data-zoom-fit]')!;
  const level = viewer.querySelector<HTMLOutputElement>('.image-zoom-level')!;
  const pointers = new Map<number, { x: number; y: number }>();
  let scale = 1;
  let x = 0;
  let y = 0;
  let width = 0;
  let height = 0;
  let start = { x: 0, y: 0 };
  let moved = false;
  let multiple = false;
  let touchUntil = 0;
  let lastTap = { time: 0, x: 0, y: 0 };
  const clamp = (value: number, limit: number) =>
    Math.max(-limit, Math.min(limit, value));

  function paint() {
    x = clamp(x, Math.max(0, (width * scale - stage.clientWidth) / 2));
    y = clamp(y, Math.max(0, (height * scale - stage.clientHeight) / 2));
    image.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
    stage.dataset.zoomed = String(scale > 1.001);
    level.value = `${Math.round(scale * 100)}%`;
    minus.disabled = reset.disabled = scale <= 1.001;
    plus.disabled = scale >= 8;
    // Do not strand keyboard focus when its button reaches a limit.
    if (
      (document.activeElement === minus && minus.disabled) ||
      (document.activeElement === reset && reset.disabled)
    )
      plus.focus({ preventScroll: true });
    if (document.activeElement === plus && plus.disabled)
      minus.focus({ preventScroll: true });
  }

  function fit() {
    pointers.forEach((_, id) => {
      if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
    });
    pointers.clear();
    stage.removeAttribute('data-dragging');
    lastTap.time = 0;
    scale = 1;
    x = y = 0;
    // The source dimensions also work before a lazy image finishes loading.
    const sourceWidth = Number(image.getAttribute('width'));
    const sourceHeight = Number(image.getAttribute('height'));
    const ratio = Math.min(
      stage.clientWidth / sourceWidth,
      stage.clientHeight / sourceHeight,
    );
    width = sourceWidth * ratio;
    height = sourceHeight * ratio;
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    paint();
  }

  function zoomTo(next: number, clientX?: number, clientY?: number) {
    const bounds = stage.getBoundingClientRect();
    const anchorX =
      (clientX ?? bounds.left + bounds.width / 2) -
      bounds.left -
      bounds.width / 2;
    const anchorY =
      (clientY ?? bounds.top + bounds.height / 2) -
      bounds.top -
      bounds.height / 2;
    const nextScale = Math.max(1, Math.min(8, next));
    const ratio = nextScale / scale;
    x = anchorX - (anchorX - x) * ratio;
    y = anchorY - (anchorY - y) * ratio;
    scale = nextScale;
    paint();
  }
  const toggle = (clientX: number, clientY: number) => {
    if (scale > 1.001) fit();
    else zoomTo(2.5, clientX, clientY);
  };
  plus.addEventListener('click', () => zoomTo(scale * 1.5));
  minus.addEventListener('click', () => zoomTo(scale / 1.5));
  reset.addEventListener('click', fit);
  // The image surface owns its gestures. Prevent native tap synthesis here
  // so a pinch/drag cannot swallow the next tap on the surrounding controls.
  stage.addEventListener('touchstart', (event) => event.preventDefault(), {
    passive: false,
  });
  stage.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const pixels =
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? stage.clientHeight
            : 1);
      zoomTo(
        scale * Math.exp(-Math.max(-120, Math.min(120, pixels)) * 0.003),
        event.clientX,
        event.clientY,
      );
    },
    { passive: false },
  );
  stage.addEventListener('dblclick', (event) => {
    if (performance.now() < touchUntil) return;
    event.preventDefault();
    toggle(event.clientX, event.clientY);
  });
  stage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    if (!pointers.size) {
      start = { x: event.clientX, y: event.clientY };
      moved = multiple = false;
    } else {
      multiple = true;
      lastTap.time = 0;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    stage.setPointerCapture(event.pointerId);
    stage.focus({ preventScroll: true });
    stage.dataset.dragging = 'true';
  });
  stage.addEventListener('pointermove', (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    moved ||= Math.hypot(next.x - start.x, next.y - start.y) > 6;
    const other = [...pointers.entries()].find(
      ([id]) => id !== event.pointerId,
    )?.[1];
    if (other) {
      const oldDistance = Math.hypot(
        previous.x - other.x,
        previous.y - other.y,
      );
      const newDistance = Math.hypot(next.x - other.x, next.y - other.y);
      const midX = (previous.x + other.x) / 2;
      const midY = (previous.y + other.y) / 2;
      if (oldDistance > 2)
        zoomTo((scale * newDistance) / oldDistance, midX, midY);
      x += (next.x - previous.x) / 2;
      y += (next.y - previous.y) / 2;
    } else {
      x += next.x - previous.x;
      y += next.y - previous.y;
    }
    pointers.set(event.pointerId, next);
    paint();
  });
  function endPointer(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    if (stage.hasPointerCapture(event.pointerId))
      stage.releasePointerCapture(event.pointerId);
    if (!pointers.size) stage.removeAttribute('data-dragging');
    if (event.pointerType === 'touch') touchUntil = performance.now() + 500;
    if (
      event.type === 'pointerup' &&
      event.pointerType === 'touch' &&
      !moved &&
      !multiple
    ) {
      const now = performance.now();
      if (
        lastTap.time > 0 &&
        now - lastTap.time < 320 &&
        Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 28
      ) {
        toggle(event.clientX, event.clientY);
        lastTap.time = 0;
      } else lastTap = { time: now, x: event.clientX, y: event.clientY };
    } else lastTap.time = 0;
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('lostpointercapture', (event) => {
    pointers.delete(event.pointerId);
    if (!pointers.size) stage.removeAttribute('data-dragging');
  });
  viewer.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === '+' || event.key === '=') zoomTo(scale * 1.5);
    else if (event.key === '-' || event.key === '−') zoomTo(scale / 1.5);
    else if (event.key === '0') fit();
    else if (
      event.target === stage &&
      scale > 1.001 &&
      event.key.startsWith('Arrow')
    ) {
      if (event.key === 'ArrowLeft') x += 60;
      if (event.key === 'ArrowRight') x -= 60;
      if (event.key === 'ArrowUp') y += 60;
      if (event.key === 'ArrowDown') y -= 60;
      paint();
    } else return;
    event.preventDefault();
  });
  new ResizeObserver(() => {
    if (viewer.open) fit();
  }).observe(stage);
  return { fit };
}
