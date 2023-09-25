import { Particle } from './particle.js';
import { Traveller } from './traveller.js';
import { Spawner } from './spawner.js';
import { dist } from './util.js';
import * as constants from './constants.js';
import { Config } from './config.js';

/* DATA */
export class State {
    constructor(scene) {
        this.scene = scene;
        this.paths = []; // array of Path
        this.hoveredPath = -1;
        this.hoveredPart = -1;
        this.spawner = new Spawner(this);
        this.config = new Config().load();
        
        this.travellers = []; // array of Traveller
        this.travellersByDistance = []; // array of Traveller
        this.travellersByStrength = []; // array of Traveller

        this.layerResources = [];

        this.towers = []; // array of Tower
        this.particles = []; // array of Particle

        this.difficulty = 1;
        this.mode = this.config.get('mode');
        this.playState = 'paused';

        this.resetToZero();

        this.time = 0;
        this.lastTime = 0;

        this.globalTravellerId = 0;
    }

    clearAll() {
        this.towers = [];
        this.travellers = [];
        this.travellersByDistance = [];
        this.travellersByStrength = [];
        this.particles = [];
    }

    clearParticles() {
        this.particles = [];
    }

    resetToZero() {
        this.round = 0;
        this.frameNum = 0;

        if (this.difficulty === 1) {    
            this.maxLives = 100;
        }

        this.lives = this.maxLives;

        this.resetToNewRound();
    }

    resetToNewRound() {
        this.frameNumRound = 0;
    }

    update() {
        this.time = Date.now();

        if (this.lastTime === 0) {
            this.lastTime = this.time;
        }

        const dt = this.time - this.lastTime;

        if (this.mode === 'edit') {
            this.paths.forEach(path => {
                path.update(this.scene);
            });
        }   

        if (this.scene.keyPress('Tab')) {
            this.mode = this.mode === 'play' ? 'edit' : 'play';
            console.log(`[State] tab pressed, switching mode to ${this.mode}`);

            if (this.mode === 'edit') {
                this.clearParticles();
                this.resetToNewRound();
            }
        }

        if (this.scene.keyPress(' ')) {
            this.playState = this.playState === 'playing' ? 'paused' : 'playing';
            console.log(`[State] space pressed, switching play state to ${this.playState}`);
        }

        if (this.scene.keyPress('r') && this.mode === 'play') {
            this.resetToZero();
            this.clearAll();
            this.playState = 'paused';
        }

        if (this.mode !== 'play') {
            return;
        }

        this.frameNum++;

        if (this.playState !== 'playing') {
            return;
        }

        this.frameNumRound++;
        
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
    }

    draw(ctx) {
        const layers = Array.from({length: constants.LEVEL_LAYER_MAX}, () => {
            return {
                travellers: [],
            };
        });

        this.travellers.forEach(traveller => {
            layers[traveller.getPathLayer()].travellers.push(traveller);
        });

        // LAYERED layers
        for (let i = 0; i < constants.LEVEL_LAYER_MAX; i++) {
            this.layerResources.forEach(resource => {
                resource.draw(ctx, i);
            });

            // TOWER (mid) layer
            if (i === constants.LEVEL_LAYER_MIDDLE) {
                this.towers.forEach(tower => {
                    tower.draw(ctx);
                });
            }

            layers[i].travellers.forEach(traveller => {
                traveller.draw(ctx);
            });
        }

        // TOP layer
        this.particles.forEach(particle => {
            particle.draw(ctx);
        });

        if (this.config.get('debug') || this.mode === 'edit') {
            this.paths.forEach(path => {
                path.draw(ctx, this.mode === 'edit');
            });
        }

        if (this.config.get('debug')) {
            this.drawDebug(ctx);
        }

        this.drawUi(ctx);
    }


    /* UI */
    drawUi(ctx) {
        if (this.mode === 'edit') {
            ctx.strokeStyle = "blue";
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 1;
            ctx.fillText(`edit mode`, 10, 20);
        } else if (this.mode === 'play') {
            if (this.playState === 'playing') {
                ctx.strokeStyle = "green";
                ctx.fillStyle = 'lightgreen';
                ctx.beginPath();
                ctx.moveTo(10, 10);
                ctx.lineTo(10, 40);
                ctx.lineTo(40, 25);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (this.playState === 'paused') {
                ctx.strokeStyle = "red";
                ctx.fillStyle = 'darkred';
                ctx.fillRect(10, 10, 10, 30);
                ctx.fillRect(30, 10, 10, 30);
            }
        }
    }

    drawDebug(ctx) {

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

                                this.particles.push(new Particle(this, traveller.x, traveller.y, 0, 0, 'pop'));
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
