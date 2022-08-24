import { assert } from "console";
import { Action, GameStatePayload, Player, Fence, Orientation, Coordinate, ClientMessage } from "../shared/types"

const EXPLORED = 999;
const EMPTY_FENCE = -1;
const EMPTY_CELL = 0;
const PLAYER_TOKEN = 9;
const WALL_THRESHOLD = 100

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

export class Game
{
    logicalBoardSize = 9;
    actualBoardSize = this.logicalBoardSize * 2 - 1;
    logicalBoardLayers = 3;
    actualBoardLayers = this.logicalBoardLayers * 2 - 1;
    board: number[][][];
    players: Player[];
    currPlayer: Player | undefined;
    nextWallNumber = WALL_THRESHOLD;
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
        if (this.currPlayer && this.currPlayer.id == msg.playerId)
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
                activePlayerId: this.currPlayer?.id
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

    processAction({heading, fence}: Action)
    {
        assert (!!this.currPlayer);
        if (heading)
        {
            if (this.isValidMove(heading))
            {
                console.log('successful player move')
                this.MovePlayer(heading);
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

    isValidMove(newHeading: Coordinate)
    {
        if (this.currPlayer)
        {
            let c = this.currPlayer.position
            let {row: headingRow, col: headingCol, layer: headingLayer} = newHeading;
            return this.TestHeading(this.board, c, headingRow, headingCol, headingLayer);
        }
        return false;
    }

    MovePlayer(heading: Coordinate)
    {
        this.board
            [this.currPlayer.position.row]
            [this.currPlayer.position.col]
            [this.currPlayer.position.layer] = EMPTY_CELL
        this.currPlayer.position.row += heading.row * 2;
        this.currPlayer.position.col += heading.col * 2;
        this.currPlayer.position.layer += heading.layer * 2;
        this.board
            [this.currPlayer.position.row]
            [this.currPlayer.position.col]
            [this.currPlayer.position.layer] = PLAYER_TOKEN;
    }

    numPlayers()
    {
        return this.players.length;
    }

    switchPlayer()
    {
        const lastPlayerId = this.currPlayer.id;
        this.currPlayer = undefined;

        for (let i = 0; i < this.players.length; i++)
        {
            if (this.players[i].id != lastPlayerId)
            {
                this.currPlayer = this.players[i];
                break;
            }
        }

        return this.currPlayer?.id;
    }

    CreatePlayer(id: string)
    {
        if (this.players.length == 0)
        {
            game.addPlayer({
                id: id,
                position: {row: 0,
                        col: Math.floor(game.getBoardSize() / 2),
                        layer: Math.floor(game.getBoardLayers() / 2)},
                numFences: 1,
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
                numFences: 1,
                goalY: 0
            }  );
        }
    }

    RemovePlayer(id: string)
    {
        if (id != undefined)
        {
            this.players = this.players.filter((player) => {
                return player.id != id;
            })

            if (id == this.currPlayer.id)
            {
                this.switchPlayer()
            }
        }
    }

    addPlayer(player: Player)
    {
        this.players.push(player);

        this.board[player.position.row][player.position.col][player.position.layer] = PLAYER_TOKEN;

        if (this.currPlayer == undefined)
        {
            this.currPlayer = player;
        }
    }

    placeWall(orientation: Orientation, coord: Coordinate): boolean
    {
        if (this.currPlayer.numFences <= 0) return false;
        if (this.InvalidWallPosition(orientation, coord)) return false;

        this.UpdateBoardWithNewWall(this.board, orientation, coord);
        this.currPlayer.numFences--;

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

    UpdateBoardWithNewWall(board: number[][][], orientation: Orientation, coord: Coordinate)
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
                    board[row][col][layer] = this.nextWallNumber
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

            this.UpdateBoardWithNewWall(tmpBoard, orientation, coordinate);

            let stack = [ player.position ];
            tmpBoard[player.position.row][player.position.col][player.position.layer] = EXPLORED;

            while (stack.length)
            {
                let currPosition = stack.pop();
                if (currPosition.row == player.goalY)
                {
                    return true;
                }

                stack.push(...this.getAdjacentCells(currPosition, tmpBoard));
            }

            allPathsExist = false;
            return false;
        });

        return allPathsExist;
    }

    TestHeading(board: number[][][], coordinate: Coordinate, rowModifier: number, colModifier: number, layerModifier: number)
    {
        return (this.inBounds(coordinate.row + rowModifier, coordinate.col + colModifier, coordinate.layer + layerModifier )
            && board[coordinate.row + rowModifier][coordinate.col + colModifier][coordinate.layer + layerModifier] == EMPTY_FENCE
            && this.inBounds(coordinate.row + 2 * rowModifier, coordinate.col + 2 * colModifier, coordinate.layer + 2 * layerModifier)
            && board[coordinate.row + 2 * rowModifier][coordinate.col + 2 * colModifier][coordinate.layer + 2 * layerModifier] != EXPLORED)
    }

    getAdjacentCells(coordinate: Coordinate, board: number[][][])
    {
        let adjacentCells: Coordinate[] = [];

        let testDirection = ( rowModifier: number, colModifier: number, layerModifier: number) => {
            if (this.TestHeading(board, coordinate, rowModifier, colModifier, layerModifier))
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
