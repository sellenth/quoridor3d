const glsl = x => x;

let vss = glsl`#version 300 es
    in vec4 a_position;
    in vec3 a_color;

    uniform mat4 projection;
    uniform mat4 rotation;
    out vec3 Color;

    void main() {

        gl_Position = projection * rotation * a_position;
        Color = a_color;
    }
`;

export default vss;