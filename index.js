const canvas = document.querySelector('canvas'); // get the canvas element from the html (example :- canvas,head,body,etc)
const c = canvas.getContext('2d'); // get the 2d context of the canvas (example :- 3d,webgl,etc)

canvas.width = 1024; // set the width of the canvas
canvas.height = 576; // set the height of the canvas

c.fillRect(0, 0, canvas.width, canvas.height); // fill the canvas with a color

const gravity = 0.2;

class Sprite {
    // constructor method
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        this.height =  150;
    }

    // draw method
    draw() {
        c.fillStyle = 'red';
        c.fillRect(this.position.x, this.position.y, 32, this.height);
    }

    // update method
    update() {
        this.draw();
        this.position.y += this.velocity.y;

        if (this.position.y + this.height + this.velocity.y >= canvas.height) {
            this.velocity.y = 0;
        } else {
            this.velocity.y += gravity;
        }
    }
}

const player = new Sprite({
    position: {
        x: 100,
        y: 100
    },
    velocity: {
        x: 0,
        y: 0
    }
});

const enemy = new Sprite({
    position: {
        x: 300,
        y: 300
    },
    velocity: {
        x: 0,
        y: 0
    }
});


//recursive function that calls upon itself to create an animation loop
function animate() {
    window.requestAnimationFrame(animate);
    c.fillStyle = 'black'; //'rgba(0, 0, 0, 0.1)'
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.update();
    enemy.update();
}

animate();