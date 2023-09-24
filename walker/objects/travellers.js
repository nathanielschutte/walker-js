
export const AFFLICTIONS = {
    freeze: {
        duration: 1000,
        effect: (traveller) => {
            traveller.pathVelocity = traveller.speed * 0.5;
        },
        remove: (traveller) => {
            traveller.pathVelocity = traveller.speed;
        }
    },
};

export const TRAITS = {
    camo: {
        effect: (traveller) => {
            traveller.camo = true;
        }
    },
    fortified: {
        effect: (traveller) => {
            traveller.fortified = true;
        }
    },
    regen: {
        effect: (traveller) => {
            traveller.regen = true;
        }
    },
    shielded: {
        effect: (traveller) => {
            traveller.shielded = true;
        }
    },
    metal: {
        effect: (traveller) => {
            traveller.metal = true;
        }
    },
};

/* BLOONS */
export const BLOON_DEFAULTS = {
    id: 'bloon',
    health: 1,
    speed: 2,
    damage: 1,
    radius: 12,
    next: null
};

export const BLOON_RED = {
    id: 'bloon-red',
    health: 1,
    speed: 1.0,
    damage: 1,
};

export const BLOON_BLUE = {
    id: 'bloon-blue',
    health: 1,
    speed: 1.2,
    damage: 2,
    radius: 13,
    next: {
        type: BLOON_RED,
        count: 1,
    }
};

export const BLOON_GREEN = {
    id: 'bloon-green',
    health: 1,
    speed: 1.4,
    damage: 4,
    radius: 14,
    next: {
        type: BLOON_BLUE,
        count: 1,
    }
};

export const BLOON_YELLOW = {
    id: 'bloon-yellow',
    health: 1,
    speed: 1.6,
    damage: 5,
    radius: 15,
    next: {
        type: BLOON_GREEN,
        count: 1,
    }
};

export const BLOON_PINK = {
    id: 'bloon-pink',
    health: 1,
    speed: 1.8,
    damage: 6,
    radius: 16,
    next: {
        type: BLOON_YELLOW,
        count: 1,
    }
};

export const BLOON_BLACK = {
    id: 'bloon-black',
    health: 1,
    speed: 2.0,
    damage: 7,
    radius: 9,
    next: {
        type: BLOON_PINK,
        count: 2,
    }
};

export const BLOON_WHITE = {
    id: 'bloon-white',
    health: 1,
    speed: 2.0,
    damage: 7,
    radius: 9,
    next: {
        type: BLOON_PINK,
        count: 2,
    }
};
