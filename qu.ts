import { assert } from "console";

const EXPLORED = 999;

type Coordinate = {
    row: number,
    col: number
}

type Player = {
    name: string;
    goalY: number;
    numFences: number;
    position: Coordinate;
}

type Move = {
    coordinate: Coordinate;
    isFence: boolean;
}

enum Orientation {
    Horizontal = 1,
    Vertical = 2
}

class Game
{
    #logicalBoardSize = 9;
    #actualBoardSize = this.#logicalBoardSize * 2 - 1;
    #board: number[][];
    #players: Player[];
    #currPlayer: Player | undefined;
    #nextWallNumber = 100;

    constructor()
    {
        this.#board = [];
        for(let i = 0; i < this.#actualBoardSize; ++i)
        {
            this.#board.push(new Array<number>(this.#actualBoardSize).fill(0));
            for (let j = 0; j < this.#actualBoardSize; ++j)
                this.#board[i][j] = i % 2 || j % 2 ? -1 : 0;
        }

        this.#players = [];
    }

    getBoardSize()
    {
        return this.#actualBoardSize;
    }

    processMove(move: Move)
    {

    }

    numPlayers()
    {
        return this.#players.length;
    }

    addPlayer(player: Player)
    {
        this.#players.push(player);

        this.#board[player.position.row][player.position.col] = this.numPlayers();

        if (this.#currPlayer == undefined)
        {
            this.#currPlayer = player;
        }
    }

    inBounds(rIdx: number, cIdx: number)
    {
        return rIdx >= 0 && rIdx < this.#actualBoardSize
            && cIdx >= 0 && cIdx <this.#actualBoardSize;
    }

    findPairOrientation(cell: number, rIdx: number, cIdx: number)
    {
        if (this.inBounds(rIdx + 1, cIdx) && this.#board[rIdx + 1][cIdx] == cell)
            return Orientation.Vertical;
        if (this.inBounds(rIdx - 1, cIdx) && this.#board[rIdx - 1][cIdx] == cell)
            return Orientation.Vertical;
        if (this.inBounds(rIdx, cIdx + 1) && this.#board[rIdx][cIdx + 1] == cell)
            return Orientation.Horizontal;
        if (this.inBounds(rIdx, cIdx - 1) && this.#board[rIdx][cIdx - 1] == cell)
            return Orientation.Horizontal;
    }

    wallIntersects(orientation: Orientation, coordinate: Coordinate)
    {
        let intersects = false;
        [0, 1, 2].some( (offset: number) => {
            let row = coordinate.row + (orientation == Orientation.Vertical ? offset : 0);
            let col = coordinate.col + (orientation == Orientation.Horizontal ? offset : 0);
            if (this.#board[row][col] != -1)
            {
                intersects = true;
                return true;
            }
        });

        return intersects;
    }

    placeWall(orientation: Orientation, coordinate: Coordinate)
    {
        if (!this.inBounds(coordinate.row, coordinate. col) 
            || orientation == Orientation.Vertical   && !(coordinate.col % 2) && (coordinate.row % 2)
            || orientation == Orientation.Horizontal && !(coordinate.row % 2) && (coordinate.col % 2)
            || orientation == Orientation.Horizontal && coordinate.col > this.#actualBoardSize - 3 
            || orientation == Orientation.Vertical   && coordinate.row > this.#actualBoardSize - 3 
            || this.wallIntersects(orientation, coordinate)
            || !this.pathExistsAfterWall(orientation, coordinate))
            return false;

        [0, 1, 2, 3].forEach( (offset: number) => {
            let row = coordinate.row + (orientation == Orientation.Vertical ? offset : 0);
            let col = coordinate.col + (orientation == Orientation.Horizontal ? offset : 0);
            if (this.inBounds(row, col))
            {
                this.#board[row][col] = this.#nextWallNumber
            }
        });

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
            let tmpBoard = new Array<Array<number>>(this.#actualBoardSize);
            for (let i = 0; i < this.#actualBoardSize; ++i)
            {
                tmpBoard[i] = this.#board[i].slice();
            }

            [0, 1, 2, 3].forEach( (offset: number) => {
                let row = coordinate.row + (orientation == Orientation.Vertical ? offset : 0);
                let col = coordinate.col + (orientation == Orientation.Horizontal ? offset : 0);
                tmpBoard[row][col] = this.#nextWallNumber
            });

            let stack = [ player.position ];
            tmpBoard[player.position.row][player.position.col] = EXPLORED; 

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

    getAdjacentCells(coordinate: Coordinate, board: number[][])
    {
        let adjacentCells: Coordinate[] = [];

        let testDirection = ( rowModifier: number, colModifier: number) => {
            if (this.inBounds(coordinate.row + rowModifier, coordinate.col + colModifier ) 
                && board[coordinate.row + rowModifier][coordinate.col + colModifier] == -1
                && this.inBounds(coordinate.row + 2 * rowModifier, coordinate.col + 2 * colModifier)
                && board[coordinate.row + 2 * rowModifier][coordinate.col + 2 * colModifier] != EXPLORED)
                {
                adjacentCells.push({row: coordinate.row + 2 * rowModifier, col: coordinate.col + 2 * colModifier});
                board[coordinate.row + 2 * rowModifier][coordinate.col + 2 * colModifier] = EXPLORED; 
                }
        }

        testDirection(-1,  0);
        testDirection( 1,  0);
        testDirection( 0,  1);
        testDirection( 0, -1);

        return adjacentCells;
    }

    drawBoard()
    {
        for (let rIdx = this.#board.length - 1; rIdx >= 0; --rIdx)
        {
            let row = this.#board[rIdx];
            row.forEach( (cell, cIdx) => {
                if (!(rIdx % 2) && !(cIdx  % 2))
                {
                    process.stdout.write( cell.toString());
                }
                else if (cell != -1)
                {
                    process.stdout.write(
                        this.findPairOrientation(cell, rIdx, cIdx) 
                            == Orientation.Horizontal ? '-' : '|'
                    );
                }
                else
                {
                    process.stdout.write(' ');
                }
            });
            process.stdout.write('\n');
        }
        process.stdout.write('\n');
    }
}

const testing = true;
if (testing)
{
    const game = new Game();
    assert(game.numPlayers() == 0);
    game.addPlayer({
        name: "Bob",
        position: {row: 0, col: Math.floor(game.getBoardSize() / 2)},
        numFences: 10,
        goalY: game.getBoardSize() - 1
    }   );
    game.addPlayer({
        name: "Ann",
        position: {row: game.getBoardSize() - 1, col: Math.floor(game.getBoardSize() / 2)},
        numFences: 10,
        goalY: 0
    }  );
    assert(game.numPlayers() == 2);


    //in bounds and on proper row
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 14}) == true);
    //overlapping wall
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 14}) == false);

    //can't place horizontal wall on 0 row
    assert(game.placeWall(Orientation.Horizontal, {row: 0, col: 13}) == false);

    //block off bottom-left 2 squares
    assert(game.placeWall(Orientation.Vertical, {row: 0, col: 3}) == true);
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 0}) == true);

    //can't create overlapping walls
    assert(game.placeWall(Orientation.Vertical, {row: 0, col: 1}) == false);

    assert(game.pathExistsAfterWall(Orientation.Horizontal, {row: 1, col: 4}) == true);
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 4}) == true);
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 8}) == true);

    assert(game.placeWall(Orientation.Vertical, {row: 0, col: 13}) == true);
    game.drawBoard();
}
