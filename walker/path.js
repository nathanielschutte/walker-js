import { dist, lineColliding } from './util.js';
import * as constants from './constants.js';

class PathPart {
    constructor() {
        this.length = 0;
    }

    getOrigin() {
        return;
    }

    f(t) {
        return 0;
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

    f(t) {
        return {
            x: this.x1 + (this.x2 - this.x1) * t,
            y: this.y1 + (this.y2 - this.y1) * t,
        }
    }

    isColliding(x, y, radius) {
        return lineColliding(x, y, this.x1, this.y1, this.x2, this.y2, radius);
    }

    update(mouse) {
        super.update(mouse);

        if (!constants.EDIT_MODE) {
            return;
        }

        if (!mouse.down) {
            this.hoveredPoint = -1;
            if (dist(mouse, {x: this.x1, y: this.y1}) < 10) {
                this.hoveredPoint = 0;
            } else if (dist(mouse, {x: this.x2, y: this.y2}) < 10) {
                this.hoveredPoint = 1;
            }
        } else {
            if (this.hoveredPoint === 0) {
                this.x1 = mouse.x;
                this.y1 = mouse.y;
            } else if (this.hoveredPoint === 1) {
                this.x2 = mouse.x;
                this.y2 = mouse.y;
            }
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();

        if (constants.EDIT_MODE) {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(this.x1, this.y1, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x2, this.y2, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}


export class PathPartBezier extends PathPart {
    constructor(x1, y1, x2, y2, x3, y3, x4, y4) {
        super();
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

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.bezierCurveTo(this.x2, this.y2, this.x3, this.y3, this.x4, this.y4);
        ctx.stroke();

        if (constants.DEBUG) {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(this.x2, this.y2, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x3, this.y3, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}


export class Path {
    constructor() {
        this.parts = []; // array of PathPart
        this.hoveredPart = -1;
        this.hoveredPoint = -1;
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
        this.parts.forEach(part => {
            console.log(JSON.stringify(part));
        });
    }

    update(mouse) {
        if (!constants.EDIT_MODE || !constants.DEBUG) {
            return;
        }

        this.hoveredPart = this.partColliding(mouse.x, mouse.y, 10);
    }

    draw(ctx) {
        ctx.lineWidth = 2;
        this.parts.forEach((part, index) => {
            if (constants.EDIT_MODE && constants.DEBUG && index === this.hoveredPart) {
                ctx.strokeStyle = "blue";
            } else {
                ctx.strokeStyle = "black";
            }
            part.draw(ctx);
        });
    }
}
