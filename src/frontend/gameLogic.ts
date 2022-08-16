import { Cursor, Vec3, Player } from "./types.js"
import { addVec3 } from "./math.js";
import { ClientMessage, Fence, Orientation, Player as NetworkPlayer } from "../shared/types.js";

export class GameLogic {
    gridSizeXY: number = 10;
    gridLayers: number = 4;
    activePlayer: number = 1;
    id:           number = -1;

    cursor: Cursor = {
        pos: [1, 0, 0],
        flat: false,
        sideways: false,
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
                    flat: fence.orientation == Orientation.Flat,
                    sideways: fence.orientation == Orientation.Vertical,
                }
            )
        })
    }

    updatePlayers(players: NetworkPlayer[])
    {
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

    getActivePlayer()
    {
        return this.players[this.activePlayer - 1];
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
            let pos = this.cursor.pos;
            pos = addVec3(pos, this.players[this.activePlayer - 1].pos);
            this.notifyServer(
                {
                    id: this.getActivePlayer().id,
                    action: {
                        coordinate: {row: pos[2] * 2 - 1, col: pos[0] * 2 - 1, layer: pos[1] * 2 - 1},
                        fence: undefined,
                    }
                }
            )
        }
        if (this.cursorMode == "fence")
        {
            let orientation = Orientation.Horizontal;
            if (this.cursor.flat)
            {
                orientation = Orientation.Flat
            }
            else if (this.cursor.sideways)
            {
                orientation = Orientation.Vertical;
            }

            let pos = this.cursor.pos;
            if (orientation == Orientation.Horizontal)
            {
                this.notifyServer(
                    {
                        id: this.getActivePlayer().id,
                        action: {
                            coordinate: undefined,
                            fence: {
                                coord: { row: Math.max(0, pos[2] * 2 - 1), col: Math.max(0, pos[0] * 2 - 1), layer: Math.max(0, pos[1] * 2 - 1) },
                                orientation: orientation
                            }
                        }
                    }
                )
            }

            else if (orientation == Orientation.Vertical)
            {
                this.notifyServer(
                    {
                        id: this.getActivePlayer().id,
                        action: {
                            coordinate: undefined,
                            fence: {
                                coord: { row: Math.max(0, pos[2] * 2), col: Math.max(0, pos[0] * 2 - 1), layer: Math.max(0, pos[1] * 2 - 1) },
                                orientation: orientation
                            }
                        }
                    }
                )
            }

            else if (orientation == Orientation.Flat)
            {
                this.notifyServer(
                    {
                        id: this.getActivePlayer().id,
                        action: {
                            coordinate: undefined,
                            fence: {
                                coord: { row: Math.max(0, pos[2] * 2 - 1), col: Math.max(0, pos[0] * 2 - 1), layer: pos[1] * 2 - 1 },
                                orientation: orientation
                            }
                        }
                    }
                )
            }
        }
    }
}
