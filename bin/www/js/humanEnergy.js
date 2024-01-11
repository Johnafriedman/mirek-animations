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
            d: 1
        },
        {
            t: 536,
            b: 1412,
            x: 3244,
            d: -1
        }
    ];

    let scale = 1;

    let srcCtx = null;
    let destCtx = null;

    let pixelImg = null;

    let pl, pr;

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

        pl = new Array(scaledBounds[LEFT].b - scaledBounds[LEFT].t);
        pr = new Array(scaledBounds[RIGHT].b - scaledBounds[RIGHT].t);

        const PIXEL_URL = "./assets/he/pixel.png";

        pixelImg = await loadImage(PIXEL_URL);

        srcCtx.drawImage(img, 0, 0, width, height);
        srcCtx.drawImage(pixelImg, 0, 0, PIXEL_SIZE, PIXEL_SIZE);
        const imgData = srcCtx.createImageData(4, 4);
        srcCtx.putImageData(imgData, 0, 0);


    }

    function skipColor(x, y, side, isForeground){

        const imgData = srcCtx.createImageData(1,1);
        imgData.data = [255,0,0,1];

        let color, imageData;
        let otherSide = side === LEFT ? RIGHT : LEFT;
        let bound = scaledBounds[otherSide].x;
        do {
            imageData = srcCtx.getImageData(x, y, 1, 1);
            srcCtx.putImageData(imgData, x, y);

            x += bounds[side].d;
            color = (imageData.data[RED] != 0) || (imageData.data[GREEN] !=0)  || (imageData.data[BLUE]!=0);
        } while ((color == isForeground) && ( side === LEFT ? x < bound : x > bound));

        return x;
    }

    function initializeAnimation() {

        const imgData = srcCtx.createImageData(1,1);
        imgData.data = [255,0,0,1];

        for (let b = 0; b < bounds.length; b++) {
            scaledBounds[b].t = Math.floor(bounds[b].t * scale);
            scaledBounds[b].b = Math.floor(bounds[b].b * scale);
            scaledBounds[b].x = Math.floor(bounds[b].x * scale);
            scaledBounds[b].h = scaledBounds[b].b - scaledBounds[b].t;;
        }

        for(let side = LEFT; side <= RIGHT; side++){
            for (let i = 0; i < scaledBounds[side].h; i++) {
                let y = scaledBounds[side].t
                let x = scaledBounds[side].x;

                x = skipColor(x, y+i, side, false);
                x = skipColor(x, y+i, side, true);

                pl[i] = x;
            }
        }
    }

    function animate() {
        let c = 0;

        debugger
        const imgData = srcCtx.createImageData(4, 4);
        for (let i = 0; i < imgData.data.length; i += 4) {
            imgData.data[i + 0] = 255;
            imgData.data[i + 1] = 0;
            imgData.data[i + 2] = 0;
            imgData.data[i + 3] = 255;
        }
        do {
            let y = Math.floor(Math.random() * (pr.length));
            srcCtx.drawImage(pixelImg, pr[y], scaledBounds[RIGHT].t + y);
        } while (c++ < 1);
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
    // animate();

}
