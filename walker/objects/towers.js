export const TOWER_BASIC = {
    id: 'basic',
    name: 'Basic Tower',
    cost: 100,
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
