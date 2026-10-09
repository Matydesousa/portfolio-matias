/** Progressive enhancement: all content and links work without this module. */
export function initializeMotion() {
  const canvas = document.querySelector<HTMLCanvasElement>('.ambient-canvas');
  const context = canvas?.getContext('2d');
  const toggle = document.querySelector<HTMLButtonElement>('.motion-toggle');
  if (!canvas || !context || !toggle) return;

  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const progress = document.querySelector<HTMLElement>('.reading-progress');
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
  const stars = Array.from({ length: 66 }, (_, index) => {
    const y = 1 - (index / 65) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = index * Math.PI * (3 - Math.sqrt(5));
    return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
  });

  function updateProgress() {
    const total = root.scrollHeight - innerHeight;
    scroll = total > 0 ? window.scrollY / total : 0;
    progress?.style.setProperty('--progress', String(scroll));
  }

  function resize() {
    width = innerWidth;
    height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas!.width = Math.round(width * ratio);
    canvas!.height = Math.round(height * ratio);
    context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    updateProgress();
  }

  function draw(timestamp: number) {
    if (!enabled || document.hidden) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(draw);
    // Cap rendering at 30 fps; advancing by elapsed time keeps motion consistent.
    const elapsed = timestamp - lastFrame;
    if (elapsed < 32) return;
    time += Math.min(elapsed, 64) / 1000;
    lastFrame = timestamp;
    const ctx = context!;
    ctx.clearRect(0, 0, width, height);
    pointer.x += (pointer.targetX - pointer.x) * 0.055;
    pointer.y += (pointer.targetY - pointer.y) * 0.055;
    const angle = time * 0.12 + pointer.x * 0.32;
    const tilt = 0.18 + pointer.y * 0.22;
    const radius = Math.min(width * 0.22, 245);
    const centerX = width * (width < 700 ? 0.82 : 0.8) + pointer.x * 22;
    const centerY = Math.min(height * 0.34, 325) - scroll * 95;
    const points = stars.map((point) => {
      const x = point.x * Math.cos(angle) - point.z * Math.sin(angle);
      const z = point.x * Math.sin(angle) + point.z * Math.cos(angle);
      const y = point.y * Math.cos(tilt) - z * Math.sin(tilt);
      const depth = point.y * Math.sin(tilt) + z * Math.cos(tilt);
      const perspective = 3 / (3 - depth * 0.45);
      return {
        x: centerX + x * radius * perspective,
        y: centerY + y * radius * perspective,
        depth,
      };
    });

    // A projected point cloud with connections, orbital traces and travelling signals.
    const opacity = width < 700 ? 0.38 : 0.72;
    ctx.lineWidth = 0.7;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const b = points[j];
        const sourceA = stars[i],
          sourceB = stars[j];
        const distance = Math.hypot(
          sourceA.x - sourceB.x,
          sourceA.y - sourceB.y,
          sourceA.z - sourceB.z,
        );
        if (distance > 0.51) continue;
        const alpha = (0.06 + ((a.depth + b.depth + 2) / 4) * 0.2) * opacity;
        ctx.strokeStyle = `rgba(105,168,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        if ((i + j) % 11 === 0) {
          const phase = (time * 0.2 + i * 0.13) % 1;
          ctx.fillStyle = `rgba(146,211,255,${opacity * 0.65})`;
          ctx.beginPath();
          ctx.arc(
            a.x + (b.x - a.x) * phase,
            a.y + (b.y - a.y) * phase,
            1.6,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
    }
    for (const point of points) {
      ctx.fillStyle = `rgba(147,194,255,${(0.15 + (point.depth + 1) * 0.24) * opacity})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.1 + (point.depth + 1) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let orbit = 0; orbit < 2; orbit++) {
      ctx.strokeStyle = `rgba(102,156,241,${0.12 * opacity})`;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        radius * 1.21,
        radius * (0.3 + orbit * 0.16),
        angle * 0.3 + orbit * 0.9,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08 },
  );

  document
    .querySelectorAll<HTMLElement>(
      '.repository-list > li, .about, .contact, .case-body, .case-image',
    )
    .forEach((element, index) => {
      element.classList.add('motion-reveal');
      element.style.setProperty(
        '--reveal-delay',
        `${Math.min(index % 5, 3) * 75}ms`,
      );
      observer.observe(element);
    });

  const rows = document.querySelectorAll<HTMLElement>('.repository-link');
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
      row.removeAttribute('data-pointer');
    };
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
        row.setAttribute('data-pointer', 'active');
        row.style.setProperty('--spot-x', `${x}px`);
        row.style.setProperty('--spot-y', `${y}px`);
        row.style.setProperty(
          '--rotate-x',
          `${-(y / rectangle.height - 0.5) * 3}deg`,
        );
        row.style.setProperty(
          '--rotate-y',
          `${(x / rectangle.width - 0.5) * 1.4}deg`,
        );
      });
    });
    row.addEventListener('pointerleave', reset);
    window.addEventListener('scroll', reset, { passive: true });
  });

  function configure() {
    enabled = !paused && !reducedMotion.matches;
    root.dataset.motion = enabled ? 'on' : 'off';
    toggle!.hidden = false;
    toggle!.disabled = reducedMotion.matches;
    toggle!.textContent = reducedMotion.matches
      ? 'Movimiento reducido'
      : paused
        ? 'Activar efectos'
        : 'Pausar efectos';
    toggle!.setAttribute('aria-pressed', String(!enabled));
    if (enabled && !document.hidden && !frame) {
      lastFrame = performance.now();
      frame = requestAnimationFrame(draw);
    } else if (!enabled) {
      cancelAnimationFrame(frame);
      frame = 0;
      context!.clearRect(0, 0, width, height);
      rows.forEach((row) => row.removeAttribute('data-pointer'));
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
      if (!finePointer.matches || event.pointerType === 'touch') return;
      pointer.targetX = (event.clientX / width - 0.5) * 2;
      pointer.targetY = (event.clientY / height - 0.5) * 2;
    },
    { passive: true },
  );
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', updateProgress, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else configure();
  });
  reducedMotion.addEventListener('change', configure);
  resize();
  configure();
}
