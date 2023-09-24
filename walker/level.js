import { Traveller } from './traveller.js';
import { Tower } from './tower.js';
import { Path, PathPartLine, PathPartBezier } from './path.js';
import * as res from './resource.js';
import * as towers from './objects/towers.js';
import * as tr from './objects/travellers.js';

export class Level {
    constructor(state) {
        this.state = state;
        this.loadPercent = 0;
        this.resources = {
            levels: [],
            sprites: [],
        };

        this.resourceCount = 0;
        this.resourceLoadedCount = 0;
        this.ready = true;

        return this;
    }

    async unloadResources() {
        this.resources = {
            levels: [],
            sprites: [],
        };

        this.resourceCount = 0;
        this.resourceLoadedCount = 0;
    }

    async loadResources(resources) {
        let resourceFails = [];

        const loadPromises = [];
        resources.forEach(async r => {
            loadPromises.push(
                r.load()
                    .then(() => {
                        this.resourceLoadedCount++;
                    })
                    .catch(error => {
                        console.log(error);
                        resourceFails.push(r);
                    })
            );
        });

        await Promise.all(loadPromises);
        
        if (resourceFails.length > 0) {
            console.log(`[Resource] failed to load ${resourceFails.length} resources`);
            // console.log(this.resourceFails);

            throw new Error('failed to load resources');
        }

        console.log(`[Resource] loaded ${this.resourceLoadedCount} resources`);
        this.resourceCount += this.resourceLoadedCount;
    }

    async loadLevel(id) {
        if (!this.ready) {
            throw new Error('global resources not ready');
        }

        let levelResource = this.resources.levels[id];

        if (levelResource === undefined) {
            levelResource = new res.LevelResource(id);
            await this.loadResources([levelResource]);
        }

        this.state.addLayerResource(levelResource);
        levelResource.paths.forEach(path => {
            console.log('[Level] adding path:', path);
            this.state.addPath(path);
        });
    }
    
    injectTestLevel() {
        const state = this.state;
        // const path = new Path();
        // path.parts.push(new PathPartLine(100, 100, 200, 200));
        // path.parts.push(new PathPartLine(200, 200, 300, 100));
        // path.parts.push(new PathPartBezier(300, 100, 400, 200, 500, 100, 600, 200));
        // path.parts.push(new PathPartBezier(600, 200, 700, 300, 700, 600, 400, 600));
        // path.parts.push(new PathPartBezier(400, 600, 200, 600, 200, 0, 550, 50));
        // this.state.addPath(path);
        
        // const tower1 = new Tower(state, 200, 100, towers.TOWER_BASIC);
        // tower1.addUpgrade(towers.TOWER_BASIC.upgrades.PiercingShot);
        // tower1.targettingMode = 'strongest';
        // state.addTower(tower1);
        
        const tower2 = new Tower(state, 490, 350, towers.TOWER_BASIC);
        tower2.targettingMode = 'first';
        tower2.addUpgrade(towers.TOWER_BASIC.upgrades.FasterFiring);
        tower2.addUpgrade(towers.TOWER_BASIC.upgrades.PiercingShot);
        tower2.addUpgrade(towers.TOWER_BASIC.upgrades.PiercingShot2);
        tower2.addUpgrade(towers.TOWER_BASIC.upgrades.IncreasedRange);
        state.addTower(tower2);
        
        const tower3 = new Tower(state, 290, 170, towers.TOWER_SPRAY);
        state.addTower(tower3);
        
        const tower4 = new Tower(state, 90, 290, towers.TOWER_BASIC);
        tower4.addUpgrade(towers.TOWER_BASIC.upgrades.FasterFiring);
        tower4.addUpgrade(towers.TOWER_BASIC.upgrades.PiercingShot);
        state.addTower(tower4);

        const gat = new Tower(state, 750, 250, towers.TOWER_GAT);
        state.addTower(gat);

        return this;
    }

    createTestSpawn() {
        // this.createTestSpawnInterval(100, tr.BLOON_BLUE);
        // this.createTestSpawnInterval(200, tr.BLOON_PINK);
        // this.createTestSpawnInterval(420, tr.BLOON_BLACK);
        // this.createTestSpawnInterval(450, tr.BLOON_WHITE);

        return this;
    }
    
    createTestSpawnInterval(interval, type) {
        const { x, y } = this.state.paths[0].parts[0].getOrigin();
        setInterval(() => {
            const traveller = new Traveller(x, y, this.state.paths[0], type);
            this.state.addTraveller(traveller);
        }, interval);
    }
}
