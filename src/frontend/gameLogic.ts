import { Cursor, Vec3, Player } from "./types.js"
import { addVec3 } from "./math.js";

export class GameLogic {
    gridSizeXY: number = 10;
    gridLayers: number = 4;
    activePlayer: number = 1;
    cursor: Cursor = {
        pos: [1, 0, 0],
        flat: false,
        sideways: false,
    }
    cursorMode = "fence";
    players: Player[];
    fencePositions: Cursor[];

    constructor() {
        this.players =
            [
                {
                    pos: [this.gridSizeXY / 2 - 1, this.gridLayers / 2 - 1, 0],
                    color: [255, 0, 0],
                    walls: 10
                },
                {
                    pos: [this.gridSizeXY / 2 - 1, this.gridLayers / 2 - 1, this.gridSizeXY - 2],
                    color: [0, 255, 0],
                    walls: 10
                }
            ];
        this.fencePositions = [];
    }

    updateFences(payload: any)
    {
        this.fencePositions.length = 0;
        payload.forEach((fence: any) => {
            this.fencePositions.push(
                {
                    pos: [Math.ceil(fence.coord.col / 2), Math.ceil(fence.coord.layer / 2), Math.ceil(fence.coord.row / 2) ],
                    flat: fence.orientation == 3 ? true : false,
                    sideways: fence.orientation == 2 ? true : false
                }
            )
        })

        console.log(this.fencePositions)
    }

    getActivePlayer()
    {
        return this.players[this.activePlayer];
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

    toggleCursorFlat()
    {
        this.cursor.flat = !this.cursor.flat;
        this.cursor.sideways = false;
    }

    toggleCursorRotate()
    {
        this.cursor.sideways = !this.cursor.sideways;
        this.cursor.flat = false;
    }

    commitMove()
    {
        if (this.cursorMode == "pawn")
        {
            this.getActivePlayer().pos = addVec3(this.getActivePlayer().pos, this.cursor.pos);
        }
        if (this.cursorMode == "fence")
        {
            this.fencePositions.push( {...this.cursor })
        }
    }
}
