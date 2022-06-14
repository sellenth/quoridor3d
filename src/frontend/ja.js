import vss from "./vs.js";
import fss from "./fs.js";
import { createShader, createProgram, resizeCanvasToDisplaySize, sleep } from "./utils.js"
import {identity, translate, projection, addVec3, rotationYZ, rotationXY, rotationXZ, scale} from "./math.js"
import { Camera } from "./camera.js";

const szFLOAT = 4;

function logMatrix(m)
{
    for (let i = 0; i < 4; i++)
    {
        console.log(m[i * 4 + 0], m[i * 4 + 1], m[i * 4 + 2], m[i * 4 + 3]);
    }
}

async function main() {
    let canvas = document.querySelector("#c");
    const gridSize = 10;

    /** type {WebGLRenderingContext} */
    let gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("You need a webGL compatible browser")
    }


    let vs = createShader(gl, gl.VERTEX_SHADER, vss);
    let fs = createShader(gl, gl.FRAGMENT_SHADER, fss);


    let gridProgram = createProgram(gl, vs, fs);
    let positionAttribLocation = gl.getAttribLocation(gridProgram, "a_position");

    let gridVAO = gl.createVertexArray();
    gl.bindVertexArray(gridVAO);

    let buff = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buff);

    let gridData = [];

    for (let a = 0; a < gridSize; a++)
    {
        for (let b = 0; b < gridSize; b++)
        {
            gridData.push(0, a, b,
                          gridSize - 1, a, b);

            gridData.push( a, b, 0,
                           a, b, gridSize - 1);
        }

    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridData), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionAttribLocation);

    // binds currently bound array_buffer (positionBuffer) & ebo (elBuff) to this attribPointer
    gl.vertexAttribPointer(positionAttribLocation, // vertex attribute to modify
        3, // how many elements per attribute
        gl.FLOAT, // type of individual element
        false, //normalize
        3 * szFLOAT, //stride
        0 //offset from start of buffer
    );

    let playerProgram = createProgram(gl, vs, fs);
    let playerPosAttrib = gl.getAttribLocation(playerProgram, "a_position");

    let playerVAO = gl.createVertexArray();
    gl.bindVertexArray(playerVAO);

    buff = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buff);

    let cubeData = [
        0, 0, 0,      255, 0, 0,
        1, 0, 0,      255, 0, 0,
        1, 1, 0,      255, 0, 0,
        0, 1, 0,      255, 0, 0,

        0, 0, 1,      0, 255, 0,
        1, 0, 1,      0, 255, 0,
        1, 1, 1,      0, 255, 0,
        0, 1, 1,      0, 255, 0,


    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeData), gl.STATIC_DRAW);

    let elBuff = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elBuff);
    let elements = [
        0, 1, 2,
        0, 2, 3,

        4, 5, 6,
        4, 6, 7,

        0, 3, 4,
        3, 4, 7,

        1, 5, 6,
        1, 2, 6,

        0, 1, 4,
        1, 4, 5,

        2, 3, 6,
        3, 6, 7
    ]
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);


    gl.enableVertexAttribArray(playerPosAttrib);

    // binds currently bound array_buffer (positionBuffer) & ebo (elBuff) to this attribPointer
    gl.vertexAttribPointer(playerPosAttrib, // vertex attribute to modify
        3, // how many elements per attribute
        gl.FLOAT, // type of individual element
        false, //normalize
        6 * szFLOAT, //stride
        0 //offset from start of buffer
    );

    let fenceProgram = createProgram(gl, vs, fs);
    let fencePosAttrib = gl.getAttribLocation(fenceProgram, "a_position");

    let fenceVAO = gl.createVertexArray();
    gl.bindVertexArray(fenceVAO);

    buff = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buff);

    let fenceData = [
        0, 0, 0,      255, 0, 0,
        2, 0, 0,      255, 0, 0,
        2, 2, 0,      255, 0, 0,
        0, 0, 0,      255, 0, 0,
        0, 2, 0,      255, 0, 0,
        2, 2, 0,      255, 0, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fenceData), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(fencePosAttrib);

    // binds currently bound array_buffer (positionBuffer) & ebo (elBuff) to this attribPointer
    gl.vertexAttribPointer(fencePosAttrib, // vertex attribute to modify
        3, // how many elements per attribute
        gl.FLOAT, // type of individual element
        false, //normalize
        6 * szFLOAT, //stride
        0 //offset from start of buffer
    );

    /////
    /////
    const fpsElem = document.querySelector("#fps").lastChild;

    let d = new Date();
    let then = d.getMilliseconds();
    let deltaTime = 1;

    gl.enable(gl.DEPTH_TEST);

    let myTurn = true;
    let cursorPos = {p: [1, 0, 0]};
    let players = 
    [
        {
            pos: [4, 4, 0],
            color: [255, 0, 0],
        },
        {
            pos: [4, 4, 8],
            color: [0, 255, 0],
        }
    ];


    let fencePositions = 
    [
        {
            origin: [5, 1, 0],
            sideways: false,
            flat: true
        },
        {
            origin: [7, 0, 0],
            sideways: true,
            flat: false
        }
    ];

    let camera = new Camera();
    camera.configureCameraListeners(canvas, cursorPos);

    //render loop
    while (true)
    {
        // Prepare Buffer
            let now = new Date().getTime() * .001;
            deltaTime = now - then;
            then = now;
            const fps = 1 / deltaTime;
            // a neat premature optimization 
            // https://www.measurethat.net/Benchmarks/Show/9727/0/parseint-vs-tofixed-vs
            fpsElem.textContent = ~~fps;

            resizeCanvasToDisplaySize(gl.canvas);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //

        // Calculate program independent matrices
            let p = projection(3.14 / 2, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.01, 30);
            camera.Move(deltaTime);
            let viewMat = camera.getViewMatrix();
        //

        // Draw Grid 
            gl.useProgram(gridProgram);
            gl.bindVertexArray(gridVAO);

            let projLoc = gl.getUniformLocation(gridProgram, "projection");
            gl.uniformMatrix4fv(projLoc, false, p);

            let camLoc = gl.getUniformLocation(gridProgram, "camera");
            gl.uniformMatrix4fv(camLoc, false, viewMat);

            let modelMat = identity();
            let modelLoc = gl.getUniformLocation(gridProgram, "model");
            gl.uniformMatrix4fv(modelLoc, false, modelMat);

            gl.drawArrays(gl.LINES, 0, gridData.length);
        //

        // Draw Players

            gl.useProgram(playerProgram);
            gl.bindVertexArray(playerVAO);

            projLoc = gl.getUniformLocation(playerProgram, "projection");
            gl.uniformMatrix4fv(projLoc, false, p);

            camLoc = gl.getUniformLocation(playerProgram, "camera");
            gl.uniformMatrix4fv(camLoc, false, viewMat);

            players.forEach(player => {
                modelMat = translate(...addVec3(player.pos, [.2, .2, .2]), identity());
                modelMat = scale(0.6, 0.6, 0.6, modelMat);

                let colorLoc = gl.getUniformLocation(playerProgram, "color");
                gl.uniform3fv(colorLoc, player.color);

                modelLoc = gl.getUniformLocation(playerProgram, "model");
                gl.uniformMatrix4fv(modelLoc, false, modelMat);

                gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
            })

            if (myTurn)
            {
                modelMat = translate(...addVec3(players[0].pos, cursorPos.p), identity());

                let colorLoc = gl.getUniformLocation(playerProgram, "color");
                gl.uniform3fv(colorLoc, [0, 0, 255]);

                modelLoc = gl.getUniformLocation(playerProgram, "model");
                gl.uniformMatrix4fv(modelLoc, false, modelMat);

                gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
            }
        //

        // Draw Fences
            gl.useProgram(fenceProgram);
            gl.bindVertexArray(fenceVAO);

            projLoc = gl.getUniformLocation(fenceProgram, "projection");
            gl.uniformMatrix4fv(projLoc, false, p);

            camLoc = gl.getUniformLocation(fenceProgram, "camera");
            gl.uniformMatrix4fv(camLoc, false, viewMat);

            fencePositions.forEach(pos => {
                modelMat = translate (...pos.origin, identity());
                if (pos.flat)
                    modelMat = rotationYZ(3 * Math.PI / 2, modelMat);
                if (pos.sideways)
                    modelMat = rotationXZ(Math.PI / 2, modelMat);

                modelLoc = gl.getUniformLocation(fenceProgram, "model");
                gl.uniformMatrix4fv(modelLoc, false, modelMat);

                gl.drawArrays(gl.TRIANGLES, 0, fenceData.length);
            })

        //

        await sleep(16);
    }
}

main();