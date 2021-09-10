const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

/**
 * GLOBAL CONSTANTS
 */
const CELLS_COUNT_HORIZONTAL = 25;
const CELLS_COUNT_VERTICAL = 15;
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const UNIT_LENGTH_X = WIDTH / CELLS_COUNT_HORIZONTAL;
const UNIT_LENGTH_Y = HEIGHT / CELLS_COUNT_VERTICAL;
const WALL_WIDTH = 5;

/**
 * Matter.js initialization
 */
// Create an engine
const engine = Engine.create();

// disable gravity
engine.world.gravity.y = 0;

const { world } = engine;

// create an renderer
const render = Render.create({
	// Render world inside of document.body
	element: document.body,
	engine: engine,
	options: {
		// Size of the canvas
		wireframes: false,
		width: WIDTH,
		height: HEIGHT,
		background: "#41b883",
	},
});

// Run the renderer

Render.run(render);

// Run the engine
Runner.run(Runner.create(), engine);

// Border of the world
const borderOptionsObj = {
	isStatic: true,
	render: {
		fillStyle: "41b883",
	},
};
const border = [
	Bodies.rectangle(WIDTH / 2, 0, WIDTH, WALL_WIDTH, borderOptionsObj),
	Bodies.rectangle(WIDTH / 2, HEIGHT, WIDTH, WALL_WIDTH, borderOptionsObj),
	Bodies.rectangle(0, HEIGHT / 2, WALL_WIDTH, HEIGHT, borderOptionsObj),
	Bodies.rectangle(WIDTH, HEIGHT / 2, WALL_WIDTH, HEIGHT, borderOptionsObj),
];

// Add border into world object
World.add(world, border);

/**
 * Maze arrays
 * Grid of cells: Default to false, flip to true if the cell has been visited.
 * Vertical and horizontal walls: Default to false (means that is a wall),
 * 	flip to true to remove the wall.
 * */
// Grid of cells
// grid[row][col], so grid[CELLS_COUNT_VERTICAL][CELLS_COUNT_HORIZONTAL]
const grid = Array(CELLS_COUNT_VERTICAL)
	.fill(null)
	.map(() => Array(CELLS_COUNT_HORIZONTAL).fill(false));

// Vertical walls
const verticals = Array(CELLS_COUNT_VERTICAL)
	.fill(null)
	.map(() => Array(CELLS_COUNT_HORIZONTAL - 1).fill(false));

// Horizontal walls
const horizontals = Array(CELLS_COUNT_VERTICAL - 1)
	.fill(null)
	.map(() => Array(CELLS_COUNT_HORIZONTAL).fill(false));

// pick a starting cell randomly
const startRow = Math.floor(Math.random() * CELLS_COUNT_VERTICAL);
const startCol = Math.floor(Math.random() * CELLS_COUNT_HORIZONTAL);

/**
 * @function shuffle
 * Helper function to shuffle neighbor list
 */
function shuffle(arr) {
	let counter = arr.length - 1;

	for (; counter > 0; counter--) {
		const index = Math.floor(Math.random() * counter);
		// Swapping
		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}

	return arr;
}

/**
 * @function cellTraversal
 * The actual maze generation algorithm.
 * */
(function cellTraversal(row, col) {
	// If I have visited the cell at [row, column], return
	if (grid[row][col]) {
		return;
	}

	// Mark this cell as being visited
	grid[row][col] = true;

	// Assemble randomly-ordered list of neighbors
	const neighborList = shuffle([
		[row - 1, col, "up"],
		[row + 1, col, "down"],
		[row, col - 1, "left"],
		[row, col + 1, "right"],
	]);

	// For each neighbor......
	for (let neighbor of neighborList) {
		const [nextRow, nextCol, direction] = neighbor;

		// See if that neighbor is out of bounds, continue and iterate to next neighbor
		if (
			nextRow < 0 ||
			nextRow >= CELLS_COUNT_VERTICAL ||
			nextCol < 0 ||
			nextCol >= CELLS_COUNT_HORIZONTAL
		) {
			continue;
		}
		// If we have visited that neighbor, continue and iterate to iterate next neighbor
		if (grid[nextRow][nextCol]) {
			continue;
		}

		// Remove a wall from either horizontals or verticals
		if (direction === "left") {
			verticals[row][col - 1] = true;
		} else if (direction === "right") {
			verticals[row][col] = true;
		} else if (direction === "up") {
			horizontals[row - 1][col] = true;
		} else if (direction === "down") {
			horizontals[row][col] = true;
		}

		// Visit that next cell
		cellTraversal(nextRow, nextCol);
	}
})(startRow, startCol);

