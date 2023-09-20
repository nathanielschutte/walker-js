import { Traveller, Tower, Path, PathPartLine, PathPartBezier } from './_all.js';
import * as towers from './objects/towers.js';

export class Level {
    constructor() {
        return this;
    }

    loadLevel(file) {
        // return [background, paths, ...];
    }

    loadTowers(file) {
        // return [tower, ...];
    }

    loadEnemies(file) {
        // return [enemy, ...];
    }

    loadProjectiles(file) {
        // return [projectile, ...];
    }

    loadUpgrades(file) {
        // return [upgrade, ...];
    }

    loadWaves(file) {
        // return [wave, ...];
    }
     
    injectTestLevel(state) {
        const path = new Path();
        path.parts.push(new PathPartLine(100, 100, 200, 200));
        path.parts.push(new PathPartLine(200, 200, 300, 100));
        path.parts.push(new PathPartBezier(300, 100, 400, 200, 500, 100, 600, 200));
        path.parts.push(new PathPartBezier(600, 200, 700, 300, 800, 500, 400, 600));
        path.parts.push(new PathPartBezier(400, 600, 200, 500, 500, 0, 550, 50));
        state.addPath(path);
        
        const tower1 = new Tower(state, 200, 100, towers.TOWER_BASIC.id);
        tower1.addUpgrade(towers.TOWER_BASIC.upgrades.PiercingShot);
        tower1.targettingMode = 'strongest';
        state.addTower(tower1);
        
        const tower2 = new Tower(state, 200, 250, towers.TOWER_BASIC.id);
        tower2.targettingMode = 'last';
        // tower2.addUpgrade(towers.TOWER_BASIC.upgrades.FasterFiring);
        tower2.addUpgrade(towers.TOWER_BASIC.upgrades.PiercingShot);
        tower2.addUpgrade(towers.TOWER_BASIC.upgrades.PiercingShot2);
        tower2.addUpgrade(towers.TOWER_BASIC.upgrades.IncreasedRange);
        state.addTower(tower2);
        
        const tower3 = new Tower(state, 360, 190, towers.TOWER_BASIC.id);
        tower3.addUpgrade(towers.TOWER_BASIC.upgrades.PiercingShot);
        state.addTower(tower3);
        
        const tower4 = new Tower(state, 600, 450, towers.TOWER_BASIC.id);
        tower4.addUpgrade(towers.TOWER_BASIC.upgrades.FasterFiring);
        tower4.addUpgrade(towers.TOWER_BASIC.upgrades.PiercingShot);
        state.addTower(tower4);

        return this;
    }

    createTestSpawn(state) {
        this.createTestSpawnInterval(state, 100, 'bloon-green');

        return this;
    }
    
    createTestSpawnInterval(state, interval, type) {
        const { x, y } = state.paths[0].parts[0].getOrigin();
        setInterval(() => {
            const traveller = new Traveller(x, y, state.paths[0], type);
            state.addTraveller(traveller);
        }, interval);
    }
}
