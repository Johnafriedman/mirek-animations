/* humanEnergy.js */


function initializeAnimation(url){
    let elem = document.getElementById("onscreen")
    let ctx = elem.getContext('2d');

    let h = window.innerHeight;
    let w = window.innerWidth;

    ctx.canvas.width  = w;
    ctx.canvas.height = h;

    let ratio = w/h;
    const IMAGE_URL = "./assets/he/humanEnergy1.jpg";

    loadImage(IMAGE_URL).then(
        (img) => {ctx.drawImage(img, 0,0, w, h)}
    );


}

function getImageContext(url) {

    let img = null;
    loadImage(url).then((value => img = value));
    if(typeof window.createImageBitmap === 'function') {
        createImageBitmap(img).then((value => img=value));
    }
    const ctx = get2DContext(img.width, img.height);

    ctx.drawImage(img, 0,0);

    return ctx;
}

// some helpers

function loadImage(url) {
    return new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = e => res(img);
        img.onerror = rej;
    });
}

function get2DContext(width = 300, height=150) {
    return Object.assign(
        document.createElement('canvas'),
        {width:width, height:height}
        ).getContext('2d');
}


