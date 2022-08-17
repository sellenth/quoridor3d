import { Orientation } from "../shared/types";

export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

export type Mat4 = Float32List;

export type Player = {
    id: number
    pos: Vec3,
    color: Vec3,
    walls: number
}

export type Cursor = {
    pos: Vec3,
    orientation: Orientation
}
