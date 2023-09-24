export const TOWER_DEFAULTS = {
    turretLength: 20,
    roundsPerSecond: 4,
    roundsPerShot: 1,
    roundSpeed: 6,
    roundDamage: 1,
    roundRadius: 5,
    roundSpray: 0.1,
    roundType: 'pellet',
    targettingRange: 150,
    targettingType: 'auto',
    roundCollats: 0,
    fireDirection: 'forward',
};

export const TOWER_BASIC = {
    id: 'basic',
    name: 'Basic Tower',
    cost: 100,
    turretLength: 20,
    roundsPerSecond: 4,
    roundSpeed: 6,
    roundDamage: 1,
    roundRadius: 5,
    roundSpray: 0.05,
    roundType: 'pellet',
    targettingRange: 150,
    targettingType: 'auto',
    roundCollats: 0,
    upgrades: {
        FasterFiring: {
            id: 'faster-firing',
            name: 'Faster Firing',
            cost: 100,
            effect: (tower) => {
                tower.roundsPerSecond *= 1.5;
            }
        },
        IncreasedRange: {
            id: 'increased-range',
            name: 'Increased Range',
            cost: 100,
            effect: (tower) => {
                tower.targettingRange *= 1;
            }
        },
        PiercingShot: {
            id: 'piercing-shot',
            name: 'Piercing Shot',
            cost: 100,
            effect: (tower) => {
                tower.roundCollats += 2;
            }
        },
        PiercingShot2: {
            id: 'piercing-shot-2',
            name: 'Piercing Shot 2',
            cost: 200,
            effect: (tower) => {
                tower.roundCollats += 2;
            }
        }
    }
}

export const TOWER_GAT = {
    id: 'gat',
    name: 'Gatling Gunner',
    cost: 500,
    turretLength: 65,
    roundsPerSecond: 20,
    roundSpeed: 12,
    roundDamage: 1,
    roundRadius: 5,
    roundSpray: 0.11,
    roundType: 'pellet',
    targettingRange: 999,
    targettingType: 'mouse',
    roundCollats: 2,
    upgrades: {}
}

export const TOWER_SPRAY = {
    id: 'spray',
    name: 'Spray Gunner',
    cost: 300,
    turretLength: 20,
    roundsPerSecond: 3,
    roundsPerShot: 12,
    roundSpeed: 6,
    roundDamage: 1,
    roundRadius: 5,
    roundSpray: 0,
    roundType: 'pellet',
    targettingRange: 75,
    targettingType: 'auto',
    roundCollats: 0,
    fireDirection: 'around',
    upgrades: {}
}
