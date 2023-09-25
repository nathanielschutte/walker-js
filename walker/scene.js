import { Level } from './level.js';
import { State } from './state.js';

export class Scene {
    constructor() {
        this.width = 1000;
        this.height = 800;
        this.frameNum = 0;
        this.mouse = {
            x: 0,
            y: 0,
            down: false
        };
        this.keys = {};
        this.running = false;
        this.debugInfo = {};
        this.debugInfoElement = document.getElementById('debug-info');
        this.setupCanvas();

        // implementation
        this.state = new State(this);

        return this;
    }

    async load() {
        this.level = new Level(this.state);
        await this.level.loadLevel('grass');

        this.level.injectTestLevel();
        this.level.createTestSpawn();

        return this;
    }

    start() {
        this.running = true;
        requestAnimationFrame(() => this.loop());
    }

    loop() {
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.ctx.fillStyle = 'rgb(220, 255, 220)';
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        this.state.update();
        this.state.draw(this.ctx);
    
        this.frameNum++;
    
        this.renderDebug();

        if (this.running) {
            requestAnimationFrame(() => this.loop());
        }
    }

    keyPress(key) {
        if (this.keys[key] && this.keys[key].press === this.frameNum) {
            return true;
        }
        return false;
    }

    setDebugField(field, value) {
        this.debugInfo[field] = value;
    }
    
    renderDebug() {
        if (!this.debugInfoElement) {
            return;
        }
        this.debugInfoElement.innerHTML = '';
        for (const [key, value] of Object.entries(this.debugInfo)) {
            const p = document.createElement('span');
            p.innerHTML = `${key}: ${value}`;
            this.debugInfoElement.appendChild(p);
        }
    }

    setupCanvas() {
        const canvas = document.getElementById('canvas');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const ctx = canvas.getContext('2d');

        window.addEventListener('resize', () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }, false);

        window.addEventListener('keydown', e => {
            const key = e.key;
            if (key === ' ' || key === 'Tab' || key === 'Escape') {
                e.preventDefault();
            }
            if (!this.keys[key]) {
                this.keys[key] = {};
            }
            if (!this.keys[key].down) {
                this.keys[key].down = true;
                this.keys[key].press = this.frameNum;
                // console.log(`[Key] ${key} down`);
            } else {
                this.keys[key].press = false;
            }
            this.keys[key].release = false;
        });

        window.addEventListener('keyup', e => {
            const key = e.key;
            if (!this.keys[key]) {
                this.keys[key] = {};
            }
            if (this.keys[key].down) {
                this.keys[key].down = false;
                this.keys[key].release = this.frameNum;
            } else {
                this.keys[key].release = false;
            }
            this.keys[key].press = false;
        });
        
        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        canvas.addEventListener('mousedown', e => {
            this.mouse.down = true;
        });
        
        canvas.addEventListener('mouseup', e => {
            this.mouse.down = false;
        });
        
        canvas.addEventListener('mouseleave', e => {
            this.mouse.down = false;
        });

        // why not working
        window.dispatchEvent(new Event('resize'));

        this.canvas = canvas;
        this.ctx = ctx;
    }
}
