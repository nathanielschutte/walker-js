import { Path, PathPartLine, PathPartBezier } from './path.js';

const RES_DIR = 'res';
const RES_LEVEL = 'level';

const LEVEL_LAYER_MAX = 6;

class Resource {
    constructor(type, id) {
        this.type = type;
        this.loaded = false;
        this.path = `${RES_DIR}/${type}/${id}`;
        this.id = id;
    }

    async load() {
        this.loaded = true;
    }

    draw(ctx, layer) {
        return;
    }
}


export class SpriteResource extends Resource {
    constructor(id) {
        super(RES_SPRITE, id);
    }
}


export class LevelResource extends Resource {
    constructor(id) {
        super(RES_LEVEL, id);

        this.layers = Array.from({length: LEVEL_LAYER_MAX}, () => null);
        this.paths = [];
    }

    async load() {
        const levelData = await fetch(`${this.path}/${this.id}.json`)
            .then((response) => response.json());

        const layerFiles = levelData.layers;
        const expectLayerCount = layerFiles.filter(layer => layer !== null).length;
        layerFiles.forEach(async (layer, index) => {
            if (layer === null) {
                return;
            }
            const layerElement = document.createElement('img');
            layerElement.src = `${this.path}/${layer}`;
            layerElement.onload = () => {
                this.layers[index] = layerElement;
            }
        });

        let waitCount = 0;
        while (this.layers.filter(layer => layer === null).length < expectLayerCount) {
            // console.log(`waiting for level '${this.id}' to load...`);
            await new Promise(resolve => setTimeout(resolve, 100));
            if (waitCount++ > 10) {
                const errorMsg = `[Resource ${this.type}] FAILED to load level '${this.id}'`;
                // console.log(errorMsg);
                throw new Error(errorMsg);
            }
        }

        levelData.paths.forEach((pathData, pathIndex) => {
            const path = new Path();
            pathData.path.forEach((pathPartData, pathPartIndex) => {
                const points = pathPartData.points;
                const pathErorMsg = `[Resource ${this.type}] invalid path part data for path ${pathIndex} part ${pathPartIndex}`;
                let newPart;
                if (pathPartData.type === 'line') {
                    if (points.length !== 2) {
                        throw new Error(pathErorMsg);
                    }
                    newPart = new PathPartLine(points[0][0], points[0][1], points[1][0], points[1][1]);
                } else if (pathPartData.type === 'bezier') {
                    if (points.length !== 4) {
                        throw new Error(pathErorMsg);
                    }
                    newPart = new PathPartBezier(points[0][0], points[0][1], points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
                }
                newPart.layer = pathPartData.layer;
                path.addPart(newPart);
            });
            this.paths.push(path);
        });

        console.log(`[Resource ${this.type}] loaded '${this.id}' with ${expectLayerCount}/${LEVEL_LAYER_MAX} layers`);

        this.loaded = true;
    }

    draw(ctx, layer) {
        if (this.layers.length <= layer || this.layers[layer] === null) {
            return;
        }
        
        const drawLayer = this.layers[layer];

        ctx.drawImage(drawLayer, 0, 0);
    }
}
