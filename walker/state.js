import * as constants from './constants.js';
import { Traveller } from './traveller.js';
import { dist } from './util.js';

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

        this.layerResources = [];

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
                // console.log(`lost a life, ${this.lives} remaining`);
            }
        });
    
        travellerDestroy.forEach(traveller => {
            this.removeTraveller(traveller);
        });

        this.travellersByDistance = this.travellers.slice();
        this.travellersByDistance.sort((a, b) => {
            return b.pathTotalDistance - a.pathTotalDistance;
        });

        this.travellersByStrength = this.travellersByDistance.slice();
        this.travellersByStrength.sort((a, b) => {
            const healthDiff = b.maxHealth - a.maxHealth;
            if (healthDiff !== 0) {
                return healthDiff;
            }
            return b.pathTotalDistance - a.pathTotalDistance;
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

        if (this.scene.keyPress('s')) {
            this.paths[0].save();
        }
    }

    draw(ctx) {
        // layers 0..2
        for (let i = 0; i < 3; i++) {
            this.layerResources.forEach(resource => {
                resource.draw(ctx, i);
            });
        }

        // layer 3
        this.travellers.forEach(traveller => {
            traveller.draw(ctx);
        });

        // layers 4..6
        for (let i = 4; i < 7; i++) {
            this.layerResources.forEach(resource => {
                resource.draw(ctx, i);
            });
        }
    
        // layer 7
        this.towers.forEach(tower => {
            tower.draw(ctx);
        });

        // layer 8
        this.particles.forEach(particle => {
            particle.draw(ctx);
        });

        // DEBUG layers
        if (constants.DEBUG) {
            this.paths.forEach(path => {
                path.draw(ctx);
            });
        }
    }


    /* ENTITY MANGEMENT */
    addLayerResource(resource) {
        this.layerResources.push(resource);
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


    /* SYSTEMS */

    acquireTarget(tower, currentTarget, stickyTarget) {
        stickyTarget = stickyTarget === true;
        const mode = tower.targettingMode || 'first';

        let travellerList = this.travellers;

        if (mode === 'first' || mode === 'last') {
            travellerList = this.travellersByDistance;
        } else if (mode === 'strongest') {
            travellerList = this.travellersByStrength;
        }

        let target;
        let stillInRange = false;
        if (stickyTarget && currentTarget) {
            target = currentTarget.ref;
            stillInRange = dist({ x: target.x, y: target.y }, { x: tower.x, y: tower.y }) < tower.targettingRange;
        }
        if (!stillInRange) {
            for (let i = 0; i < travellerList.length; i++) {
                let j = i;
                if (mode === 'last') {
                    j = travellerList.length - 1 - i;
                }
                const traveller = travellerList[j];
                // if (i > 0 && traveller.pathTotalDistance - travellerList[i - 1].pathTotalDistance >= 0) {
                //     console.log(`WARNING: travellers not sorted: ${traveller.pathTotalDistance} >= ${travellerList[i - 1].pathTotalDistance}`);
                // }
                if (dist({ x: traveller.x, y: traveller.y }, { x: tower.x, y: tower.y }) < tower.targettingRange) {
                    target = traveller;
                    break;
                }
            }
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
                const newHitlist = [];

                if (damage) {
                    traveller.health -= damage;
                    if (traveller.health <= 0 && traveller.baseType === 'bloon') {
                        if (traveller.next) {
                            //console.log(`popped a ${traveller.type}, spawning ${traveller.next.count} ${traveller.next.type}`);
                            for (let i = 0; i < traveller.next.count; i++) {
                                const newTraveller = new Traveller(traveller.x, traveller.y, traveller.path, traveller.next.type);
                                newTraveller.pathIndex = traveller.pathIndex;
                                newTraveller.pathT = traveller.pathT;
                                newTraveller.pathTotalT = traveller.pathTotalT;
                                newTraveller.pathTotalDistance = traveller.pathTotalDistance;
                                newHitlist.push(this.addTraveller(newTraveller));
                            }
                        }

                        this.removeTraveller(traveller);
                    }
                }
        
                return [traveller.id, ...newHitlist];
            }
        }

        return false;
    }
}