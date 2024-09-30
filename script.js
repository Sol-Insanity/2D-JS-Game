// Get references to the canvas and its context, and the victory screen div
const canvas = document.getElementById('mazeCanvas');         // Reference to the canvas element
const ctx = canvas.getContext('2d');                          // 2D rendering context for drawing
const victoryScreen = document.getElementById('victoryScreen');  // Reference to the victory screen element

// Configuration for maze cell size and overall dimensions
const cellSize = 20;        // Size of each cell in pixels (20x20)
const mazeWidth = 15;       // Width of the maze in cells (minimum 15, maximum 29)
const mazeHeight = 15;      // Height of the maze in cells (minimum 15, maximum 29)

// Calculate the diagonal length of the maze to ensure it fits when rotated
const mazeDiagonal = Math.sqrt(Math.pow(mazeWidth * cellSize, 2) + Math.pow(mazeHeight * cellSize, 2));

// Set the canvas dimensions based on the diagonal length
canvas.width = mazeDiagonal;   // Set canvas width to fit rotated maze
canvas.height = mazeDiagonal;  // Set canvas height to fit rotated maze

// Center the canvas on the screen using CSS
canvas.style.position = 'absolute';
canvas.style.left = '50%';
canvas.style.top = '50%';
canvas.style.transform = 'translate(-50%, -50%)';

// Flag to indicate if the game is over
let gameOver = false;

// Variables for rotation animation
let currentRotation = 0;    // Current rotation angle of the maze
let targetRotation = 0;     // Target rotation angle for smooth animation
let isRotating = false;     // Flag to indicate if maze is currently rotating
const rotationSpeed = 0.1;  // Speed of rotation animation (adjust as needed)

// Class definition for the walls of the maze
class Wall {
    constructor(x, y, width, height) {
        this.x = x;           // X-coordinate of the wall
        this.y = y;           // Y-coordinate of the wall
        this.width = width;   // Width of the wall
        this.height = height; // Height of the wall
    }

    draw() {
        ctx.fillStyle = 'black';                           // Set wall color to black
        ctx.fillRect(this.x, this.y, this.width, this.height);  // Draw the wall as a filled rectangle
    }
}

// Class for the player's sprite
class Sprite {
    constructor(x, y) {
        this.x = x;                     // X-coordinate of the sprite
        this.y = y;                     // Y-coordinate of the sprite
        this.width = cellSize - 4;      // Width of the sprite (slightly smaller than cell)
        this.height = cellSize - 4;     // Height of the sprite (slightly smaller than cell)
        this.velocityX = 0;             // Horizontal velocity of the sprite
        this.velocityY = 0;             // Vertical velocity of the sprite
        this.gravity = 0.5;             // Gravity strength affecting the sprite
    }

    draw() {
        ctx.fillStyle = 'blue';                             // Set sprite color to red
        ctx.fillRect(this.x, this.y, this.width, this.height);  // Draw the sprite as a filled rectangle
    }

    update() {
        if (gameOver || isRotating) return;  // Don't update if game is over or maze is rotating

        // Apply gravity based on the current rotation
        this.velocityX += this.gravity * Math.sin(currentRotation);
        this.velocityY += this.gravity * Math.cos(currentRotation);

        let newX = this.x + this.velocityX;  // Calculate new X position
        let newY = this.y + this.velocityY;  // Calculate new Y position

        let collided = false;
        walls.forEach(wall => {
            if (this.checkCollision(newX, newY, wall)) {
                collided = true;
                // Adjust position based on collision direction
                if (Math.abs(this.velocityX) > Math.abs(this.velocityY)) {
                    this.velocityX = 0;
                    newX = this.velocityX > 0 ? wall.x - this.width : wall.x + wall.width;
                } else {
                    this.velocityY = 0;
                    newY = this.velocityY > 0 ? wall.y - this.height : wall.y + wall.height;
                }
            }
        });

        if (!collided) {
            this.x = newX;  // Update X position if no collision
            this.y = newY;  // Update Y position if no collision
        }

        // Keep the sprite within the canvas bounds
        this.x = Math.max(0, Math.min(this.x, mazeWidth * cellSize - this.width));
        this.y = Math.max(0, Math.min(this.y, mazeHeight * cellSize - this.height));

        // Apply friction to slow down the sprite
        this.velocityX *= 0.98;
        this.velocityY *= 0.98;

        // Check for victory condition
        if (this.checkVictory()) {
            gameOver = true;
            showVictoryScreen();
        }
    }

