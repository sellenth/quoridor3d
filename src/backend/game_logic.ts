import { assert } from "console";

const EXPLORED = 999;
const EMPTY_FENCE = -1;
const EMPTY_CELL = 0;

type Coordinate = {
    row: number,
    col: number,
    layer: number
}

type Fence = {
    coord: Coordinate,
    orientation: Orientation
}

type Player = {
    name: string;
    goalY: number;
    numFences: number;
    position: Coordinate;
}

type Action = {
    coordinate: Coordinate;
    isFence: boolean;
}

enum Orientation {
    Horizontal = 1,
    Vertical = 2,
    Flat = 3
}

class Game
{
    #logicalBoardSize = 9;
    #actualBoardSize = this.#logicalBoardSize * 2 - 1;
    #logicalBoardLayers = 3;
    #actualBoardLayers = this.#logicalBoardLayers * 2 - 1;
    #board: number[][][];
    #players: Player[];
    #currPlayer: Player | undefined;
    #nextWallNumber = 100;
    fenceLocs: Fence[];

    constructor()
    {
        this.#board = [];
        for(let i = 0; i < this.#actualBoardSize; ++i)
        {
            this.#board.push([]);
            for (let j = 0; j < this.#actualBoardSize; ++j)
            {
                this.#board[i].push([]);
                for( let k = 0; k < this.#actualBoardLayers; k++ )
                {
                    this.#board[i][j].push(i % 2 || j % 2 || k % 2 ? EMPTY_FENCE : EMPTY_CELL);
                }
            }

        }
        this.#players = [];
        this.fenceLocs = [];
    }

    getBoardSize()
    {
        return this.#actualBoardSize;
    }

    getBoardLayers()
    {
        return this.#actualBoardLayers;
    }

    processAction(action: Action)
    {

    }

    numPlayers()
    {
        return this.#players.length;
    }

    addPlayer(player: Player)
    {
        this.#players.push(player);

        this.#board[player.position.row][player.position.col][player.position.layer] = this.numPlayers();

        if (this.#currPlayer == undefined)
        {
            this.#currPlayer = player;
        }
    }

    inBounds(rIdx: number, cIdx: number, layerIdx: number)
    {
        return rIdx >= 0 && rIdx < this.#actualBoardSize
            && cIdx >= 0 && cIdx < this.#actualBoardSize
            && layerIdx >= 0 && layerIdx < this.#actualBoardLayers;
    }

    // TODO ew
    findPairOrientation(cell: number, rIdx: number, cIdx: number, layerIdx: number)
    {
        if (this.inBounds(rIdx + 1, cIdx + 1, layerIdx) && this.#board[rIdx + 1][cIdx + 1][layerIdx] == cell)
            return Orientation.Flat;
        if (this.inBounds(rIdx - 1, cIdx - 1, layerIdx) && this.#board[rIdx - 1][cIdx - 1][layerIdx] == cell)
            return Orientation.Flat;
        if (this.inBounds(rIdx + 1, cIdx, layerIdx) && this.#board[rIdx + 1][cIdx][layerIdx] == cell)
            return Orientation.Vertical;
        if (this.inBounds(rIdx - 1, cIdx, layerIdx) && this.#board[rIdx - 1][cIdx][layerIdx] == cell)
            return Orientation.Vertical;
        if (this.inBounds(rIdx, cIdx + 1, layerIdx) && this.#board[rIdx][cIdx + 1][layerIdx] == cell)
            return Orientation.Horizontal;
        if (this.inBounds(rIdx, cIdx - 1, layerIdx) && this.#board[rIdx][cIdx - 1][layerIdx] == cell)
            return Orientation.Horizontal;

        if (this.inBounds(rIdx + 2, cIdx + 2, layerIdx) && this.#board[rIdx + 2][cIdx + 2][layerIdx] == cell)
            return Orientation.Flat;
        if (this.inBounds(rIdx - 2, cIdx - 2, layerIdx) && this.#board[rIdx - 2][cIdx - 2][layerIdx] == cell)
            return Orientation.Flat;
        if (this.inBounds(rIdx + 2, cIdx, layerIdx) && this.#board[rIdx + 2][cIdx][layerIdx] == cell)
            return Orientation.Vertical;
        if (this.inBounds(rIdx - 2, cIdx, layerIdx) && this.#board[rIdx - 2][cIdx][layerIdx] == cell)
            return Orientation.Vertical;
        if (this.inBounds(rIdx, cIdx + 2, layerIdx) && this.#board[rIdx][cIdx + 2][layerIdx] == cell)
            return Orientation.Horizontal;
        if (this.inBounds(rIdx, cIdx - 2, layerIdx) && this.#board[rIdx][cIdx - 2][layerIdx] == cell)
            return Orientation.Horizontal;
    }

    wallIntersects(orientation: Orientation, coordinate: Coordinate)
    {
        let intersects = false;
        [0, 1, 2].some( (offset: number) => {
            if ([0, 1, 2].some( (offsetPrime: number) => {
                let row   = coordinate.row + (orientation == Orientation.Vertical ? offset : 0) + (orientation == Orientation.Flat ? offsetPrime : 0);
                let col   = coordinate.col + (orientation == Orientation.Horizontal ? offset : 0) + (orientation == Orientation.Flat ? offsetPrime : 0);
                let layer = coordinate.layer + (orientation != Orientation.Flat ? offsetPrime : 0);
                if (this.#board[row][col][layer] != -1)
                {
                    //console.log(row, col, layer)
                    intersects = true;
                    return true;
                }
            })) { return true; }
        });

        return intersects;
    }

    placeWall(orientation: Orientation, coordinate: Coordinate): boolean
    {
        if (!this.inBounds(coordinate.row, coordinate.col, coordinate.layer)
            || orientation == Orientation.Vertical   && !(coordinate.col % 2) && (coordinate.row % 2) && (coordinate.layer % 2)
            || orientation == Orientation.Horizontal && !(coordinate.row % 2) && (coordinate.col % 2) && (coordinate.layer % 2)
            || orientation == Orientation.Flat       && !(coordinate.layer % 2) && (coordinate.row % 2) && (coordinate.col % 2)
            || orientation == Orientation.Horizontal && (coordinate.col > this.#actualBoardSize - 3
                                                        || coordinate.layer > this.#actualBoardLayers - 3)
            || orientation == Orientation.Vertical   && (coordinate.row > this.#actualBoardSize - 3
                                                        || coordinate.layer > this.#actualBoardLayers - 3)
            || orientation == Orientation.Flat       && (coordinate.col > this.#actualBoardSize - 3
                                                         || coordinate.row > this.#actualBoardSize - 3)
            || this.wallIntersects(orientation, coordinate)
            || !this.pathExistsAfterWall(orientation, coordinate))
            return false;

        [0, 1, 2, 3].forEach( (offset: number) => {
            if (orientation == Orientation.Vertical)
            {
                [0, 1, 2, 3].forEach( (offsetPrime) => {
                    let row = coordinate.row + offset;
                    let col = coordinate.col;
                    let layer = coordinate.layer + offsetPrime

                    if (this.inBounds(row, col, layer))
                    {
                        this.#board[row][col][layer] = this.#nextWallNumber
                    }

                } )
            }
            else if (orientation == Orientation.Horizontal)
            {
                [0, 1, 2, 3].forEach( (offsetPrime) => {
                    let row = coordinate.row;
                    let col = coordinate.col + offset
                    let layer = coordinate.layer + offsetPrime

                    if (this.inBounds(row, col, layer))
                    {
                        this.#board[row][col][layer] = this.#nextWallNumber
                    }

                } )
            }
            else if (orientation == Orientation.Flat)
            {
                [0, 1, 2, 3].forEach( (offsetPrime) => {
                    let row = coordinate.row + offset
                    let col = coordinate.col + offsetPrime
                    let layer = coordinate.layer;

                    if (this.inBounds(row, col, layer))
                    {
                        this.#board[row][col][layer] = this.#nextWallNumber
                    }

                } )
            }
        });

        this.fenceLocs.push({orientation: orientation, coord: coordinate});
        ++this.#nextWallNumber;
        return true;
    }

    pathExistsAfterWall(orientation: Orientation, coordinate: Coordinate)
    {
        if (this.#currPlayer == undefined){
            return false;
        }

        let allPathsExist = true;
        this.#players.every( (player) => {
            let tmpBoard = new Array<Array<Array<number>>>(this.#actualBoardSize);
            for (let i = 0; i < this.#actualBoardSize; ++i)
            {
                tmpBoard[i] = new Array<Array<number>>(this.#actualBoardSize);
                for (let j = 0; j < this.#actualBoardSize; ++j)
                {
                    tmpBoard[i][j] = this.#board[i][j].slice();
                }
            }

            [0, 1, 2, 3].forEach( (offset: number) => {
                let row     = coordinate.row + (orientation == Orientation.Vertical ? offset : 0);
                let col     = coordinate.col + (orientation == Orientation.Horizontal ? offset : 0);
                let layer   = coordinate.layer + (orientation == Orientation.Flat ? offset : 0);

                if (this.inBounds(row, col, layer))
                {
                    tmpBoard[row][col][layer] = this.#nextWallNumber
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
        for(let i = this.#board.length - 1; i >= 0; --i)
        {
            for(let k = 0; k < this.#board[i][0].length; ++k)
            {
                for(let j = 0; j < this.#board[i].length; ++j)
                {
                    let cell = this.#board[i][j][k];
                    if (!(i % 2) && !(j  % 2) && !(k % 2))
                    {
                        process.stdout.write( this.#board[i][j][k].toString());
                    }
                    else if (cell != -1)
                    {
                        let outputChar = '?';

                        switch (this.findPairOrientation(cell, i, j, k))
                        {
                            case Orientation.Horizontal: outputChar = '-'; break;
                            case Orientation.Vertical:   outputChar = '|'; break;
                            case Orientation.Flat:       outputChar = '█'; break;
                        }

                        process.stdout.write(outputChar);
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
        name: "Bob",
        position: {row: 0,
                   col: Math.floor(game.getBoardSize() / 2),
                   layer: Math.floor(game.getBoardLayers() / 2)},
        numFences: 10,
        goalY: game.getBoardSize() - 1
    }   );
    game.addPlayer({
        name: "Ann",
        position: {row: game.getBoardSize() - 1,
                   col: Math.floor(game.getBoardSize() / 2),
                   layer: Math.floor(game.getBoardLayers() / 2)},
        numFences: 10,
        goalY: 0
    }  );
    assert(game.numPlayers() == 2);



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
}
