const glsl = x => x;

let fss = glsl`#version 300 es
    precision highp float;
    
    in vec3  Color;

    out vec4 outColor;
    
    void main() {
        //outColor = vec4(1, 0, 0.5, 1);
        outColor = vec4(Color, 1.);
    }
`;

export default fss;