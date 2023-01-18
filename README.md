# Getting started locally:
```
git clone git@github.com:sellenth/quoridor3d.git
cd quoridor3d
npm install
npm start
```

The game will be available on port 8008

1. To build just the frontend changes: `npm run build-front`
1. To run the backend: `npm run run-back`

## Gameplay
![gif of gameplay](https://s9.gifyu.com/images/visual.gif)

The rules for the original Quoridor game can be found [here](https://www.ultraboardgames.com/quoridor/game-rules.php). Essentially you are in control of a pawn and you want to reach the other side of the board from where you start. Your opponent is trying to do the same and you are both given walls to slow down each other's progress. The key word here is slow down—one path must always exist for each player to reach their respective goal. 

Here is Quoridor3d, things are much the same but now in addition to the board's rows and columns, there are layers. More dimensions, more walls, more fun.

## Controls
* Standard **WASD** + **mouse** controls to move around the play space
* When it's your turn you can press **C** to change cursor type
* The cursor types are for pawn movement or wall placement
* **E** and **Q** move the cursor up and down layers of the play space
* When you're placing a wall, press **R** to change its orientation
* Use **Arrow Keys** to move cursor. Note that directions are independent of camera's view direction

## Play
The game is hosted here [https://quor3dor.herokuapp.com/](https://quor3dor.herokuapp.com/). If it has not been accessed recently, there may be a 30 second dyno spinup time.

### TODOs
- [x] disallow moves through walls
- [x] when client disconnects, remove them from server's client list
- [x] make walls number information dynamic
- [x] win condition
- [x] have hosted build working
- [x] bound cursor to board limits
- [x] add camera model
- [x] network camera models
- [x] add Jake's music
- [x] restyle players
- [x] q e for y axis up and down 
- [x] different color for wall cursor
- [ ] add hopping mechanic
- [ ] give each GL program a separate file
- [ ] start camera behind player position
- [ ] fix start position of added players
- [ ] unify naming of walls/fences
- [ ] unify style of function casing
- [ ] lint this thing
- [ ] factor out board operations into new class
- [ ] allow spectators
- [ ] better indicator for when it's your turn
- [ ] make cursor movement relative to camera's front
- [ ] pick character color
