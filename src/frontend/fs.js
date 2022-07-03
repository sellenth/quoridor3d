const glsl = x => x;

let fss = glsl`#version 300 es
    precision highp float;
    

    uniform vec3 color;
    out vec4 outColor;
    
    void main() {
        //outColor = vec4(1, 0, 0.5, 1);
        outColor = vec4(color, 0.2);
    }
`;

export default fss;