import { createSculpture, type SculptureInteraction } from './scene';

export type SceneWorkerMessage =
  | { type: 'init'; canvas: OffscreenCanvas }
  | { type: 'resize'; width: number; height: number; ratio: number }
  | { type: 'clear' }
  | {
      type: 'render';
      time: number;
      x: number;
      y: number;
      scale: number;
      pointerX: number;
      pointerY: number;
      opacity: number;
      compact: boolean;
      interaction: SculptureInteraction;
    };

let canvas: OffscreenCanvas;
let context: OffscreenCanvasRenderingContext2D | null;
let width = 0;
let height = 0;
let compactScene = false;
let render: ReturnType<typeof createSculpture> | undefined;

self.addEventListener('message', (event: MessageEvent<SceneWorkerMessage>) => {
  const message = event.data;
  if (message.type === 'init') {
    canvas = message.canvas;
    context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D unavailable');
    return;
  }
  if (!context) return;
  if (message.type === 'resize') {
    width = message.width;
    height = message.height;
    canvas.width = Math.round(width * message.ratio);
    canvas.height = Math.round(height * message.ratio);
    context.setTransform(message.ratio, 0, 0, message.ratio, 0, 0);
    return;
  }
  context.clearRect(0, 0, width, height);
  if (message.type === 'clear') return;
  if (!render || compactScene !== message.compact) {
    render = createSculpture({ compact: message.compact });
    compactScene = message.compact;
  }
  render(
    context,
    message.time,
    message.x,
    message.y,
    message.scale,
    message.pointerX,
    message.pointerY,
    message.opacity,
    message.interaction,
  );
  // One frame in flight: do not build a queue when a device is busy.
  self.postMessage('rendered');
});
