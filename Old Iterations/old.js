        // Get references to the canvas and its context, and the victory screen div
        const canvas = document.getElementById('mazeCanvas');
        const ctx = canvas.getContext('2d');
        const victoryScreen = document.getElementById('victoryScreen');

        // Configuration for maze cell size and overall dimensions
        const cellSize = 20;        // Each cell in the maze is 20x20 pixels
        const mazeWidth = 21;       // Maze grid is 21 cells wide
        const mazeHeight = 21;      // Maze grid is 21 cells tall

        // Set the canvas dimensions based on maze size
        canvas.width = mazeWidth * cellSize;
        canvas.height = mazeHeight * cellSize;

        // Flag to indicate if the game is over
        let gameOver = false;

        // Class definition for the walls of the maze
        class Wall {
            constructor(x, y, width, height) {
                this.x = x;       // X coordinate of the wall's top-left corner
                this.y = y;       // Y coordinate of the wall's top-left corner
                this.width = width; // Width of the wall
                this.height = height; // Height of the wall
            }

            // Draw the wall on the canvas
            draw() {
                ctx.fillStyle = 'black'; // Set color for walls
                ctx.fillRect(this.x, this.y, this.width, this.height); // Draw filled rectangle for the wall
            }
        }

        // Class for the player's sprite (the moving object within the maze)
        class Sprite {
            constructor(x, y) {
                this.x = x;       // X coordinate of the sprite's position
                this.y = y;       // Y coordinate of the sprite's position
                this.width = cellSize - 4;  // Sprite size slightly smaller than the cell to give spacing
                this.height = cellSize - 4;
                this.velocityX = 0;  // Initial velocity along X axis
                this.velocityY = 0;  // Initial velocity along Y axis
                this.gravity = 0.5;  // Magnitude of the gravity applied to the sprite
            }

            // Draw the sprite on the canvas
            draw() {
                ctx.fillStyle = 'red';  // Set sprite color to red
                ctx.fillRect(this.x, this.y, this.width, this.height);  // Draw the sprite as a red square
            }

            // Update sprite's position and handle collisions and gravity
            update() {
                if (gameOver) return; // If game is over, stop updating

                // Apply gravity based on the current rotation of the maze
                this.velocityX += this.gravity * Math.sin(currentRotation); // Adjust X velocity using sine of rotation
                this.velocityY += this.gravity * Math.cos(currentRotation); // Adjust Y velocity using cosine of rotation

                // Calculate new position based on current velocity
                let newX = this.x + this.velocityX;
                let newY = this.y + this.velocityY;

                // Check for collisions with walls
                let collided = false; // Track whether a collision occurs
                walls.forEach(wall => {
                    if (this.checkCollision(newX, newY, wall)) { // If a collision is detected
                        collided = true;
                        // Handle collision response
                        // Determine which velocity to adjust based on the direction of the collision
                        if (Math.abs(this.velocityX) > Math.abs(this.velocityY)) {
                            this.velocityX = 0; // Stop horizontal movement
                            // Adjust X position based on the collision direction
                            newX = this.velocityX > 0 ? wall.x - this.width : wall.x + wall.width;
                        } else {
                            this.velocityY = 0; // Stop vertical movement
                            // Adjust Y position based on the collision direction
                            newY = this.velocityY > 0 ? wall.y - this.height : wall.y + wall.height;
                        }
                    }
                });

                // If no collision, update the sprite's position
                if (!collided) {
                    this.x = newX;
                    this.y = newY;
                }

                // Ensure the sprite stays within the canvas bounds
                this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
                this.y = Math.max(0, Math.min(this.y, canvas.height - this.height));

                // Apply friction to gradually reduce velocity
                this.velocityX *= 0.98;
                this.velocityY *= 0.98;

                // Check if the sprite has reached the goal (victory condition)
                if (this.checkVictory()) {
                    gameOver = true; // End the game
                    showVictoryScreen(); // Display victory message
                }
            }

            // Check if the sprite is colliding with a wall
            checkCollision(x, y, wall) {
                return x < wall.x + wall.width &&
                       x + this.width > wall.x &&
                       y < wall.y + wall.height &&
                       y + this.height > wall.y;
            }

            // Check if the sprite has reached the goal (bottom-right corner of the maze)
            checkVictory() {
                const goalX = (mazeWidth - 1) * cellSize;  // X position of goal
                const goalY = (mazeHeight - 2) * cellSize; // Y position of goal
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
        // Create the player's sprite at the starting position (top-left corner)
        let sprite = new Sprite(cellSize, cellSize);
        // Track the current rotation of the maze
        let currentRotation = 0;


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

        // Draw the maze and sprite on the canvas
        function draw() {
            // Clear the canvas before each frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Save the current canvas state (before rotation)
            ctx.save();
            // Translate the canvas to its center to allow rotation around the middle
            ctx.translate(canvas.width / 2, canvas.height / 2);
            // Apply the current rotation to the maze
            ctx.rotate(currentRotation);
            // Translate back to the original position
            ctx.translate(-canvas.width / 2, -canvas.height / 2);

            // Draw each wall
            walls.forEach(wall => wall.draw());

            // Draw the goal (green square) in the bottom-right corner
            ctx.fillStyle = 'green';
            ctx.fillRect(0, cellSize, cellSize, cellSize);

            // Draw the exit (red square) at the goal position
            ctx.fillStyle = 'red';
            ctx.fillRect((mazeWidth - 1) * cellSize, (mazeHeight - 2) * cellSize, cellSize, cellSize);

            // Draw the sprite
            sprite.draw();

            // Restore the canvas state (undo rotation)
            ctx.restore();
        }

        // Main game loop that continuously updates the game state and redraws the screen
        function gameLoop() {
            if (!gameOver) {
                sprite.update(); // Update the sprite's position and check for collisions
                draw(); // Redraw the canvas
                requestAnimationFrame(gameLoop); // Repeat the loop on the next frame
            }
        }

        // Function to rotate the maze either left or right
        function rotateMaze(direction) {
            const angleStep = Math.PI / 2; // 90 degrees in radians
            currentRotation += direction === 'right' ? angleStep : -angleStep; // Rotate either clockwise or counterclockwise
        }

        // Function to display the victory screen when the player wins
        function showVictoryScreen() {
            victoryScreen.style.display = 'block'; // Show the victory screen div
        }

        // Add event listener for arrow key presses to rotate the maze
        window.addEventListener('keydown', (e) => {
            if (!gameOver) {
                if (e.key === 'ArrowRight') {
                    rotateMaze('right'); // Rotate maze clockwise
                } else if (e.key === 'ArrowLeft') {
                    rotateMaze('left'); // Rotate maze counterclockwise
                }
            }
        });

        // Generate the maze and start the game loop
        generateMaze();
        gameLoop();