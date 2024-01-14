/* humanEnergy.js */

let previousOrientation = window.screen.orientation;
let checkOrientation = function () {
    if (window.screen.orientation.type !== previousOrientation.type) {
        previousOrientation.type = window.screen.orientation.type;
        humanEnergy();
    }
};

window.addEventListener("resize", humanEnergy, false);
window.addEventListener("orientationchange", checkOrientation, false);

// (optional) Android doesn't always fire orientationChange on 180 degree turns
setInterval(checkOrientation, 2000);

async function humanEnergy() {

    const LEFT = 0, RIGHT = 1, RED = 0, GREEN = 1, BLUE = 2, ALPHA = 3;
    const bounds = [
        {
            t: 438,
            b: 2410,
            x: 1024,
            d: 1
        },
        {
            t: 536,
            b: 1412,
            x: 3244,
            d: -1
        }
    ];

    let scaledBounds = [
        {
            t: 438,
            b: 2410,
            x: 1164,
            d: 1,
            h: 0
        },
        {
            t: 536,
            b: 1412,
            x: 3244,
            d: -1,
            h: 0
        }
    ];

    let scale = 1;

    let srcCtx = null;
    let destCtx = null;

    let pixelImg = null;

    let position = [];

    let width, height;

    async function initializeImage() {
        let elem = document.getElementById("source");
        srcCtx = elem.getContext('2d', {willReadFrequently: true});
        elem = document.getElementById("destination");
        destCtx = elem.getContext('2d');

        const IMAGE_URL = "./assets/he/humanEnergy1.jpg";
        let img = await loadImage(IMAGE_URL);

        scale = Math.min(innerWidth / img.width, window.innerHeight / img.height);

        width = Math.floor(img.width * scale);
        height = Math.floor(img.height * scale);

        srcCtx.canvas.width = width;
        srcCtx.canvas.height = height;
        destCtx.canvas.width = width;
        destCtx.canvas.height = height;

        position[0] = new Array(scaledBounds[LEFT].b - scaledBounds[LEFT].t);
        position[1] = new Array(scaledBounds[RIGHT].b - scaledBounds[RIGHT].t);

        const PIXEL_URL = "./assets/he/pixel.png";

        pixelImg = await loadImage(PIXEL_URL);

        srcCtx.drawImage(img, 0, 0, width, height);
    }

    function skipColor(x, y, side, isForeground) {
        const THRESHOLD = 24;

        let color, imageData;
        let otherSide = side === LEFT ? RIGHT : LEFT;
        let bound = scaledBounds[otherSide].x;
        do {
            imageData = srcCtx.getImageData(x, y, 1, 1);
            x += bounds[side].d;
            color = (imageData.data[RED] > THRESHOLD) || (imageData.data[GREEN] > THRESHOLD) || (imageData.data[BLUE] > THRESHOLD);
        } while ((color == isForeground) && (side === LEFT ? x < bound : x > bound));

        return x;
    }

    function initializeAnimation() {

        for (let b = 0; b < scaledBounds.length; b++) {
            scaledBounds[b].t = Math.floor(bounds[b].t * scale);
            scaledBounds[b].b = Math.floor(bounds[b].b * scale);
            scaledBounds[b].x = Math.floor(bounds[b].x * scale);
            scaledBounds[b].h = scaledBounds[b].b - scaledBounds[b].t;
        }

        for (let side = LEFT; side <= RIGHT; side++) {
            for (let i = 0; i < scaledBounds[side].h; i++) {
                let y = scaledBounds[side].t;
                let x = scaledBounds[side].x;

                x = skipColor(x, y + i, side, false);
                x = skipColor(x, y + i, side, true);

                position[side][i] = {start: x, current: x};
            }
        }
    }

    function animate() {
        const DELAY = 40, LEFT_DOTS = 100, RIGHT_DOTS = 50;
        const DRAW_MODE = true, ERASE_MODE = false;
        let mode = DRAW_MODE;

        let c = 0;

        destCtx.globalAlpha = .3;
        // Shadow
        destCtx.shadowColor = "#00000010";
        destCtx.shadowOffsetX = 20;
        destCtx.shadowOffsetY = 20;
        // destCtx.shadowBlur = 15;

        destCtx.fillStyle = "#FFFF0080";

        let maxX = 0, minX = 10000, id;

        function toggleMode(){
            mode = !mode;
            maxX = 0, minX = 10000;

        }

        function drawADot() {
            const pWIDTH = 8, pHEIGHT = 16, DELTA = 4;

            for (let i = 0; i < LEFT_DOTS; i++) {

                let y = Math.floor(Math.random() * (scaledBounds[LEFT].h));
                if(mode===DRAW_MODE){
                    destCtx.drawImage(pixelImg, position[LEFT][y].current+=DELTA, scaledBounds[LEFT].t + y, pWIDTH, pHEIGHT);
                } else {
                    destCtx.clearRect(position[LEFT][y].current-=4, scaledBounds[LEFT].t + y, 4, 1)
                }

                if(mode===DRAW_MODE){
                    maxX = Math.max(maxX, position[LEFT][y].current);
                    if (maxX >= width)
                        toggleMode();
                } else {
                    minX = Math.min(minX, position[LEFT][y].current);
                    if (minX <= 0)
                        toggleMode();
                }

            }

            for (let i = 0; i < RIGHT_DOTS; i++) {

                let y = Math.floor(Math.random() * (scaledBounds[RIGHT].h));
                if(mode===DRAW_MODE) {
                    destCtx.drawImage(pixelImg, position[RIGHT][y].current -= DELTA, scaledBounds[RIGHT].t + y, pWIDTH, pHEIGHT);
                }else {
                    destCtx.clearRect(position[RIGHT][y].current+=4, scaledBounds[RIGHT].t + y, 4, 1)
                }

                if(mode===DRAW_MODE){
                    minX = Math.min(minX, position[RIGHT][y].current);
                    if (minX <= 0)
                        toggleMode();
                } else {
                    maxX = Math.max(maxX, position[RIGHT][y].current);
                    if (maxX >= width)
                        toggleMode();
                }

            }
        }

        id = setInterval(drawADot, DELAY)

    }

    function getImageContext(url) {

        let img = null;
        loadImage(url).then((value => img = value));
        if (typeof window.createImageBitmap === 'function') {
            createImageBitmap(img).then((value => img = value));
        }
        const ctx = get2DContext(img.width, img.height);

        ctx.drawImage(img, 0, 0);

        return ctx;
    }

// some helpers

    async function loadImage(url) {
        return new Promise((res, rej) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            img.onload = e => res(img);
            img.onerror = rej;
        });
    }

    function get2DContext(width = 300, height = 150) {
        return Object.assign(
            document.createElement('canvas'),
            {width: width, height: height}
        ).getContext('2d');
    }

    await initializeImage();
    initializeAnimation();
    animate();

}
