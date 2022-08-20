import { assert } from "console";
import { Action, GameStatePayload, Player, Fence, Orientation, Coordinate, ClientMessage } from "../shared/types"

const EXPLORED = 999;
const EMPTY_FENCE = -1;
const EMPTY_CELL = 0;

declare global {
    interface Number {
          IsEven: () => boolean;
          IsOdd: () => boolean;
    }
}

Number.prototype.IsOdd = function() : boolean {
  return (this % 2) >= 1;
}

Number.prototype.IsEven = function() : boolean {
  return !this.IsOdd();
}

class Game
{
    logicalBoardSize = 9;
    actualBoardSize = this.logicalBoardSize * 2 - 1;
    logicalBoardLayers = 3;
    actualBoardLayers = this.logicalBoardLayers * 2 - 1;
    board: number[][][];
    players: Player[];
    currPlayer: Player | undefined;
    nextWallNumber = 100;
    fences: Fence[];

    constructor()
    {
        this.board = [];
        this.InitializeEmptyBoard();
        this.players = [];
        this.fences = [];
    }

    InitializeEmptyBoard()
    {
        for(let i = 0; i < this.actualBoardSize; ++i)
        {
            this.board.push([]);
            for (let j = 0; j < this.actualBoardSize; ++j)
            {
                this.board[i].push([]);
                for( let k = 0; k < this.actualBoardLayers; k++ )
                {
                    this.board[i][j].push(i % 2 || j % 2 || k % 2 ? EMPTY_FENCE : EMPTY_CELL);
                }
            }
        }
    }

    handleClientMessage(msg: ClientMessage, callback: (payload: GameStatePayload) => void)
    {
        if (msg.id === this.currPlayer.id)
        {
            this.processAction(msg.action);
            callback(this.getGameState());
        }
        this.drawBoard();
    }

    getGameState(): GameStatePayload
    {
        return {
                fences: this.fences,
                players: this.players,
                activePlayer: this.currPlayer.id
        }
    }

    getBoardSize()
    {
        return this.actualBoardSize;
    }

    getBoardLayers()
    {
        return this.actualBoardLayers;
    }

    processAction({coordinate, fence}: Action)
    {
        if (this.currPlayer)
        {
            if (coordinate)
            {
                if (this.isValidMove(coordinate))
                {
                    console.log('successful player move')
                    this.currPlayer.position = coordinate;
                    this.switchPlayer();
                }
            }
            else if (fence)
            {
                if (this.placeWall(fence.orientation, fence.coord))
                {
                    console.log('successful fence move')
                    this.switchPlayer();
                }
            }
        }
    }

    isValidMove(_coord: Coordinate)
    {
        return true;
    }

    numPlayers()
    {
        return this.players.length;
    }

    switchPlayer()
    {
        if (this.players.length >= 2)
        {
            if (this.currPlayer.id === 1)
            {
                this.currPlayer = this.players[1];
            }
            else if (this.currPlayer.id === 2)
            {
                this.currPlayer = this.players[0];
            }
        }

        return this.currPlayer.id;
    }

    addPlayer(player: Player)
    {
        this.players.push(player);

        this.board[player.position.row][player.position.col][player.position.layer] = this.numPlayers();

        if (this.currPlayer == undefined)
        {
            this.currPlayer = player;
        }
    }

    inBounds(rIdx: number, cIdx: number, layerIdx: number)
    {
        return rIdx >= 0 && rIdx < this.actualBoardSize
            && cIdx >= 0 && cIdx < this.actualBoardSize
            && layerIdx >= 0 && layerIdx < this.actualBoardLayers;
    }

    wallIntersects(orientation: Orientation, coordinate: Coordinate)
    {
        let intersects = false;
        if (orientation == Orientation.Flat)
        {
            [1, 2, 3].some( (offset: number) => {
                if ([1, 2, 3].some( (offsetPrime: number) => {
                    let row   = coordinate.row + offset;
                    let col   = coordinate.col + offsetPrime;
                    let layerAbove = coordinate.layer + 1;
                    let layerBelow = coordinate.layer - 1;

                    let layerAboveFail = !this.inBounds(row, col, layerAbove) || this.board[row][col][layerAbove] > EMPTY_CELL;
                    let layerBelowFail = !this.inBounds(row, col, layerBelow) || this.board[row][col][layerBelow] > EMPTY_CELL;
                    if (layerAboveFail && layerBelowFail)
                    {
                        console.log("failing 0n: ", row, " ", col, " ", coordinate.layer, " Offsets are: ", offset, " ", offsetPrime)
                        intersects = true;
                        return true;
                    }
                })) { return true; }
            });

        }
        else
        {
            [0, 1, 2].some( (offset: number) => {
                if ([0, 1, 2].some( (offsetPrime: number) => {
                    let row   = coordinate.row + (orientation == Orientation.Vertical ? offset : 0);
                    let col   = coordinate.col + (orientation == Orientation.Horizontal ? offset : 0);
                    let layer = coordinate.layer + offsetPrime;
                    if (this.board[row][col][layer] != EMPTY_FENCE)
                    {
                        console.log("failing on: ", row, " ", col, " ", layer, " Offsets are: ", offset, " ", offsetPrime)
                        intersects = true;
                        return true;
                    }
                })) { return true; }
            });

        }

        return intersects;
    }

