import vss from "./vs.js";
import fss from "./fs.js";
import { createShader, createProgram, resizeCanvasToDisplaySize, sleep } from "./utils.js"
import {identity, multiply, translate, scale, projection, rotationXY, rotationXZ, lookAt as lookAt, invertMat4} from "./math.js"

const szFLOAT = 4;

function logMatrix(m)
{
    for (let i = 0; i < 4; i++)
    {
        console.log(m[0 * 4 + i], m[1 * 4 + i], m[2 * 4 + i], m[3 * 4 + i]);
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

    let cubeData = [
        -.5, -.5, -.5,      255, 0, 0,
         .5, -.5, -.5,      255, 0, 0,
         .5,  .5, -.5,      255, 0, 0,
        -.5,  .5, -.5,      255, 0, 0,

        -.5, -.5,  .5,      0, 255, 0,
         .5, -.5,  .5,      0, 255, 0,
         .5,  .5,  .5,      0, 255, 0,
        -.5,  .5,  .5,      0, 255, 0,


    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeData), gl.STATIC_DRAW);

    let elBuff = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elBuff);

    let elements = [
        0, 1,
        1, 2,
        2, 3,
        3, 0,

        4, 5,
        5, 6,
        6, 7,
        7, 4,

        0, 4,
        1, 5,
        2, 6,
        3, 7
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

    // binds currently bound array_buffer (positionBuffer) & ebo (elBuff) to this attribPointer
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

    let cameraPos = [0, 0, -1];
    let cameraDir = [0, 0, 0];

    canvas.addEventListener('keydown', e => {
        switch(e.key)
        {
            case "w":
                cameraPos[2] += .1; 
                break;
            case "a":
                cameraPos[0] -= .1; 
                break;
            case "s":
                cameraPos[2] -= .1; 
                break;
            case "d":
                cameraPos[0] += .1; 
                break;
            default:
                console.log(e.key);
        }
    })

    let mousePos = {
        x: 0,
        y: 0,
    }

    canvas.addEventListener('mousemove', e => {
        if (e.offsetX > mousePos.x)
        {
            cameraDir[0] += 0.1;
        }
        else if (e.offsetX < mousePos.x)
        {
            cameraDir[0] -= 0.1;
        }
        if (e.offsetY > mousePos.y)
        {
            cameraDir[1] -= 0.1;
        }
        else if (e.offsetY < mousePos.y)
        {
            cameraDir[1] += 0.1;
        }
        mousePos.x = e.offsetX;
        mousePos.y = e.offsetY;
    })

    const fpsElem = document.querySelector("#fps").lastChild;

    let d = new Date();
    let then = d.getMilliseconds();

    gl.enable(gl.DEPTH_TEST);
    const gridSize = 10;
    let viewMat = new Array(16);

    //render loop
    while (true)
    {
        let now = new Date().getTime() * .001;
        const deltaTime = now - then;
        then = now;
        const fps = 1 / deltaTime;
        // a neat premature optimization 
        // https://www.measurethat.net/Benchmarks/Show/9727/0/parseint-vs-tofixed-vs
        fpsElem.textContent = ~~fps;

        resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        let p = projection(3.14 / 2, gl.canvas.clientWidth / gl.canvas.clientHeight, 1, 30);
        let projLoc = gl.getUniformLocation(program, "projection");
        gl.uniformMatrix4fv(projLoc, false, p);

        let c = lookAt(cameraPos, [0, 1, 0], cameraDir);
        invertMat4(c, viewMat);
        let camLoc = gl.getUniformLocation(program, "camera");
        gl.uniformMatrix4fv(camLoc, false, viewMat);

        gl.bindVertexArray(vao);
        for (let cellX = 0; cellX < gridSize; cellX++)
        {
            for (let cellY = 0; cellY < gridSize; cellY++)
            {
                for (let cellZ = 0; cellZ < gridSize; cellZ++)
                {

                    let modelMat = translate(cellX, cellY, cellZ, identity());
                    let rotLoc = gl.getUniformLocation(program, "model");
                    gl.uniformMatrix4fv(rotLoc, false, modelMat);

                    gl.drawElements(gl.LINES, 24, gl.UNSIGNED_SHORT, 0);
                }
            }

        }

        await sleep(15);
    }
}

main();