/**
 * Render both horizontal and vertical walls
 */
horizontals.forEach((row, rowIndex) => {
	row.forEach((open, colIndex) => {
		// if there is no wall (open to cross), return
		if (open) {
			return;
		}

		const horizontalWall = Bodies.rectangle(
			// x
			colIndex * UNIT_LENGTH_X + UNIT_LENGTH_X / 2,
			// y
			rowIndex * UNIT_LENGTH_Y + UNIT_LENGTH_Y,
			// width of wall
			UNIT_LENGTH_X,
			// height of wall
			WALL_WIDTH,
			{
				label: "wall",
				isStatic: true,
				render: {
					fillStyle: "#dbdbd2",
				},
			}
		);

		// Add walls into world object
		World.add(world, horizontalWall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, colIndex) => {
		if (open) {
			return;
		}

		const verticalWall = Bodies.rectangle(
			colIndex * UNIT_LENGTH_X + UNIT_LENGTH_X,
			rowIndex * UNIT_LENGTH_Y + UNIT_LENGTH_Y / 2,
			WALL_WIDTH,
			UNIT_LENGTH_Y,
			{
				label: "wall",
				isStatic: true,
				render: {
					fillStyle: "#dbdbd2",
				},
			}
		);

		World.add(world, verticalWall);
	});
});

// Goal object
const goalObj = Bodies.rectangle(
	WIDTH - UNIT_LENGTH_X / 2,
	HEIGHT - UNIT_LENGTH_X / 2,
	UNIT_LENGTH_X * 0.6,
	UNIT_LENGTH_X * 0.6,
	{
		label: "goalObj",
		render: {
			fillStyle: "#ff6a80",
		},
	}
	// { isStatic: true }
);
// Add goal object into world object
World.add(world, goalObj);

// Player controllable object
const ballRadius = Math.min(UNIT_LENGTH_X, UNIT_LENGTH_Y) * 0.3;
const playerObj = Bodies.circle(
	UNIT_LENGTH_X / 2,
	UNIT_LENGTH_Y / 2,
	ballRadius,
	{
		label: "playerObj",
		render: {
			fillStyle: "#edec60",
		},
	}
);
// Add player object into world object
World.add(world, playerObj);

// Listen to keydown event on document
document.addEventListener("keydown", e => {
	const { x, y } = playerObj.velocity;

	// determine direction to move by keypress
	if (e.key === "w") {
		Body.setVelocity(playerObj, { x, y: -5 });
	}
	if (e.key === "a") {
		Body.setVelocity(playerObj, { x: -5, y });
	}
	if (e.key === "s") {
		Body.setVelocity(playerObj, { x, y: 5 });
	}
	if (e.key === "d") {
		Body.setVelocity(playerObj, { x: 5, y });
	}
});

// Object labels array
const labels = ["goalObj", "playerObj"];

// Win condition
Events.on(engine, "collisionStart", e => {
	e.pairs.forEach(collision => {
		if (
			labels.includes(collision.bodyA.label) &&
			labels.includes(collision.bodyB.label)
		) {
			// Enable gravity on world object
			world.gravity.y = 1;
			world.bodies.forEach(body => {
				// Disable static on walls
				if (body.label === "wall") {
					Body.setStatic(body, false);
				}
				// Display the win message
				document.querySelector(".winner").classList.remove("hidden");
			});
		}
	});
});
