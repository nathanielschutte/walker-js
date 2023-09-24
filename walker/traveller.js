import { dist } from './util.js';
import * as constants from './constants.js';
import * as tr from './objects/travellers.js';

export class Traveller {
    constructor(x, y, path, type) {
        this.path = path;
        this.pathIndex = 0;
        this.pathT = 0;
        this.pathTotalT = 0;
        this.pathTotalDistance = 0;

        this.x = x;
        this.y = y;
        this.xv = 0;
        this.yv = 0;
        this.xa = 0;
        this.ya = 0;
        
        this.type = type.id;
        
        this.health = 1;

        this.pathVelocity = 0;
        this.pathAcceleration = 0;

        this.trailOn = false;
        this.trail = [];

        this.lifetime = 9999;
        this.lifespent = 0;

        this.setTravellerStats(type);
    }

    setTravellerStats(type) {
        const typeSplit = type.id.split('-');
        this.baseType = typeSplit[0];

        this.maxHealth = this.health;
        this.pathAcceleration = 0;

        if (this.baseType !== 'bloon' || typeSplit.length < 2) {
            return;
        };

        this.typeVariant = typeSplit[1];
        Object.assign(this, tr.BLOON_DEFAULTS);
        // console.log(`assigning bloon stats to ${this.typeVariant}: ${JSON.stringify(type)}}`);
        Object.assign(this, type);

        this.pathVelocity = this.speed;
    }

    usingPath() {
        return this.path !== null && this.path !== undefined;
    }

    getPathLayer() {
        if (!this.usingPath()) {
            return null;
        }

        return this.path.parts[this.pathIndex].layer;
    }

    departFromPath(part, remainingDistance) {
        this.path = null;
        this.pathIndex = 0;
        this.pathT = 0;
        this.xa = 0;
        this.ya = 0;
    }

    traversePath() {
        let part = this.path.parts[this.pathIndex];
        
        // desired distance to travel
        const travelDist = this.pathVelocity;

        // guess T to travel (acurrate for linear paths)
        let moveT = travelDist / part.length;
        
        if (constants.PATH_TRAVERSE_ACCURATE) {
            const acceptableError = moveT / 20.0;

            // actual dist travelled
            let actualDist = dist(part.f(this.pathT + moveT), part.f(this.pathT));

            let deltaT =  0.5 * moveT;
            const maxIterations = 20;
            let iteration = 0;
            
            while (
                (actualDist < travelDist - acceptableError 
                || actualDist > travelDist + acceptableError)
                && iteration < maxIterations
            ) {
                deltaT = travelDist / actualDist * deltaT;
                // console.log(actualDist - travelDist);
                if (actualDist < travelDist) {
                    moveT += deltaT;
                } else {
                    moveT -= deltaT;
                }
                deltaT /= 1.2;
                actualDist = dist(part.f(this.pathT + moveT), part.f(this.pathT));
                iteration++;
            }

            this.pathTotalDistance += actualDist;
        } else {
            this.pathTotalDistance += travelDist;
        }

        this.pathT += moveT;
        this.pathTotalT += moveT;

        if (this.pathT >= 1) {
            const remainingDistance = (this.pathT - 1) * part.length;
        
            this.pathIndex++;
            if (this.pathIndex >= this.path.parts.length) {
                this.departFromPath(part, remainingDistance);
                return;
            }
        
            part = this.path.parts[this.pathIndex];
            this.pathT = remainingDistance / part.length;
        }

        if (this.pathT < 0) {
            throw new Error('pathT < 0');
        }

        const pos = part.f(this.pathT);
        this.xa = pos.x - this.x - this.xv;
        this.ya = pos.y - this.y - this.yv;
        this.xv = pos.x - this.x;
        this.yv = pos.y - this.y;
        this.x = pos.x;
        this.y = pos.y;
    }

    update() {
        if (this.trailOn) {
            this.trail.push({x: this.x, y: this.y});
            if (this.trail.length > 12) {
                this.trail.shift();
            }
        }

        if (this.usingPath()) {
            this.pathVelocity += this.pathAcceleration;
            this.traversePath();
        } else {
            this.xv *= AIR_DAMP;
            this.yv *= AIR_DAMP;
    
            this.xv += this.xa;
            this.yv += this.ya;
            this.x += this.xv;
            this.y += this.yv;
        }

        this.lifespent++;
    }

    draw(ctx) {
        if (this.trailOn) {
            ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
            this.trail.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                ctx.fill();
            });
        }

        if (this.baseType === 'bloon') {
            if (this.typeVariant === 'red') {
                ctx.fillStyle = 'rgba(255, 0, 0, 1)';
            } else if (this.typeVariant === 'blue') {
                ctx.fillStyle = 'rgba(0, 0, 255, 1)';
            } else if (this.typeVariant === 'green') {
                ctx.fillStyle = 'rgba(0, 255, 0, 1)';
            } else if (this.typeVariant === 'yellow') {
                ctx.fillStyle = 'rgba(255, 255, 0, 1)';
            } else if (this.typeVariant === 'pink') {
                ctx.fillStyle = 'rgba(255, 0, 255, 1)';
            } else if (this.typeVariant === 'black') {
                ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            } else if (this.typeVariant === 'white') {
                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            } else if (this.typeVariant === 'lead') {
                ctx.fillStyle = 'rgba(128, 128, 128, 1)';
            } else if (this.typeVariant === 'zebra') {
                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            } else if (this.typeVariant === 'rainbow') {
                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            } else if (this.typeVariant === 'ceramic') {
                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
            ctx.fill();
        }

        if (constants.DEBUG) {
            ctx.fillStyle = "black";
            // draw text
            ctx.font = "12px Arial";
            // ctx.fillText(`${this.pathTotalDistance.toFixed(1)}`, this.x, this.y);
        }
    }
}
