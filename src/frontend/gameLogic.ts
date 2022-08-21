import { Cursor, Vec3, Player } from "./types.js"
import { addVec3 } from "./math.js";
import { ClientMessage, Coordinate, Fence, Orientation, Player as NetworkPlayer } from "../shared/types.js";

const UNINITIALIZED = -1;

export class GameLogic {
    gridSizeXY: number = 10;
    gridLayers: number = 4;
    activePlayer: number = UNINITIALIZED;
    id:           number = UNINITIALIZED;

    cursor: Cursor = {
        pos: [1, 0, 0],
        orientation: Orientation.Horizontal
    }
    cursorMode = "fence";
    players: Player[];
    fencePositions: Cursor[];

    notifyServer: (msg: ClientMessage) => void;

    constructor() {
        this.players = [];
        this.fencePositions = [];
    }

    assignId(id: number)
    {
        this.id = id;
    }

    updateFences(fences: Fence[])
    {
        this.fencePositions.length = 0;
        fences.forEach((fence) => {
            this.fencePositions.push(
                {
                    pos: [Math.ceil(fence.coord.col / 2), Math.ceil(fence.coord.layer / 2), Math.ceil(fence.coord.row / 2) ],
                    orientation: fence.orientation
                }
            )
        })
    }

    updatePlayers(players: NetworkPlayer[])
    {
        console.log("My id is %d", this.id)
        console.log(players)
        this.players.length = 0;
        players.forEach((player) => {
            this.players.push(
                {
                    id: player.id,
                    pos: [Math.ceil(player.position.col / 2), Math.ceil(player.position.layer / 2), Math.ceil(player.position.row / 2) ],
                    color: [player.goalY, 155, player.goalY],
                    walls: player.numFences,
                }
            )
        });
    }

    getActivePlayer(): Player | undefined
    {
        return this.players.at(this.activePlayer);
    }

    IsMyTurn()
    {
        if (this.players.length == 0 || this.id == UNINITIALIZED)
        {
            return false;
        }
        return this.getActivePlayer().id == this.id;
    }

    setActivePlayer(id: number)
    {
        this.activePlayer = id;
    }

    MoveCursor(v: Vec3)
    {
        if (this.cursorMode == "pawn")
        {
            this.cursor.pos = v;

        }
        else if (this.cursorMode == "fence")
        {
            this.cursor.pos = addVec3(this.cursor.pos, v);
        }
    }

    MoveCursorUp() {
        this.MoveCursor([0, 1, 0]);
    }

    MoveCursorDown() {
        this.MoveCursor([0, -1, 0]);
    }

    MoveCursorFront() {
        this.MoveCursor([0, 0, 1]);
    }

    MoveCursorBack() {
        this.MoveCursor([0, 0, -1]);
    }

    MoveCursorLeft() {
        this.MoveCursor([-1, 0, 0]);
    }

    MoveCursorRight() {
        this.MoveCursor([1, 0, 0]);
    }

    switchCursorMode()
    {
        console.log(this.cursor)
        if (this.cursorMode == "fence")
        {
            this.cursorMode = "pawn";
            this.cursor.pos = [1, 0, 0];
        }
        else if (this.cursorMode == "pawn")
        {
            this.cursorMode = "fence";
            this.cursor.pos = this.getActivePlayer().pos;
        }
    }

    nextCursorOrientation()
    {
        this.cursor.orientation++;
        if (this.cursor.orientation > Orientation.Flat)
        {
            this.cursor.orientation = Orientation.Horizontal;
        }
    }

    commitMove()
    {
        if (this.id != this.getActivePlayer().id)
        {
            console.log("It isn't your turn");
            return;
        }

        if (this.cursorMode == "pawn")
        {
            this.commitPawnMove();
        }
        if (this.cursorMode == "fence")
        {
            this.commitFenceMove();
        }
    }

    commitPawnMove()
    {
        let pos = this.cursor.pos;
        pos = addVec3(pos, this.players[this.activePlayer].pos);
        this.notifyServer(
            {
                id: this.id,
                action: {
                    coordinate: {row: pos[2] * 2 - 1, col: pos[0] * 2 - 1, layer: pos[1] * 2 - 1},
                    fence: undefined,
                }
            }
        )
    }


    commitFenceMove()
    {
        let pos = this.cursor.pos;
        let orientation = this.cursor.orientation;
        this.notifyServer(
            {
                id: this.id,
                action: {
                    coordinate: undefined,
                    fence: this.convertCursorToServerFence(pos, orientation)
                }
            }
        )
    }

    convertCursorToServerFence(pos: Vec3, orientation: Orientation)
    {
        let c: Coordinate;
        switch (orientation)
        {
            case Orientation.Flat:
                c = { layer: Math.max(0, pos[1] * 2 - 1), row: pos[2] * 2, col: pos[0] * 2 };
                break;
            case Orientation.Horizontal:
                c = { row: Math.max(0, pos[2] * 2 - 1), col: pos[0] * 2, layer: pos[1] * 2 };
                break;
            case Orientation.Vertical:
                c = { col: Math.max(0, pos[0] * 2 - 1), row: pos[2] * 2, layer: pos[1] * 2 };
                break;

        }

        let serverFence = {
            coord: c,
            orientation: orientation
        }

        return serverFence;
    }
}
