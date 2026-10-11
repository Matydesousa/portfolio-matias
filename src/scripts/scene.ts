import { createSculptureFragments } from './sculpture-fragments';

interface Vector {
  x: number;
  y: number;
  z: number;
}
interface Vertex {
  point: Vector;
  normal: Vector;
}
interface Face {
  vertices: number[];
  normal: Vector;
  seam: boolean;
  piece: number;
}
export interface SculptureInteraction {
  yaw: number;
  pitch: number;
  rotationTime: number;
  wireframe: boolean;
  /** 0 = orbiting puzzle pieces, 1 = original mesh. */
  assembly?: number;
}

const tau = Math.PI * 2;
const normalize = (v: Vector): Vector => {
  const length = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / length, y: v.y / length, z: v.z / length };
};
const cross = (a: Vector, b: Vector): Vector => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const curve = (t: number): Vector => ({
  x: (1 + 0.34 * Math.cos(3 * t)) * Math.cos(2 * t),
  y: (1 + 0.34 * Math.cos(3 * t)) * Math.sin(2 * t),
  z: 0.48 * Math.sin(3 * t),
});

/** A small, precomputed torus-knot mesh. Canvas projects and lights real 3D vertices. */
export function createSculpture() {
  const segments = 96;
  const sides = 8;
  const vertices: Vertex[] = [];
  const faces: Face[] = [];
  for (let ring = 0; ring < segments; ring++) {
    const t = (ring / segments) * tau;
    const center = curve(t);
    const ahead = curve(t + 0.001);
    const tangent = normalize({
      x: ahead.x - center.x,
      y: ahead.y - center.y,
      z: ahead.z - center.z,
    });
    const normal = normalize(cross(tangent, { x: 0, y: 0, z: 1 }));
    const binormal = cross(tangent, normal);
    for (let side = 0; side < sides; side++) {
      const angle = (side / sides) * tau;
      const radial = {
        x: normal.x * Math.cos(angle) + binormal.x * Math.sin(angle),
        y: normal.y * Math.cos(angle) + binormal.y * Math.sin(angle),
        z: normal.z * Math.cos(angle) + binormal.z * Math.sin(angle),
      };
      vertices.push({
        point: {
          x: center.x + radial.x * 0.17,
          y: center.y + radial.y * 0.17,
          z: center.z + radial.z * 0.17,
        },
        normal: radial,
      });
    }
  }
  for (let ring = 0; ring < segments; ring++) {
    for (let side = 0; side < sides; side++) {
      const a = ring * sides + side;
      const b = ((ring + 1) % segments) * sides + side;
      const c = ((ring + 1) % segments) * sides + ((side + 1) % sides);
      const d = ring * sides + ((side + 1) % sides);
      for (const indices of [
        [a, b, c],
        [a, c, d],
      ]) {
        const normal = normalize(
          indices.reduce(
            (sum, i) => ({
              x: sum.x + vertices[i].normal.x,
              y: sum.y + vertices[i].normal.y,
              z: sum.z + vertices[i].normal.z,
            }),
            { x: 0, y: 0, z: 0 },
          ),
        );
        faces.push({
          vertices: indices,
          normal,
          seam: ring % 12 === 0,
          piece: 0,
        });
      }
    }
  }

  const pieces = createSculptureFragments(vertices, faces, segments, sides);
  let orbitSnapshot: number | null = null;

  return function render(
    ctx: CanvasRenderingContext2D,
    time: number,
    centerX: number,
    centerY: number,
    scale: number,
    pointerX: number,
    pointerY: number,
    opacity: number,
    interaction?: SculptureInteraction,
  ) {
    const rotationTime = interaction?.rotationTime ?? time;
    const yaw = rotationTime * 0.16 + pointerX * 0.28 + (interaction?.yaw || 0);
    const pitch =
      -0.7 +
      Math.sin(rotationTime * 0.22) * 0.12 +
      pointerY * 0.2 +
      (interaction?.pitch || 0);
    const roll = 0.32 + rotationTime * 0.055;
    const cy = Math.cos(yaw),
      sy = Math.sin(yaw),
      cp = Math.cos(pitch),
      sp = Math.sin(pitch),
      cr = Math.cos(roll),
      sr = Math.sin(roll);
    const rotate = (v: Vector): Vector => {
      const x = v.x * cy - v.z * sy,
        z = v.x * sy + v.z * cy;
      const y = v.y * cp - z * sp,
        depth = v.y * sp + z * cp;
      return { x: x * cr - y * sr, y: x * sr + y * cr, z: depth };
    };
    const project = (v: Vector) => {
      const perspective = 4.6 / (4.6 - v.z);
      return {
        x: centerX + v.x * scale * perspective,
        y: centerY + v.y * scale * perspective,
        z: v.z,
      };
    };
    ctx.save();
    const assembly = Math.max(0, Math.min(1, interaction?.assembly ?? 1));
    // Freeze each orbit at engagement and take short turns, even after a long wait.
    if (assembly === 0 || assembly === 1) orbitSnapshot = null;
    else orbitSnapshot ??= time;
    const orbitTime = orbitSnapshot ?? time;
    ctx.globalAlpha = opacity * (0.25 + assembly * 0.75);
    const aura = ctx.createRadialGradient(
      centerX,
      centerY,
      scale * 0.2,
      centerX,
      centerY,
      scale * 2.1,
    );
    aura.addColorStop(0, '#3176de30');
    aura.addColorStop(0.55, '#246ad614');
    aura.addColorStop(1, '#246ad600');
    ctx.fillStyle = aura;
    ctx.fillRect(
      centerX - scale * 2.1,
      centerY - scale * 2.1,
      scale * 4.2,
      scale * 4.2,
    );

    // Ground rings give a stable plane beneath the floating object.
    ctx.globalAlpha = opacity * assembly;
    ctx.strokeStyle = '#629eff2b';
    ctx.lineWidth = 0.7;
    for (const radius of [0.75, 1.1, 1.5]) {
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY + scale * 1.45,
        scale * radius,
        scale * radius * 0.17,
        -0.08,
        0,
        tau,
      );
      ctx.stroke();
    }

    ctx.globalAlpha = opacity;
    const projected = vertices.map((vertex) => project(rotate(vertex.point)));
    const fragments =
      assembly < 1
        ? pieces.map((piece) => {
            const progress = Math.max(
              0,
              (assembly - piece.delay) / (1 - piece.delay),
            );
            const distance = 1 - progress * progress * (3 - 2 * progress);
            const orientation = piece.twist + orbitTime * piece.spin;
            const twist =
              Math.atan2(Math.sin(orientation), Math.cos(orientation)) *
              distance;
            const orientationX = orientation * 0.7;
            const twistX =
              Math.atan2(Math.sin(orientationX), Math.cos(orientationX)) *
              distance;
            const c = Math.cos(twist),
              s = Math.sin(twist),
              cx = Math.cos(twistX),
              sx = Math.sin(twistX);
            const turn = (v: Vector): Vector => {
              const x = v.x * c - v.y * s,
                y = v.x * s + v.y * c;
              return { x, y: y * cx - v.z * sx, z: y * sx + v.z * cx };
            };
            const angle = piece.angle + orbitTime * piece.orbitSpeed;
            const orbit = {
              x: Math.cos(angle) * piece.radius,
              y: Math.sin(angle) * piece.radius * 0.82,
              z: Math.sin(angle + piece.twist) * 0.46,
            };
            const size = 1 + (piece.size - 1) * distance;
            const transform = (point: Vector) => {
              const local = turn({
                x: point.x - piece.center.x,
                y: point.y - piece.center.y,
                z: point.z - piece.center.z,
              });
              return project(
                rotate({
                  x:
                    piece.center.x +
                    (orbit.x - piece.center.x) * distance +
                    local.x * size,
                  y:
                    piece.center.y +
                    (orbit.y - piece.center.y) * distance +
                    local.y * size,
                  z:
                    piece.center.z +
                    (orbit.z - piece.center.z) * distance +
                    local.z * size,
                }),
              );
            };
            const points = new Map(
              piece.indices.map((index) => [
                index,
                transform(vertices[index].point),
              ]),
            );
            return { points, turn, back: transform(piece.back), distance };
          })
        : null;
    const visibleFaces = faces
      .map((face) => {
        const fragment = fragments?.[face.piece];
        const points = face.vertices.map(
          (i) => fragment?.points.get(i) ?? projected[i],
        );
        return {
          ...face,
          points,
          light: rotate(fragment ? fragment.turn(face.normal) : face.normal),
          depth: points.reduce((sum, point) => sum + point.z, 0) / 3,
          alpha: 1,
        };
      })
      .filter((face) => face.light.z > -0.12);
    fragments?.forEach((fragment, index) => {
      pieces[index].caps.forEach((cap) => {
        const light = rotate(fragment.turn(cap.normal));
        if (light.z <= -0.12) return;
        const points = [
          fragment.points.get(cap.a)!,
          fragment.points.get(cap.b)!,
          fragment.back,
        ];
        visibleFaces.push({
          vertices: [],
          normal: cap.normal,
          seam: false,
          piece: index,
          points,
          light,
          depth: points.reduce((sum, p) => sum + p.z, 0) / 3,
          alpha: fragment.distance,
        });
      });
    });
    visibleFaces.sort((a, b) => a.depth - b.depth);
    for (const face of visibleFaces) {
      ctx.globalAlpha = opacity * face.alpha * (0.68 + assembly * 0.32);
      const n = face.light;
      const diffuse = Math.max(0, n.x * -0.4 + n.y * -0.55 + n.z * 0.73);
      const highlight = Math.pow(
        Math.max(0, n.x * -0.28 + n.y * -0.36 + n.z * 0.89),
        24,
      );
      const rim = Math.pow(1 - Math.max(0, n.z), 3);
      const red = Math.min(235, 18 + diffuse * 48 + highlight * 155 + rim * 36);
      const green = Math.min(
        245,
        48 + diffuse * 100 + highlight * 120 + rim * 65,
      );
      const blue = Math.min(
        255,
        95 + diffuse * 140 + highlight * 90 + rim * 85,
      );
      ctx.fillStyle = `rgb(${red},${green},${blue})`;
      ctx.beginPath();
      face.points.forEach((p, position) => {
        if (position === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      if (!interaction?.wireframe) ctx.fill();
      // Same-color edge fills avoid hairline cracks between anti-aliased triangles.
      ctx.strokeStyle = interaction?.wireframe
        ? `rgba(148,199,255,${0.15 + diffuse * 0.5})`
        : face.seam
          ? '#bbdeff45'
          : ctx.fillStyle;
      ctx.lineWidth = interaction?.wireframe ? 0.7 : face.seam ? 0.5 : 0.65;
      ctx.stroke();
    }

    // Orbital paths and moving lights are projected from the same 3D space.
    ctx.globalAlpha = opacity;
    for (let orbit = 0; orbit < 2; orbit++) {
      const path = Array.from({ length: 81 }, (_, i) => {
        const angle = (i / 80) * tau;
        return project(
          rotate({
            x: 1.72 * Math.cos(angle),
            y: Math.sin(angle) * (orbit ? 0.8 : 0.15),
            z: Math.sin(angle) * (orbit ? 0.2 : 1.05),
          }),
        );
      });
      ctx.strokeStyle = orbit ? '#8dcfff36' : '#80bfff60';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      path.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      const angle = time * (orbit ? 0.34 : -0.25) + orbit * 2;
      const p = project(
        rotate({
          x: 1.72 * Math.cos(angle),
          y: Math.sin(angle) * (orbit ? 0.8 : 0.15),
          z: Math.sin(angle) * (orbit ? 0.2 : 1.05),
        }),
      );
      ctx.fillStyle = '#d7edff';
      ctx.shadowColor = '#7cb8ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, tau);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  };
}
