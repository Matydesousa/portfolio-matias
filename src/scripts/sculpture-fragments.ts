interface Vector {
  x: number;
  y: number;
  z: number;
}
interface MeshFace {
  vertices: number[];
  normal: Vector;
  piece: number;
}
const noise = (index: number) => {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};
const normalized = (v: Vector): Vector => {
  const length = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / length, y: v.y / length, z: v.z / length };
};

/** Connected, uneven surface patches with closed backs, rather than sliced rings. */
export function createSculptureFragments(
  vertices: { point: Vector }[],
  faces: MeshFace[],
  segments: number,
  sides: number,
) {
  const count = 384;
  const neighbours = faces.map(() => [] as number[]);
  const edgeOwners = new Map<string, number>();
  const edgeKey = (a: number, b: number) =>
    `${Math.min(a, b)}:${Math.max(a, b)}`;
  faces.forEach((face, index) =>
    face.vertices.forEach((a, corner) => {
      const b = face.vertices[(corner + 1) % 3];
      const key = edgeKey(a, b),
        owner = edgeOwners.get(key);
      if (owner === undefined) edgeOwners.set(key, index);
      else {
        neighbours[index].push(owner);
        neighbours[owner].push(index);
      }
    }),
  );

  // Distribute seeds across the periodic surface before growing connected patches.
  const coordinates = faces.map((_, i) => ({
    u: Math.floor(i / (sides * 2)) + (i % 2 ? 1 / 3 : 2 / 3),
    v: (Math.floor(i / 2) % sides) + (i % 2 ? 2 / 3 : 1 / 3),
  }));
  const nearest = new Float64Array(faces.length).fill(Infinity);
  const seeds: number[] = [];
  let candidate = 87;
  for (let piece = 0; piece < count; piece++) {
    seeds.push(candidate);
    const seed = coordinates[candidate];
    let furthest = -1;
    coordinates.forEach((point, index) => {
      const du = Math.abs(point.u - seed.u),
        dv = Math.abs(point.v - seed.v);
      nearest[index] = Math.min(
        nearest[index],
        (Math.min(du, segments - du) * 0.85) ** 2 +
          Math.min(dv, sides - dv) ** 2,
      );
      const score = nearest[index] * (0.85 + noise(index) * 0.3);
      if (score > furthest) {
        furthest = score;
        candidate = index;
      }
    });
  }

  const heap: { face: number; distance: number }[] = [];
  function push(node: (typeof heap)[number]) {
    let index = heap.length;
    heap.push(node);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (heap[parent].distance <= node.distance) break;
      heap[index] = heap[parent];
      index = parent;
    }
    heap[index] = node;
  }
  function pop() {
    const node = heap[0],
      last = heap.pop()!;
    if (heap.length) {
      let index = 0;
      while (index * 2 + 1 < heap.length) {
        let child = index * 2 + 1;
        if (
          child + 1 < heap.length &&
          heap[child + 1].distance < heap[child].distance
        )
          child++;
        if (last.distance <= heap[child].distance) break;
        heap[index] = heap[child];
        index = child;
      }
      heap[index] = last;
    }
    return node;
  }
  const distances = new Float64Array(faces.length).fill(Infinity);
  seeds.forEach((face, piece) => {
    faces[face].piece = piece;
    distances[face] = 0;
    push({ face, distance: 0 });
  });
  while (heap.length) {
    const node = pop();
    if (node.distance !== distances[node.face]) continue;
    neighbours[node.face].forEach((face) => {
      const distance = node.distance + 0.65 + noise(face * 3 + 1) * 1.2;
      if (distance >= distances[face]) return;
      distances[face] = distance;
      faces[face].piece = faces[node.face].piece;
      push({ face, distance });
    });
  }

  const groups = Array.from({ length: count }, () => [] as MeshFace[]);
  faces.forEach((face) => groups[face.piece].push(face));
  return groups.map((group, index) => {
    const indices = [...new Set(group.flatMap((face) => face.vertices))];
    const center = { x: 0, y: 0, z: 0 };
    indices.forEach((i) => {
      const p = vertices[i].point;
      center.x += p.x / indices.length;
      center.y += p.y / indices.length;
      center.z += p.z / indices.length;
    });
    const normal = normalized(
      group.reduce(
        (sum, face) => ({
          x: sum.x + face.normal.x,
          y: sum.y + face.normal.y,
          z: sum.z + face.normal.z,
        }),
        { x: 0, y: 0, z: 0 },
      ),
    );
    const thickness = 0.06 + noise(index + 17) * 0.07;
    const back = {
      x: center.x - normal.x * thickness,
      y: center.y - normal.y * thickness,
      z: center.z - normal.z * thickness,
    };
    const edges = new Map<string, { a: number; b: number; count: number }>();
    group.forEach((face) =>
      face.vertices.forEach((a, corner) => {
        const b = face.vertices[(corner + 1) % 3],
          key = edgeKey(a, b);
        const edge = edges.get(key);
        if (edge) edge.count++;
        else edges.set(key, { a, b, count: 1 });
      }),
    );
    const caps = [...edges.values()]
      .filter((edge) => edge.count === 1)
      .map(({ a, b }) => {
        const p = vertices[b].point,
          q = vertices[a].point;
        const u = { x: q.x - p.x, y: q.y - p.y, z: q.z - p.z };
        const v = { x: back.x - p.x, y: back.y - p.y, z: back.z - p.z };
        return {
          a: b,
          b: a,
          normal: normalized({
            x: u.y * v.z - u.z * v.y,
            y: u.z * v.x - u.x * v.z,
            z: u.x * v.y - u.y * v.x,
          }),
        };
      });
    return {
      indices,
      center,
      back,
      caps,
      angle: index * 2.3999632297 + noise(index + 131) * 0.16,
      radius: 0.96 + noise(index + 331) * 0.8,
      orbitSpeed: (index % 2 ? -1 : 1) * (0.055 + noise(index + 67) * 0.085),
      twist: noise(index + 191) * Math.PI * 2,
      spin: (noise(index + 211) - 0.5) * 0.9,
      size: 0.68 + noise(index + 53) * 0.47,
      delay: noise(index + 11) * 0.12,
    };
  });
}
