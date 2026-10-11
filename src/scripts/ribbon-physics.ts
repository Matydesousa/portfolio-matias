/** One-dimensional momentum. Pixel distances and friction are frame independent. */
export class RibbonPhysics {
  position = 0;
  velocity = 0;
  readonly baseSpeed = -48;
  drag(distance: number, seconds: number) {
    this.position += distance;
    const dt = Math.max(0.008, Math.min(0.08, seconds));
    const target =
      Math.max(-1800, Math.min(1800, distance / dt)) - this.baseSpeed;
    this.velocity += (target - this.velocity) * (1 - Math.exp(-dt / 0.045));
  }
  release(idleSeconds: number) {
    this.velocity =
      idleSeconds >= 0.14
        ? 0
        : this.velocity * Math.exp(-Math.max(0, idleSeconds) * 15);
  }
  step(seconds: number, automatic = true) {
    const decay = Math.exp(-2.2 * seconds);
    this.position +=
      (automatic ? this.baseSpeed * seconds : 0) +
      (this.velocity * (1 - decay)) / 2.2;
    this.velocity *= decay;
    if (Math.abs(this.velocity) < 0.5) this.velocity = 0;
  }
  stop() {
    this.velocity = 0;
  }
}
