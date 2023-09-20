import { dist, lineColliding } from './util.js';


/* CONSTANTS */
const FULL_CIRCLE = 2 * Math.PI;


/* CONTROL */
const DEBUG = true;

const PATH_TRAVERSE_ACCURATE = true;


/* PHYSICS */
const AIR_DAMP = 0.92;


/* BLOONS */
const BLOON_DEFAULTS = {
    health: 1,
    speed: 2,
    damage: 1,
    radius: 12,
    next: null
};

const BLOON_RED = {
    health: 1,
    speed: 1.0,
    damage: 1,
};

const BLOON_BLUE = {
    health: 1,
    speed: 1.2,
    damage: 2,
    radius: 13,
    next: {
        type: 'bloon-red',
        count: 1,
    }
};

const BLOON_GREEN = {
    health: 1,
    speed: 1.4,
    damage: 4,
    radius: 14,
    next: {
        type: 'bloon-blue',
        count: 1,
    }
};


/* DATA */
export class State {
    constructor(scene) {
        this.scene = scene;
        this.paths = []; // array of Path
        this.hoveredPath = -1;
        this.hoveredPart = -1;
        
        this.travellers = []; // array of Traveller
        this.travellersByDistance = []; // array of Traveller
        this.travellersByStrength = []; // array of Traveller

        this.towers = []; // array of Tower
        this.particles = []; // array of Particle

        this.time = 0;
        this.lastTime = 0;

        this.lives = 100;

        this.globalTravellerId = 0;
    }

    update() {
        this.paths.forEach(path => {
            path.update(this.scene.mouse);
        });

        const travellerDestroy = [];
        this.travellers.forEach(traveller => {
            traveller.update();
    
            if (traveller.lifespent > traveller.lifetime) {
                travellerDestroy.push(traveller);
            }

            if (traveller.health <= 0) {
                travellerDestroy.push(traveller);
            }
    
            if (traveller.baseType === 'bloon' && !traveller.usingPath()) {
                travellerDestroy.push(traveller);
                this.lives -= traveller.damage;
                console.log(`lost a life, ${this.lives} remaining`);
            }
        });
    
        travellerDestroy.forEach(traveller => {
            this.removeTraveller(traveller);
        });

        this.travellersByDistance = this.travellers.slice().sort((a, b) => {
            a.pathTotalDistance - b.pathTotalDistance;
        });

        this.travellersByStrength = this.travellers.slice().sort((a, b) => {
            a.maxHealth - b.maxHealth;
        });
    
        this.towers.forEach(tower => {
            tower.update();
        });

        const particleDestroy = [];
        this.particles.forEach(particle => {
            particle.update();

            if (
                particle.life <= 0
                || particle.travelDist > particle.range) 
            {
                particleDestroy.push(particle);
            }
        });

        particleDestroy.forEach(particle => {
            this.removeParticle(particle);
        });

        this.scene.setDebugField('travellers', this.travellers.length);
        this.scene.setDebugField('particles', this.particles.length);
    }

    draw(ctx) {
        this.paths.forEach(path => {
            path.draw(ctx);
        });
        
        this.travellers.forEach(traveller => {
            traveller.draw(ctx);
        });
    
        this.towers.forEach(tower => {
            tower.draw(ctx);
        });

        this.particles.forEach(particle => {
            particle.draw(ctx);
        });
    }

    addPath(path) {
        this.paths.push(path);
    }

    addTraveller(traveller) {
        traveller.id = this.globalTravellerId++;
        this.travellers.push(traveller);
        return traveller.id;
    }

    removeTraveller(traveller) {
        this.removeTravellerIndex(this.travellers.indexOf(traveller));
    }

    removeTravellerIndex(index) {
        this.towers.forEach(tower => {
            tower.removeTarget(this.travellers[index]);
        });
        this.travellers.splice(index, 1);
    }

    addTower(tower) {
        this.towers.push(tower);
    }

    addParticle(particle) {
        this.particles.push(particle);
    }

    removeParticle(particle) {
        this.particles.splice(this.particles.indexOf(particle), 1);
    }

    removeParticleIndex(index) {
        this.particles.splice(index, 1);
    }

