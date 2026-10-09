// A scale ratio, not AI metrology. Normalized coordinates are converted using
// original image dimensions so non-square images do not distort distance.
export function measurePhoto(points, referenceMm, width, height) {
  if (points.length !== 4 || !Number.isFinite(+referenceMm) || +referenceMm < 1 || +referenceMm > 1000 || !(width > 0 && height > 0)) return null;
  if (points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1)) return null;
  const distance = (a, b) => Math.hypot((a.x - b.x) * width, (a.y - b.y) * height);
  const ref = distance(points[0], points[1]), lure = distance(points[2], points[3]);
  if (ref < 20 || lure < 5) return null;
  const mm = lure / ref * +referenceMm;
  return mm > 0 && mm <= 1000 ? Math.round(mm * 10) / 10 : null;
}
