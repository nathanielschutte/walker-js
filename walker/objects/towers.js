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
        PiercingShot: {
            id: 'piercing-shot',
            name: 'Piercing Shot',
            cost: 100,
            effect: (tower) => {
                tower.roundCollats += 2;
            }
        }
    }
}
