import * as constants from './constants.js';

export class Config {
    constructor(params) {
        this.config = {};
    }

    get(key) {
        return this.config[key];
    }

    set(key, value) {
        this.config[key] = value;
    }

    load() {
        this.config.debug = constants.DEBUG;
        this.config.edit_mode = constants.EDIT_MODE ? 'edit' : 'play';
    }
}
