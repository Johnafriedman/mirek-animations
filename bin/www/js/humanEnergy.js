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
    const pWIDTH = 4, pHEIGHT = 4, DELTA = 7;
    const DRAW_MODE = true;

    const bounds = [
        {
            t: 210,
            b: 1284,
            x: 477,
            d: 1,
            color: "#FF0000FF"
        },
        {
            t: 270,
            b: 714,
            x: 1624,
            d: -1,
            color: "#FFFFFFFF"
        }
    ];

    let scaledBounds = [{}, {}];

    let width, height, figureHeight;

    const IMAGE_PATH = "./assets/he/"
    const URL = [
        "humanEnergy1.jpg",
        "humanEnergy2.jpg"
    ];


    let frame = [];

    document.body.innerHTML = '';

    function visibleFrame(f, v) {
        frame[f].src.elem.style.visibility = v ? 'visible' : 'hidden';
    }


    async function initializeImage() {

        const visibility = ["visible", "hidden"];
        for (let f = 0; f < URL.length; f++) {
            let srcElem = document.createElement("canvas");
            let isVisible = visibility[f];
            srcElem.id = `source-${f}`;
            srcElem.style = `z-index:1; visibility:${isVisible}`;
            let srcCtx = srcElem.getContext('2d', {willReadFrequently: true});
            document.body.appendChild(srcElem);
            let dstElem = document.createElement("canvas");
            dstElem.id = `destination-${f}`;
            dstElem.style = `z-index:10; visibility:${isVisible}`;
            let dstCtx = dstElem.getContext('2d');
            document.body.appendChild(dstElem);

            let img = await loadImage(`${IMAGE_PATH}${URL[f]}`);
            let scale = Math.min(innerWidth / img.width, window.innerHeight / img.height);

            for (let b = 0; b < bounds.length; b++) {
                scaledBounds[b].t = Math.floor(bounds[b].t * scale);
                scaledBounds[b].b = Math.floor(bounds[b].b * scale);
                scaledBounds[b].x = Math.floor(bounds[b].x * scale);
                scaledBounds[b].h = scaledBounds[b].b - scaledBounds[b].t;
            }

            figureHeight = Math.max(scaledBounds[LEFT].h, scaledBounds[LEFT].h);
            width = Math.floor(img.width * scale);
            height = Math.floor(img.height * scale);

            srcCtx.canvas.width = width;
            srcCtx.canvas.height = height;
            dstCtx.canvas.width = width;
            dstCtx.canvas.height = height;

            srcCtx.drawImage(img, 0, 0, width, height);

            let position = [];
            position[LEFT] = new Array(figureHeight);
            position[RIGHT] = new Array(figureHeight);
            frame[f] = {
                src: {
                    elem: srcElem,
                    ctx: srcCtx
                },
                dst: {
                    elem: dstElem,
                    ctx: dstCtx
                }, position
            };
        }
    }

    function otherSide(side) {
        return side === LEFT ? RIGHT : LEFT;
    }

    function skipColor(f, x, y, side, isForeground) {
        const THRESHOLD = 24;

        let color, imageData;
        let bound = scaledBounds[otherSide(side)].x;
        do {
            imageData = frame[f].src.ctx.getImageData(x, y, 1, 1);
            /*            frame[f].dst.ctx.fillStyle = "#FF0000FF";
                        frame[f].dst.ctx.fillRect(x, y, 1, 1);*/
            x += bounds[side].d;
            color = (imageData.data[RED] > THRESHOLD) || (imageData.data[GREEN] > THRESHOLD) || (imageData.data[BLUE] > THRESHOLD);
        } while ((color == isForeground) && (side === LEFT ? x < bound : x > bound));

        return x;
    }

    function initializeAnimation() {

        for (let f = 0; f < frame.length; f++) {

            for (let side = LEFT; side <= RIGHT; side++) {
                let y = scaledBounds[side].t;
                let x = scaledBounds[side].x;
                for (let i = 0; i < figureHeight; i++) {

                    let x1 = skipColor(f, x, y + i, side, false);
                    let x2 = skipColor(f, x1, y + i, side, true);
                    frame[f].position[side][i] = {
                        start: x1,
                        end: x2,
                        current: x2,
                        delta: Math.sign(x2 - x1) * DELTA,
                        mode: DRAW_MODE
                    };
                }
            }
        }

    }

    function animate() {
        const DOT_DELAY = 80, FRAME_DELAY_MIN = 3, FRAME_DELAY_MAX = 20, LEFT_DOTS = 100, RIGHT_DOTS = 50;

        for (let f = 0; f < frame.length; f++) {
            frame[f].dst.ctx.globalAlpha = 1.0;
            frame[f].dst.ctx.globalCompositeOperation = "source-over";
            // Shadow
            // frame[f].dst.ctx.shadowColor = "#FFFF0010";
            frame[f].dst.ctx.shadowOffsetX = 20;
            frame[f].dst.ctx.shadowOffsetY = 20;
            // frame[f].dst.ctx.shadowBlur = 15;
        }


        let id;

        function drawADot(f, p, y, side) {

            if (p.mode === DRAW_MODE) {
                frame[f].dst.ctx.fillRect(p.current, scaledBounds[side].t + y, pWIDTH, pHEIGHT);
            } else {
                frame[f].dst.ctx.clearRect(p.current, scaledBounds[side].t + y, pWIDTH, pHEIGHT)
            }

            p.current += p.delta;
            if ((p.current >= frame[f].position[RIGHT][y].end) || (p.current <= frame[f].position[LEFT][y].end)) {
                p.mode = !p.mode;
                p.delta *= -1;
            }
            return p;
        }

        function toggleFrame() {
            if (frame[0].src.elem.style.visibility === 'visible') {
                frame[0].src.elem.style.visibility = 'hidden';
                frame[1].src.elem.style.visibility = 'visible';
            } else {
                frame[1].src.elem.style.visibility = 'hidden';
                frame[0].src.elem.style.visibility = 'visible';
            }
            ;
        }

        function newNextFrame(){
            return Math.floor(Math.random()*FRAME_DELAY_MAX)+FRAME_DELAY_MIN;
        }

        let nextFrame = newNextFrame();
        function drawDots() {

            for (let f = 0; f < frame.length; f++) {

                frame[f].dst.ctx.fillStyle = bounds[LEFT].color;
                for (let i = 0; i < LEFT_DOTS; i++) {

                    let y = Math.floor(Math.random() * (scaledBounds[LEFT].h / (pHEIGHT * 2))) * pHEIGHT * 2;
                    let p = frame[f].position[LEFT][y];
                    p = drawADot(f, p, y, LEFT);
                }

                frame[f].dst.ctx.fillStyle = bounds[RIGHT].color;
                for (let i = 0; i < RIGHT_DOTS; i++) {

                    let y = Math.floor(Math.random() * (scaledBounds[RIGHT].h / (pHEIGHT * 2))) * pHEIGHT * 2 + pHEIGHT;
                    let p = frame[f].position[RIGHT][y];
                    p = drawADot(f, p, y, RIGHT);
                }

            }
            if(--nextFrame<0){
                nextFrame = newNextFrame();
                toggleFrame();
            }
        }

        id = setInterval(drawDots, DOT_DELAY);


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

    await initializeImage();
    initializeAnimation();
    animate();

}
