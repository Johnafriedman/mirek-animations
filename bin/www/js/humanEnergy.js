/* humanEnergy.js */

let previousOrientation = window.screen.orientation;
let checkOrientation = function() {
    if(window.screen.orientation.type !== previousOrientation.type){
        previousOrientation.type = window.screen.orientation.type;
        humanEnergy();
    }
};

window.addEventListener("resize", humanEnergy, false);
window.addEventListener("orientationchange", checkOrientation, false);

// (optional) Android doesn't always fire orientationChange on 180 degree turns
setInterval(checkOrientation, 2000);

async function humanEnergy() {

    const LEFT = 1, RIGHT = 0, RED = 0, GREEN = 1, BLUE = 2, ALPHA = 3;
    const PIXEL_SIZE = 16;
    const bounds = [
        {
            t: 532,
            b: 1410,
            x: 350,
            d: 1
        },
        {
            t: 436,
            b: 2410,
            x: 1164,
            d: -1
        }
    ];

    let scale = 1;

    let srcCtx = null;
    let destCtx = null;

    let pixelImg = null;

    let pr = new Array(bounds[RIGHT].b - bounds[RIGHT].t);
    let pl = new Array(bounds[LEFT].b - bounds[LEFT].t);

    async function initializeImage() {
        let elem = document.getElementById("source");
        srcCtx = elem.getContext('2d',{willReadFrequently: true});
        elem = document.getElementById("source");
        destCtx = elem.getContext('2d');

        const IMAGE_URL = "./assets/he/humanEnergy1.jpg";
        let img = await loadImage(IMAGE_URL);

        let scale = Math.min(innerWidth/img.width, window.innerHeight/img.height);

        let width = img.width * scale;
        let height = img.height * scale;
        srcCtx.canvas.width = width;
        srcCtx.canvas.height = height;


        const PIXEL_URL = "./assets/he/pixel.png";

        pixelImg = await loadImage(PIXEL_URL);

        srcCtx.drawImage(img, 0, 0, width, height);
        srcCtx.drawImage(pixelImg, 0, 0, PIXEL_SIZE, PIXEL_SIZE);
        const imgData = srcCtx.createImageData(4,4);
        srcCtx.putImageData(imgData, 0,0);


    }

    function initializeAnimation() {

        for (let i = 0, y = bounds[RIGHT].t; i < pr.length; i++) {
            let x = bounds[RIGHT].x, imageData;
            do {
                imageData = srcCtx.getImageData(x++, y+i, 1, 1);
            } while (!(imageData.data[RED] || imageData.data[GREEN] || imageData.data[BLUE]));
            do {
                imageData = srcCtx.getImageData(x++, y+i, 1, 1);
            } while ((imageData.data[RED] || imageData.data[GREEN] || imageData.data[BLUE]));
            pr[i] = x;
        }

        debugger
    }

    function animate() {
        let c = 0;

        // const imgData = srcCtx.createImageData(4,4);
        // for( let i = 0; i < imgData.data.length; i += 4) {
        //     imgData.data[i+0] = 255;
        //     imgData.data[i+1] = 0;
        //     imgData.data[i+2] = 0;
        //     imgData.data[i+3] = 255;
        // }
        // do {
            let y = Math.floor(Math.random() * (pr.length));
            srcCtx.drawImage(pixelImg, pr[y], bounds[RIGHT].t + y);
        // } while (c++ < 1);
    }

    function skipColor() {

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
/*    initializeAnimation();
    animate();*/

}
