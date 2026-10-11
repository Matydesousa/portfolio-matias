/** Angular momentum from a drag, with friction independent of the frame rate. */
export class RotationPhysics {
  yaw = 0;
  pitch = 0;
  velocityYaw = 0;
  velocityPitch = 0;
  private readonly friction = 2.2;
  private readonly speedLimit = 12;

  drag(dx: number, dy: number, seconds: number) {
    const dt = Math.max(0.008, Math.min(0.08, seconds));
    const yawDelta = dx * 0.015;
    const pitchDelta = dy * 0.012;
    this.yaw = (this.yaw + yawDelta) % (Math.PI * 2);
    this.pitch = (this.pitch + pitchDelta) % (Math.PI * 2);
    const blend = 1 - Math.exp(-dt / 0.045);
    const limit = (speed: number) =>
      Math.max(-this.speedLimit, Math.min(this.speedLimit, speed));
    this.velocityYaw += (limit(yawDelta / dt) - this.velocityYaw) * blend;
    this.velocityPitch += (limit(pitchDelta / dt) - this.velocityPitch) * blend;
  }

  release(idleSeconds: number) {
    // Holding still before release means braking, not an old flick.
    if (idleSeconds >= 0.14) this.stop();
    else {
      const loss = Math.exp(-Math.max(0, idleSeconds) * 20);
      this.velocityYaw *= loss;
      this.velocityPitch *= loss;
    }
  }

  step(seconds: number) {
    const dt = Math.max(0, seconds);
    const decay = Math.exp(-this.friction * dt);
    const distance = (1 - decay) / this.friction;
    this.yaw = (this.yaw + this.velocityYaw * distance) % (Math.PI * 2);
    this.pitch = (this.pitch + this.velocityPitch * distance) % (Math.PI * 2);
    this.velocityYaw *= decay;
    this.velocityPitch *= decay;
    if (Math.abs(this.velocityYaw) < 0.008) this.velocityYaw = 0;
    if (Math.abs(this.velocityPitch) < 0.008) this.velocityPitch = 0;
  }

  stop() {
    this.velocityYaw = this.velocityPitch = 0;
  }

  get moving() {
    return Math.hypot(this.velocityYaw, this.velocityPitch) > 0.3;
  }
}