    acquireTarget(tower, currentTarget) {
        const mode = tower.targettingMode || 'first';

        let travellerList = this.travellers;

        if (mode === 'first') {
            travellerList = this.travellersByDistance;
        } else if (mode === 'strongest') {
            travellerList = this.travellersByStrength;
        }

        let target;
        let stillInRange = false;
        if (currentTarget) {
            target = currentTarget.ref;
            stillInRange = dist({ x: target.x, y: target.y }, { x: tower.x, y: tower.y }) < tower.targettingRange;
        }
        if (!stillInRange) {
            target = travellerList.find(traveller => {
                return dist({ x: traveller.x, y: traveller.y }, { x: tower.x, y: tower.y }) < tower.targettingRange;
            });
        }

        if (!target) {
            tower.target = null;
            return;
        }

        tower.target = {
            ref: target,
        };
    }

    travellerColliding(x, y, radius, damage, hitlist) {
        for (let i = 0; i < this.travellers.length; i++) {
            const traveller = this.travellers[i];
        
            if (hitlist.indexOf(traveller.id) !== -1) {
                continue;
            }

            if (dist({x: traveller.x, y: traveller.y}, {x: x, y: y}) < (radius + (traveller.radius || 0))) {
                const hitlist = [];

                if (damage) {
                    traveller.health -= damage;
                    if (traveller.health <= 0 && traveller.baseType === 'bloon') {
                        if (traveller.next) {
                            console.log(`popped a ${traveller.type}, spawning ${traveller.next.count} ${traveller.next.type}`);
                            for (let i = 0; i < traveller.next.count; i++) {
                                const newTraveller = new Traveller(traveller.x, traveller.y, traveller.path, traveller.next.type);
                                newTraveller.pathIndex = traveller.pathIndex;
                                newTraveller.pathT = traveller.pathT;
                                newTraveller.pathTotalT = traveller.pathTotalT;
                                newTraveller.pathTotalDistance = traveller.pathTotalDistance;
                                hitlist.push(this.addTraveller(newTraveller));
                            }
                        }

                        this.removeTraveller(traveller);
                    }
                }
        
                return [traveller.id, ...hitlist];
            }
        }

        return false;
    }
}

class PathPart {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    getOrigin() {
        return {
            x: this.x,
            y: this.y,
        }
    }

    f(t) {
        return 0;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
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

    f(t) {
        return {
            x: this.x1 + (this.x2 - this.x1) * t,
            y: this.y1 + (this.y2 - this.y1) * t,
        }
    }

    isColliding(x, y, radius) {
        return lineColliding(x, y, this.x1, this.y1, this.x2, this.y2, radius);
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
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

        if (DEBUG) {
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

    update(mouse) {
        this.hoveredPart = this.partColliding(mouse.x, mouse.y, 10);
    }

    draw(ctx) {
        ctx.lineWidth = 2;
        this.parts.forEach((part, index) => {
            if (index === this.hoveredPart) {
                ctx.strokeStyle = "green";
            } else {
                ctx.strokeStyle = "black";
            }
            part.draw(ctx);
        });
    }
}

class Particle {
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
        
        this.life = 4;
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
            ctx.arc(this.x, this.y, 4, 0, FULL_CIRCLE);
            ctx.fill();
        }
    }
}

export class Tower {
    constructor(state, x, y, type) {
        this.state = state;
        this.x = x;
        this.y = y;
        this.type = type;

        this.turretAngle = 0;

        // {ref, distance, angle}
        this.target = null;
        this.targettingMode = 'first';
        this.targettingRange = 80;

        this.lastRoundFiredTime = null;

        this.upgrades = [];

        if (this.type === 'basic') {
            this.turretLength = 20;
            this.roundsPerSecond = 4;
            this.roundSpeed = 6;
            this.roundDamage = 1;
            this.roundRadius = 5;
            this.roundSpray = 0.1;
            this.roundType = 'pellet';
            this.targettingRange = 200;
            this.roundCollats = 0;
            this.roundDamage = 1;
        }
    }

    addUpgrade(upgrade) {
        upgrade.effect(this);
        this.upgrades.push(upgrade.id);
    }