    checkCollision(x, y, wall) {
        // Check if sprite overlaps with a wall
        return x < wall.x + wall.width &&
               x + this.width > wall.x &&
               y < wall.y + wall.height &&
               y + this.height > wall.y;
    }

    checkVictory() {
        // Check if sprite has reached the exit
        const goalX = (mazeWidth - 1) * cellSize;
        const goalY = (mazeHeight - 2) * cellSize;
        return (
            this.x + this.width > goalX &&
            this.x < goalX + cellSize &&
            this.y + this.height > goalY &&
            this.y < goalY + cellSize
        );
    }
}

// Array to hold all wall objects
let walls = [];
// Create the player's sprite at the starting position
let sprite = new Sprite(cellSize, cellSize);

/*********************************************************  Maze Generation Algorithm *********************************************************/

        /*
        * This function generates a maze using the Depth-First Search (DFS) algorithm.
        * The maze is represented by a 2D grid, where:
        *  - 1 represents a wall.
        *  - 0 represents a path.
        * Initially, all cells are marked as walls (1).
        * The maze is carved out by recursively visiting cells and removing walls between them.
        */
        function generateMaze() {
            // Create a 2D grid where all cells are walls (1) to start with.
            let grid = Array(mazeHeight).fill().map(() => Array(mazeWidth).fill(1));

            /**
             * Helper function to get unvisited neighboring cells.
             * It checks for neighbors two cells away from the current position (x, y) in all directions: North, East, South, and West.
             * The function filters out neighbors that are out of bounds or already part of the maze (i.e., visited cells).
             * 
             * @param {number} x - The x-coordinate of the current cell.
             * @param {number} y - The y-coordinate of the current cell.
             * @returns {Array} - A list of unvisited neighboring cells (each neighbor is represented by its [x, y] coordinates).
             */
            function getUnvisitedNeighbors(x, y) {
                // Potential neighbors two cells away in four directions: North, East, South, West.
                const neighbors = [
                    [x, y - 2], // North
                    [x + 2, y], // East
                    [x, y + 2], // South
                    [x - 2, y]  // West
                ];
                // Filter neighbors that are out of bounds or already visited (where grid[ny][nx] is not 1).
                return neighbors.filter(([nx, ny]) =>
                    nx >= 0 && nx < mazeWidth && ny >= 0 && ny < mazeHeight && grid[ny][nx] === 1
                );
            }

            /**
             * Recursive function to carve paths in the maze using Depth-First Search (DFS).
             * This function starts from the current cell (x, y), marks it as part of the maze (0),
             * and randomly chooses a neighboring unvisited cell to carve a path to.
             * The function continues carving recursively from each newly visited neighbor until no unvisited neighbors are left.
             * 
             * @param {number} x - The x-coordinate of the current cell.
             * @param {number} y - The y-coordinate of the current cell.
             */
            function carvePath(x, y) {
                grid[y][x] = 0; // Mark the current cell as a path (visited).

                // Get a list of unvisited neighboring cells.
                const neighbors = getUnvisitedNeighbors(x, y);

                // Continue carving while there are unvisited neighbors.
                while (neighbors.length > 0) {
                    // Randomly choose a neighbor and remove it from the list.
                    const [nx, ny] = neighbors.splice(Math.floor(Math.random() * neighbors.length), 1)[0];

                    // If the chosen neighbor has not been visited, remove the wall between the current cell and the neighbor.
                    if (grid[ny][nx] === 1) {
                        // Remove the wall between the current cell and the chosen neighbor by marking the wall cell as part of the path.
                        // The wall is located halfway between the current cell (x, y) and the neighbor (nx, ny).
                        grid[y + (ny - y) / 2][x + (nx - x) / 2] = 0;

                        // Recursively carve paths starting from the chosen neighbor.
                        carvePath(nx, ny);
                    }
                }
            }

            // Start carving the maze from the cell at (1, 1).
            // This ensures that the maze has an alternating pattern of walls and paths.
            carvePath(1, 1);

            // Create an entrance at the top-left corner (1, 0) and an exit at the bottom-right corner (mazeHeight-2, mazeWidth-1).
            grid[1][0] = 0; // Entrance
            grid[mazeHeight - 2][mazeWidth - 1] = 0; // Exit

            /*
             * After generating the maze, convert the grid into Wall objects for rendering.
             * Any grid cell that is marked as a wall (1) is turned into a Wall object.
             * Each Wall object is created based on its position in the grid and the specified cellSize for rendering.
             */
            for (let y = 0; y < mazeHeight; y++) {
                for (let x = 0; x < mazeWidth; x++) {
                    if (grid[y][x] === 1) {
                        // Create a wall object for each cell marked as 1 (wall).
                        walls.push(new Wall(x * cellSize, y * cellSize, cellSize, cellSize));
                    }
                }
            }
        }

