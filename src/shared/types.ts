export type Coordinate = {
    row: number,
    col: number,
    layer: number
}

export type ID = string;

export type Player = {
    id: ID;
    goalY: number;
    numFences: number;
    position: Coordinate;
}

export type Action = {
    heading: Coordinate | undefined;
    fence: Fence | undefined;
}

export enum Orientation {
    Horizontal = 1,
    Vertical = 2,
    Flat = 3
}

export type Fence = {
    coord: Coordinate,
    orientation: Orientation
}

export enum MessageType { GameState, Identity, GameOver };

export type Payload = ID | GameStatePayload;

export type ServerPayload = {
    type: MessageType,
    data: Payload
}

export type GameStatePayload = {
    fences: Fence[],
    players: Player[],
    activePlayerId: ID | undefined
}

export type ClientMessage = {
    playerId: ID,
    action: Action,
}