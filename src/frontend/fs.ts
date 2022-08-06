let fss = `#version 300 es
    precision highp float;
    

    uniform vec3 color;
    uniform vec2 u_resolution;
    uniform float u_time;
    out vec4 outColor;

    in vec4 modelCoord;

    void main() {

        vec2 st = gl_FragCoord.xy / u_resolution;
        //outColor = vec4(1, 0, 0.5, 1);

// hmm... (cos(u_time) + 1.) / 2.;

        float a = distance(modelCoord.xy, vec2(1.));
        outColor = vec4(a, 0.5, 0., 0.8);
    }
`;

export default fss;