    placeWall(orientation: Orientation, coord: Coordinate): boolean
    {
        let {col: col, row: row, layer: lay} = coord
        if (!this.inBounds(row, col, lay)
            || orientation == Orientation.Vertical   && (row.IsOdd() || col.IsEven() || lay.IsOdd())
            || orientation == Orientation.Horizontal && !(row % 2) && (col % 2) && (lay% 2)
            || orientation == Orientation.Flat       && !(lay% 2) && (row % 2) && (col % 2)
            || orientation == Orientation.Horizontal && (col > this.actualBoardSize - 3
                                                        || lay> this.actualBoardLayers - 3)
            || orientation == Orientation.Vertical   && (row > this.actualBoardSize - 3
                                                        || lay> this.actualBoardLayers - 3)
            || orientation == Orientation.Flat       && (col > this.actualBoardSize - 3
                                                         || row > this.actualBoardSize - 3)
            || this.wallIntersects(orientation, coord)
            || !this.pathExistsAfterWall(orientation, coord))
            return false;


        [0, 1, 2, 3].forEach( (offset: number) => {
            [0, 1, 2, 3].forEach( (offsetPrime) => {
                if (orientation == Orientation.Vertical)
                {
                        let row = coord.row + Math.min(2, offset);
                        let col = coord.col;
                        let layer = coord.layer + offsetPrime

                        if (this.inBounds(row, col, layer))
                        {
                            this.board[row][col][layer] = this.nextWallNumber
                        }
                }
                else if (orientation == Orientation.Horizontal)
                {
                        let row = coord.row;
                        let col = coord.col + Math.min(offset, 2);
                        let layer = coord.layer + offsetPrime

                        if (this.inBounds(row, col, layer))
                        {
                            this.board[row][col][layer] = this.nextWallNumber
                        }
                }
                else if (orientation == Orientation.Flat)
                {
                        let row = coord.row + Math.max(1, offset)
                        let col = coord.col + Math.max(1, offsetPrime)
                        let layer = coord.layer;

                        if (this.inBounds(row, col, layer))
                        {
                            this.board[row][col][layer] = this.nextWallNumber
                        }
                }
            });
        });

        this.fences.push({orientation: orientation, coord: coord});
        ++this.nextWallNumber;
        return true;
    }

    pathExistsAfterWall(orientation: Orientation, coordinate: Coordinate)
    {
        if (this.currPlayer == undefined){
            return false;
        }

        let allPathsExist = true;
        this.players.every( (player) => {
            let tmpBoard = new Array<Array<Array<number>>>(this.actualBoardSize);
            for (let i = 0; i < this.actualBoardSize; ++i)
            {
                tmpBoard[i] = new Array<Array<number>>(this.actualBoardSize);
                for (let j = 0; j < this.actualBoardSize; ++j)
                {
                    tmpBoard[i][j] = this.board[i][j].slice();
                }
            }

            [0, 1, 2, 3].forEach( (offset: number) => {
                let row     = coordinate.row + (orientation == Orientation.Vertical ? offset : 0);
                let col     = coordinate.col + (orientation == Orientation.Horizontal ? offset : 0);
                let layer   = coordinate.layer + (orientation == Orientation.Flat ? offset : 0);

                if (this.inBounds(row, col, layer))
                {
                    tmpBoard[row][col][layer] = this.nextWallNumber
                }
            });

            let stack = [ player.position ];
            tmpBoard[player.position.row][player.position.col][player.position.layer] = EXPLORED;

            while (stack.length)
            {
                let currPosition = stack.pop();
                if (currPosition)
                {
                    if (currPosition.row == player.goalY)
                    {
                        return true;
                    }

                    stack.push(...this.getAdjacentCells(currPosition, tmpBoard));
                }
            }

            allPathsExist = false;
            return false;
        });

        return allPathsExist;
    }

