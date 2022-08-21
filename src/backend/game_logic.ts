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
    fenceListForClients: Fence[];

    constructor()
    {
        this.board = [];
        this.InitializeEmptyBoard();
        this.players = [];
        this.fenceListForClients = [];
        console.log("Game has been successfully initialized...");
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
        if (this.currPlayer && this.currPlayer.id == msg.id)
        {
            this.processAction(msg.action);
            callback(this.getGameState());
        }
        this.drawBoard();
    }

    getGameState(): GameStatePayload
    {
        return {
                fences: this.fenceListForClients,
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
        assert (!!this.currPlayer);
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
            if (this.currPlayer.id == 0)
            {
                this.currPlayer = this.players[1];
            }
            else if (this.currPlayer.id == 1)
            {
                this.currPlayer = this.players[0];
            }
        }

        return this.currPlayer.id;
    }

    CreatePlayer(id: number)
    {
        if (this.players.length == 0)
        {
            game.addPlayer({
                id: id,
                position: {row: 0,
                        col: Math.floor(game.getBoardSize() / 2),
                        layer: Math.floor(game.getBoardLayers() / 2)},
                numFences: 10,
                goalY: game.getBoardSize() - 1
            }   );
        }
        else if (this.players.length == 1)
        {
            game.addPlayer({
                id: id,
                position: {row: game.getBoardSize() - 1,
                        col: Math.floor(game.getBoardSize() / 2),
                        layer: Math.floor(game.getBoardLayers() / 2)},
                numFences: 10,
                goalY: 0
            }  );
        }
    }

    RemovePlayer(id: number | undefined )
    {
        if (id != undefined)
        {
            this.players.splice(id, 1);
        }
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

    placeWall(orientation: Orientation, coord: Coordinate): boolean
    {
        if (this.InvalidWallPosition(orientation, coord)) return false;

        this.UpdateBoardWithNewWall(orientation, coord);

        this.fenceListForClients.push({orientation: orientation, coord: coord});
        ++this.nextWallNumber;
        return true;
    }

    InvalidWallPosition(orientation: Orientation, coord: Coordinate)
    {
        let {row: row, col: col, layer: lay} = coord

        return !this.inBounds(row, col, lay)
            || orientation == Orientation.Vertical   && !this.ValidOriginForVerticalWall(coord)
            || orientation == Orientation.Horizontal && !this.ValidOriginForHorizontalWall(coord)
            || orientation == Orientation.Flat       && !this.ValidOriginForFlatWall(coord)
            || this.wallIntersects(orientation, coord)
            || !this.pathExistsAfterWall(orientation, coord);
    }

    UpdateBoardWithNewWall(orientation: Orientation, coord: Coordinate)
    {
        [0, 1, 2].forEach( (offset: number) => {
            [0, 1, 2].forEach( (offsetPrime) => {
                let row = coord.row;
                let col = coord.col;
                let layer = coord.layer;
                switch (orientation)
                {
                    case Orientation.Vertical:
                        row += offset;
                        layer += offsetPrime;
                        break;
                    case Orientation.Horizontal:
                        col += offset;
                        layer += offsetPrime;
                        break;
                    case Orientation.Flat:
                        row += offset;
                        col += offsetPrime;
                        break;

                }
                if (this.inBounds(row, col, layer))
                {
                    this.board[row][col][layer] = this.nextWallNumber
                }
            });
        });
    }

    inBounds(rIdx: number, cIdx: number, layerIdx: number)
    {
        return rIdx >= 0 && rIdx < this.actualBoardSize
            && cIdx >= 0 && cIdx < this.actualBoardSize
            && layerIdx >= 0 && layerIdx < this.actualBoardLayers;
    }


    ValidOriginForVerticalWall(coord: Coordinate)
    {
        return coord.row.IsEven() 
            && coord.col.IsOdd() 
            && coord.layer.IsEven() 
            && coord.row <= this.actualBoardSize - 3
            && coord.layer <= this.actualBoardLayers - 3;
    }

    ValidOriginForHorizontalWall(coord: Coordinate)
    {
        return coord.row.IsOdd()
            && coord.col.IsEven()
            && coord.layer.IsEven()
            && coord.col <= this.actualBoardSize - 3
            && coord.layer <= this.actualBoardLayers - 3;
    }

    ValidOriginForFlatWall(coord: Coordinate)
    {
        return coord.layer.IsOdd()
            && coord.row.IsEven()
            && coord.col.IsEven()
            && coord.col <= this.actualBoardSize - 3
            && coord.row <= this.actualBoardSize - 3;
    }


    wallIntersects(orientation: Orientation, coordinate: Coordinate)
    {
        let intersects = false;
        if (orientation == Orientation.Flat)
        {
            [0, 1, 2].some( (offset: number) => {
                if ([0, 1, 2].some( (offsetPrime: number) => {
                    let row   = coordinate.row + offset;
                    let col   = coordinate.col + offsetPrime;
                    let layerAbove = coordinate.layer + 1;
                    let layerBelow = coordinate.layer - 1;

                    let layerCurrFail  = this.board[row][col][coordinate.layer] != EMPTY_FENCE;
                    let layerAboveFail = !this.inBounds(row, col, layerAbove) || this.board[row][col][layerAbove] > EMPTY_CELL;
                    let layerBelowFail = !this.inBounds(row, col, layerBelow) || this.board[row][col][layerBelow] > EMPTY_CELL;
                    if (layerCurrFail || layerAboveFail && layerBelowFail)
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

const testing = false;
if (testing)
{
    TestAddingPlayers();
    TestOddEven();

    assert(game.placeWall(Orientation.Vertical,     {row: 8,  col: 1,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Vertical,     {row: 8,  col: 3,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Vertical,     {row: 8,  col: 5,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Flat,         {row: 8,  col: 2,  layer: 3}) == true);
    assert(game.placeWall(Orientation.Horizontal,   {row: 11, col: 2,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal,   {row: 7,  col: 2,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal,   {row: 9,  col: 2,  layer: 0}) == false);


    assert(game.placeWall(Orientation.Horizontal,   {row: 5,  col: 0,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal,   {row: 5,  col: 2,  layer: 0}) == false);
    assert(game.placeWall(Orientation.Vertical,     {row: 5,  col: 5,  layer: 0}) == false);
    assert(game.placeWall(Orientation.Vertical,     {row: 6,  col: 5,  layer: 0}) == false);
    assert(game.placeWall(Orientation.Vertical,     {row: 4,  col: 5,  layer: 0}) == true);

    assert(game.placeWall(Orientation.Flat,         {row: 0,  col: 14,  layer: 1}) == true);
    assert(game.placeWall(Orientation.Flat,         {row: 2,  col: 14,  layer: 1}) == false);

//    assert(game.placeWall(Orientation.Flat,         {row: 7,  col: 5,  layer: 3}) == true);
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

function TestAddingPlayers()
{
    Test("No players upon just starting game", game.numPlayers() == 0);

    game.addPlayer({
        id: 0,
        position: {row: 0,
                   col: Math.floor(game.getBoardSize() / 2),
                   layer: Math.floor(game.getBoardLayers() / 2)},
        numFences: 10,
        goalY: game.getBoardSize() - 1
    }   );
    game.addPlayer({
        id: 1,
        position: {row: game.getBoardSize() - 1,
                   col: Math.floor(game.getBoardSize() / 2),
                   layer: Math.floor(game.getBoardLayers() / 2)},
        numFences: 10,
        goalY: 0
    }  );

    Test("Adding two players", game.numPlayers() == 2);
    //assert(game.switchPlayer() == 1);
}

function TestOddEven()
{
    let x = 5;
    Test("Odd number is odd", x.IsOdd() == true);
    Test("Odd number is not even", x.IsEven() == false);
}

function Test(title: string, res: boolean )
{
    console.log(title, ": ", res ? "PASSED" : "FAILED")
}