export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

export type Mat4 = Float32List;

export type Player = {
    pos: Vec3,
    color: Vec3,
    walls: number
}

export type Cursor = {
    pos: Vec3,
    flat: boolean,
    sideways: boolean
}
