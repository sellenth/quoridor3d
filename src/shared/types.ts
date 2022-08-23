export type Coordinate = {
    row: number,
    col: number,
    layer: number
}

export type Player = {
    id: string;
    goalY: number;
    numFences: number;
    position: Coordinate;
}

export type Action = {
    coordinate: Coordinate | undefined;
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

export enum MessageType { GameState, Identity };

export type ServerPayload = {
    type: MessageType,
    data: GameStatePayload | IdentityPayload
}

export type GameStatePayload = {
    fences: Fence[],
    players: Player[],
    activePlayerId: string
}

export type IdentityPayload = {
    playerId: string
}

export type ClientMessage = {
    playerId: string,
    action: Action,
}