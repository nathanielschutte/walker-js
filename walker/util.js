export function lineColliding(x, y, x1, y1, x2, y2, radius) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    if (t < 0 || t > 1) {
        return false;
    }
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    return Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2)) < radius;
}

export function dist({x: x1, y: y1}, {x: x2, y: y2}) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
