/** Hidden reward for sustained, repeated fast grabs, never for automatic motion. */
export class RibbonSurge {
  readonly duration = 4000;
  private distance = 0;
  private gestures = 0;
  private gestureDistance = 0;
  private counted = false;
  private lastFast = -Infinity;
  private started = -Infinity;
  private cooldownUntil = 0;
  direction = 1;

  begin(now: number) {
    if (now - this.lastFast > 2500) this.clearCharge();
    this.gestureDistance = 0;
    this.counted = false;
  }

  drag(distance: number, seconds: number, cycle: number, now: number) {
    if (now < this.cooldownUntil || !cycle) return;
    if (now - this.lastFast > 2500) this.clearCharge();
    const speed = Math.abs(distance) / Math.max(0.008, seconds);
    if (speed < Math.max(650, cycle * 0.24)) return;
    this.lastFast = now;
    this.distance += Math.abs(distance);
    this.gestureDistance += Math.abs(distance);
    if (!this.counted && this.gestureDistance >= Math.max(80, cycle * 0.035)) {
      this.counted = true;
      this.gestures++;
    }
    // Several separate swipes AND substantial travel: one throw, even very
    // long, cannot reveal the surprise. Inertia/cursor/autoplay never count.
    if (this.gestures >= 3 && this.distance >= Math.max(800, cycle * 0.6)) {
      this.started = now;
      this.cooldownUntil = now + this.duration + 3500;
      this.direction = distance > 0 ? -1 : 1;
      this.clearCharge();
    }
  }

  progress(now: number) {
    const elapsed = now - this.started;
    return elapsed >= 0 && elapsed < this.duration
      ? elapsed / this.duration
      : null;
  }

  reset(now: number) {
    this.clearCharge();
    this.started = -Infinity;
    this.cooldownUntil = now;
    this.direction = 1;
  }

  private clearCharge() {
    this.distance = this.gestureDistance = this.gestures = 0;
    this.counted = false;
    this.lastFast = -Infinity;
  }
}
