import * as constants from './constants.js';

export class Particle {
    constructor(state, x, y, xv, yv, type, range, damage, collats) {
        this.state = state;
        this.range = range || 100;
        this.travelDist = 0;
        this.x = x;
        this.y = y;
        this.xv = xv;
        this.yv = yv;
        this.radius = 4;
        this.type = type;
        this.damage = damage || 1;

        this.hitlist = [];
        
        this.life = 10;
        this.collats = collats || 0;

        const mag = Math.sqrt(Math.pow(this.xv, 2) + Math.pow(this.yv, 2));
        this.speed = mag;

        if (this.type === 'pellet') {
            this.radius = 4;
        }
    }

    update() {
        this.x += this.xv;
        this.y += this.yv;
        this.travelDist += this.speed;
        this.life -= 0.05;

        const hitIds = this.state.travellerColliding(this.x, this.y, this.radius, this.damage, this.hitlist);
        if (hitIds !== false) {
            hitIds.forEach(id => {
                if (this.hitlist.indexOf(id) === -1) {
                    this.hitlist.push(id);
                }
            });
            if (this.collats <= 0) {
                this.life = 0;
            } else {
                this.collats--;
            }
        }
    }

    draw(ctx) {
        if (this.type === 'pellet') {
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, constants.FULL_CIRCLE);
            ctx.fill();
        }
    }
}
