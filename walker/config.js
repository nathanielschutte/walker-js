import * as constants from './constants.js';

export class Config {
    constructor(params) {
        this.config = {};
        return this;
    }

    get(key) {
        return this.config[key];
    }

    set(key, value) {
        this.config[key] = value;
    }

    load() {
        this.config.debug = constants.DEBUG;
        this.config.mode = constants.EDIT_MODE ? 'edit' : 'play';
        return this;
    }
}
