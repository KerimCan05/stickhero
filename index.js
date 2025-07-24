console.log('Hello World!')

//Game State

let phase = "waiting";
let lastTimestamp;

let heroX;
let heroY;
let sceneOffset;

let platforms = [];
let sticks = [];

let score = 0;

// Configuration

const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const stretchingSpeed = 4;
const turningSpeed = 4;
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

// Getting the canvas element
const canvas = document.getElementById('game');
canvas.width = window.innerWidth

// Getting the drawing context
const ctx = canvas.getContext('2d');

// Further UI elements
const scoreElement = document.getElementById('score');
const restartButton = document.getElementById('restart');

// Start Game
resetGame();

// Resets game state and layout
function resetGame() {

    // Reset game state
    phase = "waiting";
    lastTimestamp = undefined;

    // The first platform is always the same
    platforms = [{ x: 50, w: 50 },];
    generatePlatform();
    generatePlatform();
    generatePlatform();
    generatePlatform();

    // Initialize hero position
    heroX = platforms[0].x + platforms[0].w - 30
    heroY = 0;

    // By how much should we shift the screen back
    sceneOffset = 0;

    // There's always a stick, even if it appears to be invisible (length: 0)
    sticks = [{x:platforms[0].x + platforms[0].w, length: 0, rotation: 0}];

    // Score
    score = 0;

    // Reset UI
    restartButton.style.display = 'none';
    scoreElement.innerText = score;

    draw();
}

function generatePlatform() {
    const minGap = 40;
    const maxGap = 200;
    const minWidth = 20;
    const maxWidth = 100;

    // X coordinate of the right edge of the furthest platform
    const lastPlatform = platforms[platforms.length - 1];
    let furthestX = lastPlatform.x + lastPlatform.w;

    const x =
        furthestX +
        minGap +
        Math.floor(Math.random() * (maxGap - minGap));
    const w =
        minWidth + Math.floor(Math.random() * (maxWidth - minWidth));

    platforms.push({x , w});
}

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save the current transformation
    ctx.save();

    // Shifting the view
    ctx.translate(-sceneOffset, 0);

    // Draw Scene
    drawPlatforms();
    drawHero();
    drawSticks();

    // Restore
    ctx.restore();

}

function drawPlatforms() {
    platforms.forEach(({x,w}) => {
        // Draw platform
        ctx.fillStyle = "black";
        ctx.fillRect(x, canvasHeight - platformHeight, w, platformHeight)
    });
}
function drawHero() {
    const heroWidth = 20;
    const heroHeight = 30;

    ctx.fillStyle = "red";
    ctx.fillRect(
        heroX,
        heroY + canvasHeight - platformHeight - heroHeight,
        heroWidth,
        heroHeight
    );
}
function drawSticks() {
    sticks.forEach(stick => {
       ctx.save();

        // Move the anchor point to the start of the stick and rotate
        ctx.translate(stick.x, canvasHeight - platformHeight);
        ctx.rotate((Math.PI / 180) * stick.rotation);

        // Draw stick
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(0, -stick.length);
        ctx.stroke();

        // Restore transformations
        ctx.restore();
    });
}

window.addEventListener("mousedown", function (event) {

    if (phase === "waiting") {
        phase = "stretching";
        lastTimestamp = undefined;
        window.requestAnimationFrame(animate);
    }

});

window.addEventListener("mouseup", function (event) {

    if (phase === "stretching") {
        phase = "turning";
    }

});

restartButton.addEventListener("click", function (event) {

    resetGame();
    restartButton.style.display = "none";

});

function thePlatformTheStickHits() {
    const lastStick = sticks[sticks.length - 1];
    const stickFarX = lastStick.x + lastStick.length;

    const platformTheStickHits = platforms.find(
        (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
    );

    return platformTheStickHits;
}

function animate(timestamp) {
    if (!lastTimestamp) {
        // First Cycle
        lastTimestamp = timestamp;
        window.requestAnimationFrame(animate);
        return;
    }

    let timePassed = timestamp - lastTimestamp;

    switch (phase) {
        case "waiting":
            return; // Stop the loop
        case "stretching": {
            sticks[sticks.length - 1].length += timePassed / stretchingSpeed;
            break;
        }
        case "turning": {
            sticks[sticks.length - 1].rotation += timePassed / turningSpeed;

            if (sticks[sticks.length - 1].rotation >= 90) {
                sticks[sticks.length - 1].rotation = 90;

                const nextPlatform = thePlatformTheStickHits();
                if (nextPlatform) {
                    score++
                    scoreElement.innerText = score;

                    generatePlatform();
                }
                phase = "walking";
            }
            break;
        }
        case "walking": {
            heroX += timePassed / walkingSpeed;

            const nextPlatform = thePlatformTheStickHits();
            if (nextPlatform){
                // If the hero will reach another platform then limit its position at its edge
                const maxHeroX = nextPlatform.x + nextPlatform.w - 30;
                if (heroX > maxHeroX) {
                    heroX = maxHeroX;
                    phase = "transitioning";
                }
            }else{
                // If hero won't reach another platform then limit its position at the end of the pole
                const maxHeroX =
                    sticks[sticks.length - 1].x +
                    sticks[sticks.length - 1].length;
                if (heroX > maxHeroX) {
                    heroX = maxHeroX;
                    phase = "falling";
                }
            }
            break;
        }
        case "transitioning":  {
            sceneOffset += timePassed / transitioningSpeed;

            const nextPlatform = thePlatformTheStickHits();
            if (nextPlatform.x + nextPlatform.w - sceneOffset < 100){
                sticks.push({
                    x: nextPlatform.x + nextPlatform.w,
                    length: 0,
                    rotation: 0,
                })
                phase = "waiting"
            }
            break;
        }
        case "falling": {
            heroY += timePassed / fallingSpeed;

            if (sticks[sticks.length - 1].rotation < 180) {
                sticks[sticks.length - 1].rotation += timePassed / turningSpeed;
            }

            const maxHeroY = platformHeight + 100;
            if (heroY > maxHeroY){
                restartButton.style.display = "block";
                return;
            }
            break;
        }
    }

    draw();
    lastTimestamp = timestamp;

    window.requestAnimationFrame(animate);
}