    hasUpgrade(upgrade) {
        return this.upgrades.find(up => up === upgrade);
    }

    fireRound() {
        if (!this.target) {
            return;
        }
        
        const target = this.target.ref;
        const angle = this.target.angle + (Math.random() - 0.5) * this.roundSpray;
        const distance = this.target.distance;
        const x = this.x + Math.cos(angle) * this.turretLength;
        const y = this.y + Math.sin(angle) * this.turretLength;
        const xv = Math.cos(angle) * this.roundSpeed;
        const yv = Math.sin(angle) * this.roundSpeed;
        const round = new Particle(this.state, x, y, xv, yv, this.roundType, this.targettingRange, this.roundDamage, this.roundCollats);

        this.state.addParticle(round);
        // console.log(`fired round at ${angle} radians, ${distance} pixels away`);
    }

    update() {
        if (this.state.travellers.length > 0) {
            // sort of a 'system' between these to entity types via state
            this.state.acquireTarget(this, this.target || null);
        }

        const now = Date.now();
        const diff = now - this.lastRoundFiredTime;
        let shouldFire = false;
        if (
            this.lastRoundFiredTime === null 
            || diff > 1000 / this.roundsPerSecond
        ) {
            this.lastRoundFiredTime = now;
            shouldFire = true;
        }

        if (!this.target) {
            return;
        }

        const traveller = this.target.ref;
        const distance = dist({x: this.x, y: this.y}, {x: traveller.x, y: traveller.y});
        const angle = Math.atan2((traveller.y + 6) - this.y, (traveller.x + 6) - this.x);
        
        this.target = {
            ref: this.target.ref,
            distance: distance,
            angle: angle,
        };

        this.turretAngle = angle;

        if (shouldFire) {
            this.lastRoundFiredTime = now;
            this.fireRound();
        }
    }

    draw(ctx) {
        if (this.type === 'basic') {

            let baseColor = [0, 0, 0];
            let baseTurretColor = [150, 150, 150];
            let baseTurretWidth = 4;

            if (this.hasUpgrade('faster-firing')) {
                // baseColor[1] += 200;
                baseTurretColor[0] += 150;
            }

            if (this.hasUpgrade('piercing-shot')) {
                baseTurretWidth += 4;
            }

            ctx.fillStyle = `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`;

            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, 2 * Math.PI);
            ctx.fill();

            ctx.strokeStyle = `rgb(${baseTurretColor[0]}, ${baseTurretColor[1]}, ${baseTurretColor[2]})`;
            ctx.lineWidth = baseTurretWidth;
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(this.turretAngle) * this.turretLength, this.y + Math.sin(this.turretAngle) * this.turretLength);
            ctx.stroke();
        }

        if (DEBUG) {
            ctx.strokeStyle = "green";
            ctx.lineWidth = .5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.targettingRange, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    removeTarget(traveller) {
        if (this.target && this.target.ref === traveller) {
            this.target = null;
        }
    }   
}

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
        
        this.type = type;
        
        this.health = 1;

        this.pathVelocity = 0;
        this.pathAcceleration = 0;

        this.trailOn = false;
        this.trail = [];

        this.lifetime = 1000;
        this.lifespent = 0;

        const typeSplit = this.type.split('-');
        this.baseType = typeSplit[0];
        if (this.baseType === 'bloon') {
            this.setBloonStats(typeSplit.splice(1));
        };
    }

    setBloonStats(typeStat) {
        this.typeVariant = typeStat[0];

        Object.assign(this, BLOON_DEFAULTS);
        if (this.typeVariant === 'red') {
            Object.assign(this, BLOON_RED);
        } else if (this.typeVariant === 'blue') {
            Object.assign(this, BLOON_BLUE);
        } else if (this.typeVariant === 'green') {
            Object.assign(this, BLOON_GREEN);
        }

        this.maxHealth = this.health;
        this.pathVelocity = this.speed;
        this.pathAcceleration = 0;
    }

    usingPath() {
        return this.path !== null && this.path !== undefined;
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
        
        if (PATH_TRAVERSE_ACCURATE) {
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
        }

        this.pathT += moveT;
        this.pathTotalT += moveT;
        this.pathTotalDistance += travelDist;

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
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}
