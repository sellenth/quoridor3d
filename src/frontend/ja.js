import vss from "./vs.js";
import fss from "./fs.js";
import { createShader, createProgram, resizeCanvasToDisplaySize, sleep } from "./utils.js"
import {identity, multiply, translate, scale, projection, rotationX} from "./math.js"

const szFLOAT = 4;

function logMatrix(m)
{
    for (let i = 0; i < 3; i++)
    {
        console.log(m[0 * 3 + i], m[1 * 3 + i], m[2 * 3 + i]);
    }
}

async function main() {
    let canvas = document.querySelector("#c");

    /** type {WebGLRenderingContext} */
    let gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("You need a webGL compatible browser")
    }


    let vs = createShader(gl, gl.VERTEX_SHADER, vss);
    let fs = createShader(gl, gl.FRAGMENT_SHADER, fss);


    let program = createProgram(gl, vs, fs);
    let positionAttribLocation = gl.getAttribLocation(program, "a_position");
    let colorAttribLocation = gl.getAttribLocation(program, "a_color");



    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    let buff = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buff);

    let positionsAndColor = [
        0, 0, 1, 255, 0, 0,
        0, 100, 1, 255, 0, 0,
        20, 100, 1, 255, 0, 0,
        20, 20, 1, 0, 255, 0,
        50, 0, 1, 0, 0, 255,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsAndColor), gl.STATIC_DRAW);

    let elBuff = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elBuff);

    let elements = [
        0, 1, 2,
        2, 3, 0,
        0, 4, 3
    ]

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);


    gl.enableVertexAttribArray(positionAttribLocation);

    // binds currently bound array_buffer (positionBuffer) & ebo (elBuff) to this attribPointer
    gl.vertexAttribPointer(positionAttribLocation, // vertex attribute to modify
        3, // how many elements per attribute
        gl.FLOAT, // type of individual element
        false, //normalize
        6 * szFLOAT, //stride
        0 //offset from start of buffer
    );

    gl.enableVertexAttribArray(colorAttribLocation);

    // binds currently bound array_buffer (positionBuffer) to this attribPointer
    gl.vertexAttribPointer(colorAttribLocation, // vertex attribute to modify
        3, // how many elements per attribute
        gl.FLOAT, // type of individual element
        false, //normalize
        6 * szFLOAT, //stride
        3 * szFLOAT //offset from start of buffer
    );

    //logMatrix(scale(1/400, 1/400, translate(5, 5, identity())));


    /////
    /////


    let i = 0;
    //render loops
    while (true)
    {
        resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        let p = projection(gl.canvas.clientWidth, gl.canvas.clientHeight, identity());
        let projLoc = gl.getUniformLocation(program, "projection");
        gl.uniformMatrix3fv(projLoc, false, p);

        let rotMat = rotationX(i+=.1, translate(50, 50, identity()));
        let rotLoc = gl.getUniformLocation(program, "rotation");
        gl.uniformMatrix3fv(rotLoc, false, rotMat);

        gl.bindVertexArray(vao);

        gl.drawElements(gl.TRIANGLES, 9, gl.UNSIGNED_SHORT, 0);
        await sleep(33);
    }
}


main();