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
    const pWIDTH = 8, pHEIGHT = 4, DELTA = 4;
    const DRAW_MODE = true;

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

    let scaledBounds = [{},{}];

    let scale = 1;

    let srcCtx = null;
    let destCtx = null;

    let pixelImg = null;

    let position = [];

    let width, height, figureHeight;

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

        for (let b = 0; b < bounds.length; b++) {
            scaledBounds[b].t = Math.floor(bounds[b].t * scale);
            scaledBounds[b].b = Math.floor(bounds[b].b * scale);
            scaledBounds[b].x = Math.floor(bounds[b].x * scale);
            scaledBounds[b].h = scaledBounds[b].b - scaledBounds[b].t;
        }

        const PIXEL_URL = "./assets/he/pixel.png";

        pixelImg = await loadImage(PIXEL_URL);

        srcCtx.drawImage(img, 0, 0, width, height);

        figureHeight = Math.max(scaledBounds[LEFT].h, scaledBounds[LEFT].h)
        position[LEFT] = new Array(figureHeight);
        position[RIGHT] = new Array(figureHeight);
    }

    function otherSide(side){
        return side === LEFT ? RIGHT : LEFT;
    }

    function skipColor(x, y, side, isForeground) {
        const THRESHOLD = 24;

        let color, imageData;
        let bound = scaledBounds[otherSide(side)].x;
        do {
            imageData = srcCtx.getImageData(x, y, 1, 1);
            x += bounds[side].d;
            color = (imageData.data[RED] > THRESHOLD) || (imageData.data[GREEN] > THRESHOLD) || (imageData.data[BLUE] > THRESHOLD);
        } while ((color == isForeground) && (side === LEFT ? x < bound : x > bound));

        return x;
    }

    function initializeAnimation() {

        for (let side = LEFT; side <= RIGHT; side++) {
            let y = scaledBounds[side].t;
            let x = scaledBounds[side].x;
            for (let i = 0; i < figureHeight; i++) {

                let x1 = skipColor(x, y + i, side, false);
                let x2 = skipColor(x1, y + i, side, true);
                position[side][i] = {start: x1, end: x2, current: x2, delta: Math.sign(x2-x1) * DELTA, mode: DRAW_MODE};
            }
        }
    }

    function animate() {
        const DELAY = 80, LEFT_DOTS = 100, RIGHT_DOTS = 50;

        destCtx.globalAlpha = .8;
        destCtx.globalCompositeOperation = "source-over";
        // Shadow
        destCtx.shadowColor = "#FFFF0010";
        destCtx.shadowOffsetX = 20;
        destCtx.shadowOffsetY = 20;
        // destCtx.shadowBlur = 15;

        destCtx.fillStyle = "#FFFF0020";
        const colors = ["#FF000020","#00FF0020"];

            let id;

        function drawADot(p, y, side){

            destCtx.fillStyle = colors[side];

            if (p.mode === DRAW_MODE) {
                destCtx.drawImage(pixelImg, p.current, scaledBounds[side].t + y, pWIDTH, pHEIGHT);
            } else {
                destCtx.clearRect(p.current, scaledBounds[side].t + y, pWIDTH, pHEIGHT)
            }

            p.current += p.delta;
            if((p.current >= position[RIGHT][y].start) || (p.current <= position[LEFT][y].start)) {
                p.mode = !p.mode;
                p.delta *= -1;
            }
            return p;
        }

        function drawDots() {

            for (let i=0; i < LEFT_DOTS; i++) {

                let y = Math.floor(Math.random() * (scaledBounds[LEFT].h/4))*4;
                let p = position[LEFT][y];
                p = drawADot(p, y, LEFT);
            }

            for (let i=0; i < RIGHT_DOTS; i++) {

                let y = Math.floor(Math.random() * (scaledBounds[RIGHT].h/4)) *4 +2;
                let p = position[RIGHT][y];
                p = drawADot(p, y, RIGHT);
            }

        }

        id = setInterval(drawDots, DELAY)

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
