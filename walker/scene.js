import { State } from './_all.js';
import { Level } from './level.js';
// import { State } from './state.js';

export class Scene {
    constructor() {
        this.setupCanvas();

        this.frameNum = 0;
        this.mouse = {
            x: 0,
            y: 0,
            down: false
        };

        this.state = new State(this);

        this.level = new Level()
            .injectTestLevel(this.state)
            .createTestSpawn(this.state);
        
        this.running = false;
        
        this.debugInfo = {};
        this.debugInfoElement = document.getElementById('debug-info');

        return this;
    }

    start() {
        this.running = true;
        requestAnimationFrame(() => this.loop());
    }

    loop() {
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        this.state.update();
        this.state.draw(this.ctx);
    
        this.frameNum++;
    
        this.renderDebug();

        if (this.running) {
            requestAnimationFrame(() => this.loop());
        }
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

        this.canvas = canvas;
        this.ctx = ctx;
    }
}
