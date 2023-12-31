import { dist, lineColliding } from './util.js';
import * as constants from './constants.js';

class PathPart {
    constructor() {
        this.type = 'none';
        this.length = 0;
        this.hoveredPoint = -1;
        this.mode = 'final';
        this.layer = 0;
    }

    getOrigin() {
        return;
    }

    getPoint(i) {
        return;
    }

    getHoveredPoint() {
        if (this.hoveredPoint === -1 || this.mode !== 'final') {
            return null;
        }
        return this.getPoint(this.hoveredPoint);
    }

    f(t) {
        return 0;
    }

    update(mouse) {
        return;
    }

    draw(ctx) {
        return;
    }

    isColliding(x, y, radius) {
        return false;
    }
}


export class PathPartLine extends PathPart {
    constructor(x1, y1, x2, y2) {
        super();
        this.type = 'line';

        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.length = dist({x: x1, y: y1}, {x: x2, y: y2});
    }

    getOrigin() {
        return {
            x: this.x1,
            y: this.y1,
        }
    }

    getPoint(i) {
        if (i === 0) {
            return { x: this.x1, y: this.y1 };
        } else if (i === 1) {
            return { x: this.x2, y: this.y2 };
        }
        return null;
    }

    f(t) {
        return {
            x: this.x1 + (this.x2 - this.x1) * t,
            y: this.y1 + (this.y2 - this.y1) * t,
        }
    }

    isColliding(x, y, radius) {
        return lineColliding(x, y, this.x1, this.y1, this.x2, this.y2, radius);
    }

    pointColliding(x, y, radius) {
        if (dist({x: x, y: y}, {x: this.x1, y: this.y1}) < radius) {
            return 0;
        } else if (dist({x: x, y: y}, {x: this.x2, y: this.y2}) < radius) {
            return 1;
        }
    }

