---
title: Finding Four-in-a-Row for the Win
author: Ross Kaffenberger
published: true
summary: A win algorithm for Vue.js Connect Four
description: In this post for the Building Connect Four in Vue.js and Phoenix series, we'll implement an algorithm for detecting four-in-a-row with JavaScript and display the results to our Vue.js components.
pull_image: 'blog/purple-circles.jpg'
pull_image_caption: Background Photo by Peter Clarkson on Unsplash
series: 'Connect Four'
category: Code
tags:
  - Vue
  - JavaScript
---

With the Connect Four game we created in the previous post, we're able to use [Vue transitions](https://vuejs.org/v2/guide/transitions.html) to animate checkers dropping into place on the game board. Though we're able to add checkers, we still weren't declaring the winner when four-in-a-row had been achieved—kind of the whole point of the game. We'll tackle that in this post.

Before we dive in, here's a pen of the game with the win logic we'll be describing so you'll see where we'll end up:

<p data-height="529" data-theme-id="light" data-slug-hash="VydJKG" data-default-tab="js,result" data-user="rossta" data-embed-version="2" data-pen-title="Connect Four in Vue.js, SVG: detect winner and animated checkers" class="codepen">See the Pen <a href="https://codepen.io/rossta/pen/VydJKG/">Connect Four in Vue.js, SVG: detect winner and animated checkers</a> by Ross Kaffenberger (<a href="https://codepen.io/rossta">@rossta</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

When a player achieves four-in-a-row, we update the visual elements on the board to indicate the win and provide a "Play again" link to reset the game state.

## Imagining the algorithm

We want the game logic to evaluate the state of the board after each checker is played and before allowing the next player to drop their checker. If four-in-a-row is found, we'll want to highlight the winning segment of checkers and declare the winner in the UI. We'll also want to declare a draw if the board is full and no one has won.

The basic skeleton of the win algorithm will work as follow:

```bash
check all viable horizonal segments FOR THE WIN. Return the winner OR
check all viable vertical segments FTW. Return the winner OR
check all viable "forward slash" segments FTW. Return the winner OR
check all viable "back slash" segments FTW. Return the winner OR
```

We use the word *viable* to mean that the segment must contain four "slots" that exist on the game board. In other words, since the game board has seven columns, indexed as 0-6, each row contains only four horizonal segments: 0-3, 1-4, 2-5, 3-6.

As described, it's a bit wasteful to check every possible segment in the board. This is especially true at the outset, when few checkers are on the board, or near the end when many segments have already been checked on previous turns. Since we're checking the board on each drop and we know the position of the last checker played, we can reduce the number of computations by treating the last checker as a focal point. So we update our definition of a *viable* segment to mean segments of four on the board that intersect with the last checker played.

To figure out which segments over lap with the last checker played, we need a few values:

* the coordinates of the checker, the "focal point" of our collection of segments
* the minimum viable row value, i.e., the greater of first row value (0) and the value of the farthest numerical segment point to the left (`focalRow` - 3)
* the minimum viable column value, i.e., the greater of first col value (0) and the value of the farthest numerical segment ponit from the bottom (`focalCol` - 3)
* the maximum viable row value, i.e., the lesser of (`focalRow` + 3) and the top row (5)
* the maximum viable column value, i.e., the lesser of (`focalCol` + 3) and the last column (6)

Given an object `lastChecker` of the form `{ row, col }`, and the properites `rowCount` and `colCount` representing the total number of rows and columns respectively, we can determine these values as follows in JavaScript:

```javascript
const min = num => Math.max(num - 3, 0);
const max = (num, max) => Math.min(num + 3, max);

const { row: focalRow, col: focalCol } = lastChecker;
const minCol = min(focalCol);
const maxCol = max(focalCol, this.colCount-1);
const minRow = min(focalRow);
const maxRow = max(focalRow, this.rowCount-1);
```

The min and max row and column values form the boundaries of the search space, which may be much smaller than the total number of segments on the board, especially when the last checker played is near the edges.

## Checking the horizonal segment

Using these values, we can select only the segments in the horizontal, vertical, and diagonal intersections with our last played checker. Let's say the last checker ended up in row 3 and column 2. There are only three horizonal segments we need to check from this position. Here's a visual:

![](blog/connect-four/check-horizontal.png)

In the context of our `GameContainer` component, here's one way of iterating through those segments and searching for a winner:

```javascript
// GameContainer method
checkHorizontalSegments({ focalRow, minCol, maxCol }) {
  for (let row = focalRow, col = minCol; col <= maxCol; col++) {

    // the horizonal segment contains four neighboring coordinates across
    const segment = [[row, col], [row, col+1], [row, col+2], [row, col+3]];

    // this.getChecker returns the checker object { row, col, color } for a given position
    const checkers = segment.map(([row, col]) => this.getChecker({row, col}));

    // If all colors are valid and match
    if (checkers.reduce((a, b) => a === b && a !== EMPTY)) {
      return { color: checkers[0].color, checkers };
    }
  }
},
```

If a win is detected, we'll record the color and checker positions of the winning segment, which we can later use as data to show the winning state on the game board. Similar functions for checking the vertical and diagonal segments are left as an exercise for the reader... or you may inspect the [source of the CodePen demo](https://codepen.io/rossta/pen/VydJKG).

## Updating the Vue

Putting this altogether, our win algorithm in JavaScript could be as follows:

```javascript
// GameContainer method
checkForWin(lastChecker) {
  if (!lastChecker) return;

  const min = num => Math.max(num - 3, 0);
  const max = (num, max) => Math.min(num + 3, max);

  const { row: focalRow, col: focalCol } = lastChecker;
  const minCol = min(focalCol);
  const maxCol = max(focalCol, this.colCount-1);
  const minRow = min(focalRow);
  const maxRow = max(focalRow, this.rowCount-1);
  const coords = { focalRow, focalCol, minRow, minCol, maxRow, maxCol };

  return this.checkHorizontalSegments(coords) ||
    this.checkVerticalSegments(coords) ||
    this.checkForwardSlashSegments(coords) ||
    this.checkBackwardSlashSegments(coords);
},
```

Recall from the [previous post](/blog/animating-connect-four-with-vuejs.html), once a checker is dropped, we emit two custom events, one to create the checker component, `'drop'` and a second, `'land'`, to indicate the falling checker animation has completed. We're bubbling these events up to the `GameContainer` where we can then check for the win. For the checker drop, we lock the game from additional moves while this processing is carried out and we obtain a reference to the last checker and pass to our `checkForWin` method:

```javascript
// GameContainer method
drop({ col, row }) {
  if (this.isLocked) return;

  this.isLocked = true;

  const checker = { row, col, color };
  this.checkForWin(checker);

  // update the board
  // switch turns
},
```
When the animation completes, the `land` callback is triggered on the `GameContainer`. Here, we check for the win. If the winner was set by the `checkForWin` method, we'll display the win or unlock the game so the next player can play their turn.
```javascript
// GameContainer method
land() {
  if (this.winner) {
    this.displayWin(winner);
  } else {
    this.isLocked = false;
  }
},
```
Display win simply sets the game status and sets a flag on each of checkers in the winner segment.
```javascript
// GameContainer method
displayWin(winner) {
  this.status = 'OVER';
  this.winner.checkers.forEach((checker) => {
    this.setChecker(checker, {isWinner: true});
  });
},
```
Our components can react to this new state by updating various elements of the UI. One approach we've taken is to adjust the opacity of the non-winning checkers to accentuate the winners:
```javascript
// BoardChecker computed
opacity() {
  return (this.status === OVER && !this.isWinner) ? 0.25 : 1.0;
},
```

## Checking for a draw

There's one case we haven't yet accounted for—what if no one wins?

It's possible for a game to reach a state where all the cells are filled with checkers, but neither player has acheived four-in-a-row. To account for this case, we'll want to check a draw before checking for the win on each turn. A draw occurs when the number of checkers played equals the number of cells:

```javascript
// GameContainer method
checkForDraw() {
  this.isDraw = Object.keys(this.checkers).length === this.rowCount * this.colCount;
},
```
We'll update the `land` method to short-circuit on a draw:
```javascript
// GameContainer method
land() {
  if (this.isDraw) return this.displayDraw();

  if (this.winner) {
    this.displayWin(winner);
  } else {
    this.isLocked = false;
  }
},
```
Highlighting the simplicity of our Vue-based reactive system, displaying the draw means simply setting the game state to `'OVER'`;
```javascript
displayDraw() {
  this.status = OVER;
},
```
## Resetting the game

We can use the game status to display a message to the players and provide a "Play again" link:
```html
<p v-if="status === 'OVER'">
  {{ gameOverMessage }}
  <a href="#" @click="reset">Play again</a>
</p>
```
The `gameOverMessage` is simply a computed property that switches on the winner state:
```javascript
// GameContainer computed
gameOverMessage() {
  if (this.winner) {
    return `${titleize(this.winner.color)} wins!`;
  } else {
    return `It's a draw!`;
  }
},
```
For the "Play again" link, we just add a function to reset the game state:
```javascript
// GameContainer method
reset() {
  this.winner = undefined;
  this.isLocked = false;
  this.status = PLAY;
  this.checkers = {};
},
```
## Summing up

We've come a long way—we developed a basic algorithm to search the game board for a winner while ensuring we only traverse relevant segments. We also leveraged the simplicity of reactive Vue properties to trigger UI updates. We now have a decent version of Connect Four playable in the browser by individual(s) using the same browser. We've also lumped a ton of logic into the game container and have no mechanism to play opponents ver the network. There's some exciting work to do ahead: we'll work on introducing additional layers to our frontend design by building on Vue libraries like `vue-router` for client-side routing and `vuex` for state managment. This will set us up to make the game playable over the network by connecting our game to an Elixir/Phoenix backend.
