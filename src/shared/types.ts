export type Coordinate = {
    row: number,
    col: number,
    layer: number
}

export type Player = {
    name: string;
    goalY: number;
    numFences: number;
    position: Coordinate;
}

export type Action = {
    coordinate: Coordinate;
    isFence: boolean;
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
export type GameStatePayload = {
    fences: Fence[],
    players: Player[]
}