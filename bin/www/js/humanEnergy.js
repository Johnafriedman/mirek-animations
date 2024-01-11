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

    function initializeAnimation() {

        const imgData = srcCtx.createImageData(1,1);
        imgData.data = [255,0,0,1];

        for (let b = 0; b < bounds.length; b++) {
            scaledBounds[b].t = Math.floor(bounds[b].t * scale);
            scaledBounds[b].b = Math.floor(bounds[b].b * scale);
            scaledBounds[b].x = Math.floor(bounds[b].x * scale);
        }
        let imageData, color;

        let height = scaledBounds[LEFT].b - scaledBounds[LEFT].t;
        console.log("LEFT stop on color");
        for (let i = 0, y = scaledBounds[LEFT].t; i < height; i++) {
            let x = scaledBounds[LEFT].x;
            do {
                imageData = srcCtx.getImageData(x, y + i, 1, 1);
                srcCtx.putImageData(imgData, x, y+i);

                x += bounds[LEFT].d;
                color = (imageData.data[RED] || imageData.data[GREEN] || imageData.data[BLUE]);
            } while ((!color) && (x < scaledBounds[RIGHT].x));
            if(color) console.log(`color:${color} x:${x} y:${i}`);
            pl[i] = x;
        }

        console.log("RIGHT stop on color");

        height = scaledBounds[RIGHT].b - scaledBounds[RIGHT].t;

        for (let i = 0, y = scaledBounds[RIGHT].t; i < height; i++) {
            let x = scaledBounds[RIGHT].x;
            do {
                imageData = srcCtx.getImageData(x, y + i, 1, 1);
                srcCtx.putImageData(imgData, x, y+i);

                x+=bounds[RIGHT].d;
                color = (imageData.data[RED] || imageData.data[GREEN] || imageData.data[BLUE]);
                console.log(`color:${color} x:${x}`)

            } while ((!color) && (x > scaledBounds[LEFT].x));
            if(color) console.log(`color:${color} x:${x} y:${i}`);
            pr[i] = x;
        }

        debugger
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
