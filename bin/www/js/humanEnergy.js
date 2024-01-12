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
    const PIXEL_SIZE = 16;
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
        elem = document.getElementById("source");
        destCtx = elem.getContext('2d');

        const IMAGE_URL = "./assets/he/humanEnergy1.jpg";
        let img = await loadImage(IMAGE_URL);

        scale = Math.min(innerWidth / img.width, window.innerHeight / img.height);

        width = Math.floor(img.width * scale);
        height = Math.floor(img.height * scale);

        srcCtx.canvas.width = width;
        srcCtx.canvas.height = height;

        position[0] = new Array(scaledBounds[LEFT].b - scaledBounds[LEFT].t);
        position[1] = new Array(scaledBounds[RIGHT].b - scaledBounds[RIGHT].t);

        const PIXEL_URL = "./assets/he/pixel.png";

        pixelImg = await loadImage(PIXEL_URL);

        srcCtx.drawImage(img, 0, 0, width, height);
    }

    function skipColor(x, y, side, isForeground) {
        const THRESHOLD = 24

        // const imgData = srcCtx.createImageData(1,1);
        // imgData.data = [255,0,0,1];

        let color, imageData;
        let otherSide = side === LEFT ? RIGHT : LEFT;
        let bound = scaledBounds[otherSide].x;
        do {
            imageData = srcCtx.getImageData(x, y, 1, 1);
            // srcCtx.putImageData(imgData, x, y);

            x += bounds[side].d;
            color = (imageData.data[RED] > THRESHOLD) || (imageData.data[GREEN] > THRESHOLD) || (imageData.data[BLUE] > THRESHOLD);
        } while ((color == isForeground) && (side === LEFT ? x < bound : x > bound));

        return x;
    }

    function initializeAnimation() {

        const imgData = srcCtx.createImageData(1, 1);
        imgData.data = [255, 0, 0, 1];

        for (let b = 0; b < scaledBounds.length; b++) {
            scaledBounds[b].t = Math.floor(bounds[b].t * scale);
            scaledBounds[b].b = Math.floor(bounds[b].b * scale);
            scaledBounds[b].x = Math.floor(bounds[b].x * scale);
            scaledBounds[b].h = scaledBounds[b].b - scaledBounds[b].t;
            ;
        }

        for (let side = LEFT; side <= RIGHT; side++) {
            for (let i = 0; i < scaledBounds[side].h; i++) {
                let y = scaledBounds[side].t
                let x = scaledBounds[side].x;

                x = skipColor(x, y + i, side, false);
                x = skipColor(x, y + i, side, true);

                position[side][i] = x;
            }
        }
    }

    function animate() {
        const DELAY = 92;
        let c = 0;

        const imgData = srcCtx.createImageData(1, 1);
        for (let i = 0; i < imgData.data.length; i += 4) {
            imgData.data[i + 0] = 255;
            imgData.data[i + 1] = 255;
            imgData.data[i + 2] = 0;
            imgData.data[i + 3] = 1;
        }
        let maxX = 0, minX = 10000, id;

        function drawADot() {
            const pWIDTH = 16, pHEIGHT = 8, DELTA = 2;

            for (let i = 0; i < scaledBounds[LEFT].h; i++) {

                let y = Math.floor(Math.random() * (scaledBounds[LEFT].h));
                srcCtx.drawImage(pixelImg, position[LEFT][y]+=DELTA, scaledBounds[LEFT].t + y, pWIDTH, pHEIGHT);
                maxX = Math.max(maxX, position[LEFT][y]);
                if (maxX > scaledBounds[RIGHT].x)
                    clearInterval(id);

            }

            for (let i = 0; i < scaledBounds[RIGHT].h; i++) {

                let y = Math.floor(Math.random() * (scaledBounds[RIGHT].h));
                srcCtx.drawImage(pixelImg, position[RIGHT][y]-=DELTA, scaledBounds[RIGHT].t + y, pWIDTH, pHEIGHT);
                minX = Math.min(minX, position[RIGHT][y]);
                if (minX < scaledBounds[LEFT].x)
                    clearInterval(id);

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
