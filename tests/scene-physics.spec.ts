import { test, expect } from '@playwright/test';
import { RotationPhysics } from '../src/scripts/scene-physics';

test('un giro rápido acumula más velocidad que el mismo recorrido lento', () => {
  const fast = new RotationPhysics(),
    slow = new RotationPhysics();
  for (let i = 0; i < 8; i++) {
    fast.drag(8, -4, 0.01);
    slow.drag(8, -4, 0.08);
  }
  expect(fast.yaw).toBeCloseTo(slow.yaw, 10);
  expect(fast.pitch).toBeCloseTo(slow.pitch, 10);
  expect(fast.velocityYaw).toBeGreaterThan(slow.velocityYaw * 3);
  expect(Math.abs(fast.velocityPitch)).toBeGreaterThan(
    Math.abs(slow.velocityPitch) * 3,
  );
});

test('la inercia continúa en ambos ejes y pierde velocidad hasta la rotación habitual', () => {
  const rotation = new RotationPhysics();
  rotation.drag(40, -30, 0.02);
  rotation.release(0);
  const yaw = rotation.yaw,
    pitch = rotation.pitch,
    speed = rotation.velocityYaw;
  rotation.step(0.1);
  expect(rotation.yaw).toBeGreaterThan(yaw);
  expect(rotation.pitch).toBeLessThan(pitch);
  expect(rotation.velocityYaw).toBeGreaterThan(0);
  expect(rotation.velocityYaw).toBeLessThan(speed);
  rotation.step(5);
  expect(rotation.velocityYaw).toBe(0);
  expect(rotation.velocityPitch).toBe(0);
});

test('fricción y distancia de giro son equivalentes a 30, 60 y 144 fps', () => {
  const results = [30, 60, 144].map((fps) => {
    const rotation = new RotationPhysics();
    rotation.drag(40, 20, 0.02);
    rotation.release(0);
    for (let i = 0; i < fps * 2; i++) rotation.step(1 / fps);
    return [
      rotation.yaw,
      rotation.pitch,
      rotation.velocityYaw,
      rotation.velocityPitch,
    ];
  });
  for (const result of results.slice(1))
    result.forEach((value, i) => expect(value).toBeCloseTo(results[0][i], 10));
});

test('sostener quieto frena el giro y un movimiento contrario invierte el impulso', () => {
  const rotation = new RotationPhysics();
  for (let i = 0; i < 4; i++) rotation.drag(20, 0, 0.02);
  expect(rotation.velocityYaw).toBeGreaterThan(0);
  for (let i = 0; i < 4; i++) rotation.drag(-20, 0, 0.02);
  expect(rotation.velocityYaw).toBeLessThan(0);
  rotation.release(0.2);
  expect(rotation.velocityYaw).toBe(0);
  const yaw = rotation.yaw;
  rotation.step(1);
  expect(rotation.yaw).toBe(yaw);
});

test('el impulso tiene un límite y cancelar detiene la inercia sin perder orientación', () => {
  const rotation = new RotationPhysics();
  for (let i = 0; i < 10; i++) rotation.drag(10000, -10000, 0.001);
  expect(Math.abs(rotation.velocityYaw)).toBeLessThanOrEqual(12);
  expect(Math.abs(rotation.velocityPitch)).toBeLessThanOrEqual(12);
  const yaw = rotation.yaw,
    pitch = rotation.pitch;
  rotation.stop();
  rotation.step(1);
  expect(rotation.yaw).toBe(yaw);
  expect(rotation.pitch).toBe(pitch);
});
