import * as constants from './constants.js';
import { Particle } from './particle.js';
import { dist } from './util.js';
import { TOWER_DEFAULTS } from './objects/towers.js';

const angles = [];
const angleStep = constants.FULL_CIRCLE / 8;
for (let i = 0; i < 8; i++) {
    angles.push(i * angleStep);
}

export class Tower {
    constructor(state, x, y, type) {
        this.state = state;
        this.x = x;
        this.y = y;
        this.type = type.id;

        this.turretAngle = 0;

        // {ref, distance, angle}
        this.target = null;
        this.targettingMode = 'first';
        this.targettingRange = 80;
        this.targettingType = 'auto';
        this.fireDirection = 'forward';

        this.lastRoundFiredTime = null;

        this.upgrades = [];

        Object.assign(this, TOWER_DEFAULTS);
        const traits = {...type};
        delete traits.upgrades;
        Object.assign(this, traits);
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
        
        const target = this.target.ref ? this.target.ref : this.target;
        const roundsToAdd = [];

        const angleStep = constants.FULL_CIRCLE / this.roundsPerShot;
        for (let i = 0; i < this.roundsPerShot; i++) {
            let angle;
            if (this.fireDirection === 'forward') {
                angle = this.turretAngle + (Math.random() - 0.5) * this.roundSpray;
            } else if (this.fireDirection === 'around') {
                angle = (i * angleStep) + (Math.random() - 0.5) * this.roundSpray;
            }

            const x = this.x + Math.cos(angle) * this.turretLength;
            const y = this.y + Math.sin(angle) * this.turretLength;
            const xv = Math.cos(angle) * this.roundSpeed;
            const yv = Math.sin(angle) * this.roundSpeed;
        
            roundsToAdd.push(new Particle(this.state, x, y, xv, yv, this.roundType, this.targettingRange, this.roundDamage, this.roundCollats));
        }

        roundsToAdd.forEach(r => {
            this.state.addParticle(r);
        });
    }

    update() {
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

        let newTarget;


        if (this.state.travellers.length > 0 && this.targettingType === 'auto') {
            // sort of a 'system' between these to entity types via state
            this.state.acquireTarget(this, this.target || null, false);
            if (this.target) {
                newTarget = this.target.ref;
            }
        } else if (this.targettingType === 'mouse') {
            newTarget = this.state.scene.mouse;
        }

        if (!newTarget) {
            return;
        }

        const distance = dist({x: this.x, y: this.y}, {x: newTarget.x, y: newTarget.y});
        const angle = Math.atan2((newTarget.y + 6) - this.y, (newTarget.x + 6) - this.x);
        
        this.target = {
            ref: this.target ? this.target.ref : newTarget,
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

        if (this.fireDirection === 'forward') {
            ctx.strokeStyle = `rgb(${baseTurretColor[0]}, ${baseTurretColor[1]}, ${baseTurretColor[2]})`;
            ctx.lineWidth = baseTurretWidth;
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(this.turretAngle) * this.turretLength, this.y + Math.sin(this.turretAngle) * this.turretLength);
            ctx.stroke();
        } else if (this.fireDirection === 'around') {
            for (let i = 0; i < 8; i++) {
                const angle = angles[i];
                ctx.strokeStyle = `rgb(${baseTurretColor[0]}, ${baseTurretColor[1]}, ${baseTurretColor[2]})`;
                ctx.lineWidth = baseTurretWidth;

                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + Math.cos(angle) * this.turretLength, this.y + Math.sin(angle) * this.turretLength);
                ctx.stroke();
            }
        }

        if (constants.DEBUG) {
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
