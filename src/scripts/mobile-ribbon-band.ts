interface Texture {
  image: HTMLCanvasElement;
  width: number;
  height: number;
  paddingX: number;
  paddingY: number;
}

export interface BandPose {
  phase: number;
  sinPhase: number;
  cosPhase: number;
  sinPitch: number;
  cosPitch: number;
  radiusX: number;
  radiusZ: number;
  projected: boolean;
  perspective: number;
  lift: number;
  offsetX: number;
  offsetY: number;
  tone: number;
  wakeIntensity: number;
  wakeProgress: number;
  wakeDirection: number;
}

/** Decorative mobile band; native cards and the controller own all interaction. */
export class MobileRibbonBand {
  private context: CanvasRenderingContext2D | null;
  private textures: { band: Texture; wake: Texture }[] = [];
  private units: { sine: number; cosine: number }[] = [];
  private order: number[] = [];
  private width = 0;
  private height = 0;
  private bandWidth = 0;
  private halfSin = 0;
  private halfCos = 0;
  private ratio = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('2d');
  }

  get supported() {
    return this.context !== null;
  }

  prepare(
    ribbon: HTMLElement,
    segment: HTMLElement,
    width: number,
    height: number,
    bandWidth: number,
    bandHeight: number,
    count: number,
  ) {
    if (!this.context) return false;
    this.width = width;
    this.height = height;
    this.bandWidth = bandWidth;
    // The band has no text; cap backing pixels without changing card sharpness.
    this.ratio = Math.min(2, devicePixelRatio || 1);
    this.canvas.width = Math.ceil(width * this.ratio);
    this.canvas.height = Math.ceil(height * this.ratio);
    this.halfSin = Math.sin(Math.PI / count);
    this.halfCos = Math.cos(Math.PI / count);
    this.units = Array.from({ length: count }, (_, index) => {
      const angle = (index * Math.PI * 2) / count;
      return { sine: Math.sin(angle), cosine: Math.cos(angle) };
    });
    this.order = Array.from({ length: count }, (_, index) => index);
    const tone = ribbon.dataset.tone!;
    const hadWake = ribbon.hasAttribute('data-wake');
    const textures: typeof this.textures = [];
    // Read the existing scoped SVG/CSS once per measurement, never during RAF.
    // No frame is displayed between these synchronous palette samples.
    try {
      ribbon.dataset.wake = '';
      for (let value = 0; value < 3; value++) {
        ribbon.dataset.tone = String(value);
        const band = this.texture(segment, bandWidth, bandHeight, false);
        const wake = this.texture(segment, bandWidth, bandHeight, true);
        if (!band || !wake) return false;
        textures.push({ band, wake });
      }
    } catch {
      // Keep the original SVG renderer if rasterization is unavailable.
      return false;
    } finally {
      ribbon.dataset.tone = tone;
      if (!hadWake) delete ribbon.dataset.wake;
    }
    this.textures = textures;
    return true;
  }

  private texture(
    segment: HTMLElement,
    width: number,
    height: number,
    wake: boolean,
  ): Texture | null {
    const paddingX = wake ? 16 : 12;
    const paddingY = wake ? height * 0.65 : 12;
    const image = document.createElement('canvas');
    const logicalWidth = width + paddingX * 2;
    const logicalHeight = height + paddingY * 2;
    image.width = Math.ceil(logicalWidth * this.ratio);
    image.height = Math.ceil(logicalHeight * this.ratio);
    const ctx = image.getContext('2d');
    if (!ctx) return null;
    ctx.scale(this.ratio, this.ratio);
    ctx.translate(paddingX, paddingY);
    const style = getComputedStyle(segment);
    const fillGradient = (background: string) => {
      const colors = background.match(/rgba?\([^)]*\)/g);
      if (!colors?.length) return;
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      // CSS gradients mix premultiplied alpha; canvas gradients can mix the
      // raw RGB values instead, making the navy band visibly brighter. Sample
      // the CSS blend once into the cached texture, not during animation.
      const stops = colors.map((color, index) => ({
        at: index === 0 ? 0 : index === colors.length - 1 ? 1 : 0.48,
        rgba: color.match(/[\d.]+/g)!.map(Number),
      }));
      for (let index = 1; index < stops.length; index++) {
        const first = stops[index - 1];
        const last = stops[index];
        for (let sample = 0; sample <= 16; sample++) {
          const progress = sample / 16;
          const a = (first.rgba[3] ?? 1) * (1 - progress);
          const b = (last.rgba[3] ?? 1) * progress;
          const alpha = a + b;
          const rgb = first.rgba
            .slice(0, 3)
            .map((value, channel) =>
              alpha ? (value * a + last.rgba[channel] * b) / alpha : 0,
            );
          gradient.addColorStop(
            first.at + (last.at - first.at) * progress,
            `rgba(${rgb.join(',')},${alpha})`,
          );
        }
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };
    if (!wake) {
      if (style.boxShadow !== 'none') {
        ctx.save();
        ctx.strokeStyle = '#ffffff18';
        ctx.shadowColor = '#ffffff08';
        ctx.shadowBlur = 12 * this.ratio;
        ctx.shadowOffsetY = -3 * this.ratio;
        ctx.strokeRect(0, 0, width, height);
        ctx.restore();
      }
      ctx.fillStyle = style.backgroundColor;
      ctx.fillRect(0, 0, width, height);
      fillGradient(style.backgroundImage);
      fillGradient(getComputedStyle(segment, '::before').backgroundImage);
      for (const [color, x1, y1, x2, y2] of [
        [style.borderTopColor, 0, 0, width, 0],
        [style.borderBottomColor, 0, height, width, height],
        ...(parseFloat(style.borderLeftWidth)
          ? [[style.borderLeftColor, 0, 0, 0, height]]
          : []),
      ] as [string, number, number, number, number][]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    const svg = segment.querySelector<SVGSVGElement>(
      wake ? '.ribbon-wake' : '.ribbon-mesh',
    )!;
    const mapping = new DOMMatrix().scale(width / 40, height / 120);
    const meshOpacity = wake ? 1 : Number(getComputedStyle(svg).opacity);
    svg.querySelectorAll<SVGElement>('path, circle').forEach((shape) => {
      let ancestor: Element | null = shape;
      while (ancestor && ancestor !== svg) {
        if (getComputedStyle(ancestor).display === 'none') return;
        ancestor = ancestor.parentElement;
      }
      const computed = getComputedStyle(shape);
      const path = new Path2D();
      if (shape.tagName.toLowerCase() === 'circle') {
        const circle = new Path2D();
        circle.arc(
          Number(shape.getAttribute('cx')),
          Number(shape.getAttribute('cy')),
          Number(shape.getAttribute('r')),
          0,
          Math.PI * 2,
        );
        path.addPath(circle, mapping);
      } else path.addPath(new Path2D(shape.getAttribute('d')!), mapping);
      ctx.save();
      ctx.globalAlpha = meshOpacity * Number(computed.opacity);
      if (wake) {
        ctx.shadowColor = computed.stroke;
        ctx.shadowBlur = 5 * this.ratio;
      }
      if (computed.fill !== 'none') {
        ctx.fillStyle = computed.fill;
        ctx.fill(path);
      }
      if (computed.stroke !== 'none') {
        ctx.strokeStyle = computed.stroke;
        ctx.lineWidth = parseFloat(computed.strokeWidth);
        ctx.lineCap = computed.strokeLinecap as CanvasLineCap;
        ctx.stroke(path);
      }
      ctx.restore();
    });
    return {
      image,
      width: logicalWidth,
      height: logicalHeight,
      paddingX,
      paddingY,
    };
  }

  draw(pose: BandPose) {
    const ctx = this.context;
    const texture = this.textures[pose.tone];
    if (!ctx || !texture) return;
    ctx.resetTransform();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const x = pose.radiusX - 8;
    const z = pose.radiusZ - 8;
    const perspective = pose.projected ? 1200 : pose.perspective;
    const ratio = this.ratio;
    if (!pose.projected)
      this.order.sort((first, last) => {
        const a = this.units[first];
        const b = this.units[last];
        return (
          pose.cosPhase * (a.cosine - b.cosine) -
          pose.sinPhase * (a.sine - b.sine)
        );
      });
    for (const index of this.order) {
      const unit = this.units[index];
      const sine = pose.sinPhase * unit.cosine + pose.cosPhase * unit.sine;
      const cosine = pose.cosPhase * unit.cosine - pose.sinPhase * unit.sine;
      const length = Math.hypot(x * cosine, z * sine);
      const normalSin = (z * sine) / length;
      const normalCos = (x * cosine) / length;
      const stretch = (2 * this.halfSin * length + 0.8) / this.bandWidth;
      const px = x * sine * this.halfCos;
      const pz = z * cosine * this.halfCos;
      // Match the controller's affine compact projection. Landscape also
      // projects the track's native perspective, including its lifted origin.
      const py = -pz * pose.sinPitch;
      const centerX = px + (pose.projected ? 0 : pose.offsetX);
      const centerY = py + (pose.projected ? 0 : pose.offsetY - pose.lift);
      const scale =
        perspective / (perspective - pz * pose.cosPitch + pose.radiusZ);
      const slope = (scale * scale) / perspective;
      const depthX = -normalSin * pose.cosPitch;
      const a = (scale * normalCos + centerX * slope * depthX) * stretch;
      const b =
        (scale * normalSin * pose.sinPitch + centerY * slope * depthX) *
        stretch;
      const c = centerX * slope * pose.sinPitch;
      const d = scale * pose.cosPitch + centerY * slope * pose.sinPitch;
      const originX = this.width / 2 + (pose.projected ? pose.offsetX : 0);
      const originY =
        this.height / 2 + (pose.projected ? pose.offsetY - pose.lift : 0);
      ctx.setTransform(
        ratio * a,
        ratio * b,
        ratio * c,
        ratio * d,
        ratio * (originX + centerX * scale),
        ratio * (originY + centerY * scale),
      );
      ctx.globalAlpha =
        pose.tone === 0 ? 1 : 0.2 + Math.max(0, normalCos) * 0.8;
      ctx.drawImage(
        texture.band.image,
        -this.bandWidth / 2 - texture.band.paddingX,
        -(texture.band.height - 2 * texture.band.paddingY) / 2 -
          texture.band.paddingY,
        texture.band.width,
        texture.band.height,
      );
      if (pose.wakeIntensity) {
        const angle = pose.phase + (index * Math.PI * 2) / this.units.length;
        const pocket =
          Math.max(
            0,
            Math.cos(
              angle * 3 -
                pose.phase * 2 +
                pose.wakeProgress * 18 * pose.wakeDirection,
            ),
          ) ** 3;
        ctx.globalAlpha *=
          pose.wakeIntensity *
          (0.5 + pocket * 0.5) *
          (0.55 + Math.max(0, cosine) * 0.45);
        ctx.scale(pose.wakeDirection, 1 + pose.wakeProgress * 0.5);
        ctx.drawImage(
          texture.wake.image,
          -this.bandWidth / 2 - texture.wake.paddingX,
          -(texture.wake.height - 2 * texture.wake.paddingY) / 2 -
            texture.wake.paddingY,
          texture.wake.width,
          texture.wake.height,
        );
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.textures = [];
    this.canvas.width = this.canvas.height = 0;
  }
}
