export const fsFence = `#version 300 es
    precision highp float;
    

    uniform vec3 color;
    uniform vec2 u_resolution;
    uniform float u_time;
    out vec4 outColor;

    in vec4 modelCoord;

    void main() {

        vec2 st = gl_FragCoord.xy / u_resolution;
        //outColor = vec4(1, 0, 0.5, 1);


        float a = distance(modelCoord.xy, vec2(1.)) / 1.75;

        //a *= abs((cos(u_time * 4.) + 1.5) / 4.);
        /*
        float pulseTime = 1.5;
        a *= 1. - mod(u_time, pulseTime) / pulseTime;

        float channel1 = mod(u_time, pulseTime * 2.);
        float channel2 = 1. + -step(pulseTime, channel1);
        channel1 = step(pulseTime, channel1);
        */

        outColor = vec4(.2, a, .8, 1.);
    }
`;

export const fsPlayer = `#version 300 es
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
        outColor = vec4(a * color, 0.8);
    }
`;

export const fsGrid = `#version 300 es
    precision highp float;
    

    uniform vec3 camPos;
    uniform vec3 color;
    uniform vec2 u_resolution;
    uniform float u_time;
    out vec4 outColor;

    in vec4 modelCoord;
    in vec4 worldCoord;

    void main() {
        vec2 st = gl_FragCoord.xy / u_resolution;

        float a = (5. - distance(camPos.xyz, worldCoord.xyz)) / 5.;
        outColor = vec4(1., .5, 0., a);
    }
`;

export default fsFence;