    update(mouse) {
        super.update(mouse);

        if (this.mode === 'follow') {
            this.x2 = mouse.x;
            this.y2 = mouse.y;
            this.length = dist({x: this.x1, y: this.y1}, {x: this.x2, y: this.y2});

            if (mouse.down) {
                this.mode = 'final';
            }

            return;
        }

        if (!mouse.down) {
            this.hoveredPoint = -1;
            this.hoveredPoint = this.pointColliding(mouse.x, mouse.y, 10);
        }
        
        if (this.hoveredPoint !== -1) {
            if (mouse.down) {
                if (this.hoveredPoint === 0) {
                    this.x1 = mouse.x;
                    this.y1 = mouse.y;
                } else if (this.hoveredPoint === 1) {
                    this.x2 = mouse.x;
                    this.y2 = mouse.y;
                }
                this.length = dist({x: this.x1, y: this.y1}, {x: this.x2, y: this.y2});
            }
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();

        const points = [[this.x1, this.y1], [this.x2, this.y2]];
        points.forEach((point, index) => {
            ctx.fillStyle = "red";
            if (this.hoveredPoint === index) {
                ctx.fillStyle = "white";
            }
            ctx.beginPath();
            ctx.arc(point[0], point[1], 2, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
}


export class PathPartBezier extends PathPart {
    constructor(x1, y1, x2, y2, x3, y3, x4, y4) {
        super();
        this.type = 'bezier';

        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        this.x3 = x3;
        this.y3 = y3;
        this.x4 = x4;
        this.y4 = y4;

        this.lengthPrecision = 200;
        this.collidePrecision = 20;
        this.length = this.calcLength();
    }

    calcLength() {
        let length = 0;
        let lastPoint = this.f(0);
        for (let i = 1; i <= this.lengthPrecision; i++) {
            const point = this.f(i / this.lengthPrecision);
            length += dist({x: lastPoint.x, y: lastPoint.y}, {x: point.x, y: point.y})
            lastPoint = point;
        }
        return length;
    }

    getOrigin() {
        return {
            x: this.x1,
            y: this.y1,
        }
    }

    getPoint(i) {
        if (i === 0) {
            return { x: this.x1, y: this.y1 };
        } else if (i === 1) {
            return { x: this.x2, y: this.y2 };
        } else if (i === 2) {
            return { x: this.x3, y: this.y3 };
        } else if (i === 3) {
            return { x: this.x4, y: this.y4 };
        }
        return null;
    }

    f(t) {
        return {
            x: Math.pow(1 - t, 3) * this.x1 + 3 * t * Math.pow(1 - t, 2) * this.x2 + 3 * Math.pow(t, 2) * (1 - t) * this.x3 + Math.pow(t, 3) * this.x4,
            y: Math.pow(1 - t, 3) * this.y1 + 3 * t * Math.pow(1 - t, 2) * this.y2 + 3 * Math.pow(t, 2) * (1 - t) * this.y3 + Math.pow(t, 3) * this.y4,
        }
    }

    isColliding(x, y, radius) {
        let lastPoint = this.f(0);
        
        for (let i = 1; i <= this.collidePrecision; i++) {
            const point = this.f(i / this.collidePrecision);
            if (lineColliding(x, y, lastPoint.x, lastPoint.y, point.x, point.y, radius)) {
                return true;
            }
            lastPoint = point;
        }
        return false;
    }

    pointColliding(x, y, radius) {
        if (dist({x: x, y: y}, {x: this.x1, y: this.y1}) < radius) {
            return 0;
        } else if (dist({x: x, y: y}, {x: this.x2, y: this.y2}) < radius) {
            return 1;
        } else if (dist({x: x, y: y}, {x: this.x3, y: this.y3}) < radius) {
            return 2;
        } else if (dist({x: x, y: y}, {x: this.x4, y: this.y4}) < radius) {
            return 3;
        }
        return -1;
    }

    update(mouse) {
        super.update(mouse);

        if (this.mode === 'follow') {
            this.x4 = mouse.x;
            this.y4 = mouse.y;
            this.x2 = this.x1 + (this.x4 - this.x1) / 3;
            this.y2 = this.y1 + (this.y4 - this.y1) / 3;
            this.x3 = this.x1 + (this.x4 - this.x1) * 2 / 3;
            this.y3 = this.y1 + (this.y4 - this.y1) * 2 / 3;
            this.length = this.calcLength();

            if (mouse.down) {
                this.mode = 'final';
            }

            return;
        }

        if (!mouse.down) {
            this.hoveredPoint = this.pointColliding(mouse.x, mouse.y, 10);
        }
        
        if (this.hoveredPoint !== -1) {
            if (mouse.down) {
                if (this.hoveredPoint === 0) {
                    this.x1 = mouse.x;
                    this.y1 = mouse.y;
                } else if (this.hoveredPoint === 1) {
                    this.x2 = mouse.x;
                    this.y2 = mouse.y;
                } else if (this.hoveredPoint === 2) {
                    this.x3 = mouse.x;
                    this.y3 = mouse.y;
                } else if (this.hoveredPoint === 3) {
                    this.x4 = mouse.x;
                    this.y4 = mouse.y;
                }
                this.length = this.calcLength();
            }
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.bezierCurveTo(this.x2, this.y2, this.x3, this.y3, this.x4, this.y4);
        ctx.stroke();

        if (constants.DEBUG) {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(this.x2, this.y2, 2, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.x3, this.y3, 2, 0, 2 * Math.PI);
            ctx.stroke();
        }

        const points = [[this.x1, this.y1], [this.x4, this.y4]];
        points.forEach((point, index) => {
            ctx.fillStyle = "red";
            if (this.hoveredPoint === index) {
                ctx.fillStyle = "white";
            }
            ctx.beginPath();
            ctx.arc(point[0], point[1], 2, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
}


export class Path {
    constructor() {
        this.parts = []; // array of PathPart
        this.hoveredPart = -1;
    }

    partColliding(x, y, radius) {
        for (let i = 0; i < this.parts.length; i++) {
            const part = this.parts[i];
            if (part.isColliding(x, y, radius)) {
                return i;
            }
        }
        return -1;
    }

    addPart(part) {
        this.parts.push(part);
    }

    removePart(index) {
        this.parts.splice(index, 1);
    }

    save() {
        const data = {
            path: []
        };

        this.parts.forEach(part => {
            const partData = {
                type: part.type,
                layer: part.layer || 3,
                points: [],
            }
            if (part.type === 'line') {
                partData.points.push([part.x1, part.y1]);
                partData.points.push([part.x2, part.y2]);
            } else if (part.type === 'bezier') {
                partData.points.push([part.x1, part.y1]);
                partData.points.push([part.x2, part.y2]);
                partData.points.push([part.x3, part.y3]);
                partData.points.push([part.x4, part.y4]);
            }
            data.path.push(partData);
        });

        console.log(JSON.stringify(data, null, 4));
    }

    update(scene) {
        this.hoveredPart = this.partColliding(scene.mouse.x, scene.mouse.y, 10);

        this.parts.forEach(part => {
            part.update(scene.mouse);
        });

        if (scene.keyPress('s')) {
            this.save();
        }

        if (this.hoveredPart === -1) {
            return;
        }

        const hoveredPart = this.parts[this.hoveredPart];
        const hoveredPoint = hoveredPart.getHoveredPoint();
        if (hoveredPoint !== null) {
            let newPart = null;

            if (scene.keyPress('1')) {
                newPart = new PathPartLine(hoveredPoint.x, hoveredPoint.y, hoveredPoint.x, hoveredPoint.y);
            } else if (scene.keyPress('2')) {
                newPart = new PathPartBezier(hoveredPoint.x, hoveredPoint.y, hoveredPoint.x, hoveredPoint.y, hoveredPoint.x, hoveredPoint.y, hoveredPoint.x, hoveredPoint.y);
            }

            if (newPart !== null) {
                newPart.mode = 'follow';
                this.addPart(newPart);
            }
        }
    }

    draw(ctx, edit) {
        ctx.lineWidth = 2;
        this.parts.forEach((part, index) => {
            ctx.lineWidth = 1;
            if (index === this.hoveredPart) {
                ctx.strokeStyle = "blue";
                ctx.fillStyle = 'black';
                ctx.font = '16px Arial';
                const {x, y} = part.getOrigin();
                ctx.fillText(`[${index}, ${part.layer}]`, x, y - 10);
            } else {
                ctx.strokeStyle = "black";
            }
            part.draw(ctx);
        });
    }
}