/*********************************************************  End of Algorithm *********************************************************/

function draw() {
    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Disable anti-aliasing
    ctx.imageSmoothingEnabled = false;

    // Save the current context state
    ctx.save();

    // Move the context to the center of the canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Rotate the context
    ctx.rotate(currentRotation);

    // Move the context back, considering the actual maze size
    ctx.translate(-mazeWidth * cellSize / 2, -mazeHeight * cellSize / 2);

    // Draw all walls
    walls.forEach(wall => wall.draw());

    // Draw the entrance (green)
    ctx.fillStyle = 'green';
    ctx.fillRect(0, cellSize, cellSize, cellSize);

    // Draw the exit (red)
    ctx.fillStyle = 'red';
    ctx.fillRect((mazeWidth - 1) * cellSize, (mazeHeight - 2) * cellSize, cellSize, cellSize);

    // Draw the player's sprite
    sprite.draw();

    // Restore the context to its original state
    ctx.restore();
}

function updateRotation() {
    if (isRotating) {
        // Calculate the difference between target and current rotation
        const rotationDiff = targetRotation - currentRotation;
        if (Math.abs(rotationDiff) > 0.01 /* 0.01 Default*/ ) {
            // Smoothly interpolate towards the target rotation
            currentRotation += rotationDiff * rotationSpeed;
        } else {
            // Rotation complete
            currentRotation = targetRotation;
            isRotating = false;
            updateSpriteVelocity();
        }
    }
}

function updateSpriteVelocity() {
    // Recalculate sprite velocity based on new rotation
    const speed = Math.sqrt(sprite.velocityX ** 2 + sprite.velocityY ** 2);
    sprite.velocityX = speed * Math.sin(currentRotation);
    sprite.velocityY = speed * Math.cos(currentRotation);
}

/*********************************************************  New Stuff *********************************************************/

let startTime;
let elapsedTime = 0;
let rotationCount = 0;

const timeDisplay = document.getElementById('timeDisplay');
const rotationDisplay = document.getElementById('rotationDisplay');

function updateHUD() {
    const seconds = (elapsedTime / 1000).toFixed(2);
    timeDisplay.textContent = `Time: ${seconds}`;
    rotationDisplay.textContent = `Rotations: ${rotationCount}`;
}

/*********************************************************  New Stuff *********************************************************/

function gameLoop(timestamp) {
    if (!gameOver) {
        if (!startTime) startTime = timestamp;
        elapsedTime = timestamp - startTime;

        sprite.update();
        updateRotation();
        draw();
        updateHUD();
        requestAnimationFrame(gameLoop);
    }
}

function restartGame() {
    gameOver = false;
    startTime = null;
    elapsedTime = 0;
    rotationCount = 0;
    currentRotation = 0;
    targetRotation = 0;
    isRotating = false;
    
    walls = [];
    sprite = new Sprite(cellSize, cellSize);
    
    generateMaze();
    victoryScreen.style.display = 'none';
    updateHUD();
    gameLoop();
}

function rotateMaze(direction) {
    if (!isRotating) {
        const angleStep = Math.PI / 2;
        targetRotation += direction === 'right' ? angleStep : -angleStep;
        isRotating = true;
        rotationCount++;
        updateHUD();
    }
}


function showVictoryScreen() {
    gameOver = true;
    victoryScreen.style.display = 'flex';
    victoryScreen.innerHTML = `
        <div class="victoryMessage">
            <h2>Victory!</h2>
            <p>Time: ${(elapsedTime / 1000).toFixed(2)} seconds</p>
            <p>Rotations: ${rotationCount}</p>
            <button onclick="restartGame()">Play Again</button>
        </div>
    `;

    // Play victory sound
    const victorySound = new Audio('assets/Victory.mp3');
    victorySound.play();
}

// Event listener for keyboard input
window.addEventListener('keydown', (e) => {
    if (!gameOver) {
        if (e.key === 'ArrowRight') {
            rotateMaze('right');  // Rotate maze right on right arrow key
        } else if (e.key === 'ArrowLeft') {
            rotateMaze('left');   // Rotate maze left on left arrow key
        }
    }
});

// Initialize the game
generateMaze();  // Generate the maze layout
gameLoop();      // Start the game loop