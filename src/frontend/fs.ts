let fss = `#version 300 es
    precision highp float;
    

    uniform vec3 color;
    uniform float u_time;
    out vec4 outColor;

    void main() {
        //outColor = vec4(1, 0, 0.5, 1);
outColor = vec4(vec3((cos(u_time) + 1.) / 2.), 0.2);
    }
`;

export default fss;
