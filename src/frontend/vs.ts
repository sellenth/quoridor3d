let vss = `#version 300 es
    in vec4 a_position;

    uniform mat4 projection;
    uniform mat4 camera;
    uniform mat4 model;

    void main() 
    {
        gl_Position = projection * camera * model * a_position;
    }
`;

export default vss;
