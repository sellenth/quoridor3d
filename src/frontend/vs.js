const glsl = x => x;

let vss = glsl`#version 300 es
    in vec3 a_position;
    in vec3 a_color;

    uniform mat3 projection;
    uniform mat3 rotation;
    out vec3 Color;

    void main() {

        gl_Position = vec4(projection * rotation * a_position, 1.f);
        Color = a_color;
    }
`;

export default vss;