    getAdjacentCells(coordinate: Coordinate, board: number[][][])
    {
        let adjacentCells: Coordinate[] = [];

        let testDirection = ( rowModifier: number, colModifier: number, layerModifier: number) => {
            if (this.inBounds(coordinate.row + rowModifier, coordinate.col + colModifier, coordinate.layer + layerModifier )
                && board[coordinate.row + rowModifier][coordinate.col + colModifier][coordinate.layer + layerModifier] == -1
                && this.inBounds(coordinate.row + 2 * rowModifier, coordinate.col + 2 * colModifier, coordinate.layer + 2 * layerModifier)
                && board[coordinate.row + 2 * rowModifier][coordinate.col + 2 * colModifier][coordinate.layer + 2 * layerModifier] != EXPLORED)
                {

                    adjacentCells.push({row: coordinate.row + 2 * rowModifier, col: coordinate.col + 2 * colModifier, layer: coordinate.layer + 2 * layerModifier});
                    board[coordinate.row + 2 * rowModifier][coordinate.col + 2 * colModifier][coordinate.layer + 2 * layerModifier] = EXPLORED;
                }
        }

        testDirection(-1,  0,  0);
        testDirection( 1,  0,  0);
        testDirection( 0,  1,  0);
        testDirection( 0, -1,  0);
        testDirection( 0,  0,  1);
        testDirection( 0,  0, -1);

        return adjacentCells;
    }

    drawBoard()
    {
        for(let i = this.board.length - 1; i >= 0; --i)
        {
            for(let k = 0; k < this.board[i][0].length; ++k)
            {
                for(let j = 0; j < this.board[i].length; ++j)
                {
                    let cell = this.board[i][j][k];
                    if (!(i % 2) && !(j  % 2) && !(k % 2))
                    {
                        process.stdout.write( this.board[i][j][k].toString());
                    }
                    else if (cell != -1)
                    {
                        process.stdout.write( 'W' );
                    }
                    else
                    {
                        process.stdout.write(' ');
                    }

                }
                process.stdout.write('\t');
            }
            process.stdout.write('\n');
        }
        process.stdout.write('\n');
    }
}

export const game = new Game();

const testing = true;
if (testing)
{
    assert(game.numPlayers() == 0);
    game.addPlayer({
        id: 1,
        position: {row: 0,
                   col: Math.floor(game.getBoardSize() / 2),
                   layer: Math.floor(game.getBoardLayers() / 2)},
        numFences: 10,
        goalY: game.getBoardSize() - 1
    }   );
    game.addPlayer({
        id: 2,
        position: {row: game.getBoardSize() - 1,
                   col: Math.floor(game.getBoardSize() / 2),
                   layer: Math.floor(game.getBoardLayers() / 2)},
        numFences: 10,
        goalY: 0
    }  );
    assert(game.numPlayers() == 2);
    //assert(game.switchPlayer() == 1);

    TestOddEven();

    assert(game.placeWall(Orientation.Vertical,     {row: 8,  col: 1,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Vertical,     {row: 8,  col: 3,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Vertical,     {row: 8,  col: 5,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal,   {row: 11, col: 2,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Flat,         {row: 7,  col: 1,  layer: 3}) == true);
    assert(game.placeWall(Orientation.Horizontal,   {row: 7,  col: 2,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal,   {row: 9,  col: 2,  layer: 0}) == false);


    assert(game.placeWall(Orientation.Horizontal,   {row: 5,  col: 0,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal,   {row: 5,  col: 2,  layer: 0}) == false);
    assert(game.placeWall(Orientation.Vertical,     {row: 5,  col: 5,  layer: 0}) == false);
    assert(game.placeWall(Orientation.Vertical,     {row: 6,  col: 5,  layer: 0}) == false);
    assert(game.placeWall(Orientation.Vertical,     {row: 4,  col: 5,  layer: 0}) == true);

    assert(game.placeWall(Orientation.Flat,         {row: 7,  col: 5,  layer: 1}) == true);
    game.drawBoard();
    /*
    // in bounds and on proper row
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 14, layer: 0}) == true);
    //overlapping wall
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 14, layer: 0}) == false);

    //can't place horizontal wall on 0 row
    assert(game.placeWall(Orientation.Horizontal, {row: 0, col: 13, layer: 0}) == false);

    //block off bottom-left 2 squares
    assert(game.placeWall(Orientation.Vertical, {row: 0, col: 3, layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 0, layer: 0}) == true);

    //can't create overlapping walls
    assert(game.placeWall(Orientation.Vertical, {row: 0, col: 1, layer: 0}) == false);

    assert(game.pathExistsAfterWall(Orientation.Horizontal, {row: 1, col: 4, layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 4, layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 8, layer: 0}) == true);

    assert(game.placeWall(Orientation.Vertical, {row: 4, col: 13, layer: 2}) == true);

    assert(game.placeWall(Orientation.Flat, {row: 2, col: 4, layer: 1}) == true);
    game.drawBoard();
    */
}

function Test(title: string, res: boolean, expected: boolean )
{
    console.log(title, ": ", res === expected ? "PASSED" : "FAILED")
}

function TestOddEven()
{
    let x = 5;
    Test("Odd number is odd", x.IsOdd(), true);
    Test("Odd number is not even", x.IsEven(), false);
}