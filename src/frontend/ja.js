import vss from "./vs.js";
import fss from "./fs.js";
import { createShader, createProgram, resizeCanvasToDisplaySize, sleep } from "./utils.js"
import {crossProduct, identity, multiply, translate, scale, projection, rotationXY, rotationXZ, lookAt, invertMat4, normalizeVec3, cos_d, sin_d} from "./math.js"

const szFLOAT = 4;

function logMatrix(m)
{
    for (let i = 0; i < 4; i++)
    {
        console.log(m[i * 4 + 0], m[i * 4 + 1], m[i * 4 + 2], m[i * 4 + 3]);
    }
}

class Vec3
{
    x;
    y;
    z;

    constructor(x, y, z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(other)
    {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        return this;
    }

    sub(other)
    {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;
        return this;
    }

    scale(factor)
    {
        this.x *= factor;
        this.y *= factor;
        this.z *= factor;
        return this;
    }
}

class Camera {
    #frontVec = new Vec3(0, 0, 1);
    #rightVec = new Vec3(1, 0, 0);
    #upVec = new Vec3(0, 1, 0);
    #position = new Vec3(0, 0, -15);
    #yaw = -89;
    #pitch = 0;
    #moveSpeed = 10;
    #mouseSens = 0.1;
    keysDown = {};

    constructor()
    {

    }

    getRightVec()
    {
        return [this.#rightVec.x, this.#rightVec.y, this.#rightVec.z];
    }

    getUpVec()
    {
        return [this.#upVec.x, this.#upVec.y, this.#upVec.z];
    }

    getFrontVec()
    {
        return [this.#frontVec.x, this.#frontVec.y, this.#frontVec.z];
    }

    getPosition()
    {
        return [this.#position.x, this.#position.y, this.#position.z];
    }



    Move(deltaTime)
    {
        let velocity = this.#moveSpeed * deltaTime;
        if (this.keysDown.w)
        {
            this.#position.sub(new Vec3(...this.getFrontVec()).scale(velocity));
        }
        if (this.keysDown.s) {
            this.#position.add(new Vec3(...this.getFrontVec()).scale(velocity));
        }
        if (this.keysDown.a) {
            this.#position.sub(new Vec3(...this.getRightVec()).scale(velocity));
        }
        if (this.keysDown.d) {
            this.#position.add(new Vec3(...this.getRightVec()).scale(velocity));
        }
    }

    updateVectors()
    {
        let front = new Vec3(0, 0, 0);
        front.x = cos_d(this.#yaw) * cos_d(this.#pitch);
        front.y = sin_d(this.#pitch);
        front.z = sin_d(this.#yaw) * cos_d(this.#pitch);

        this.#frontVec = new Vec3(...normalizeVec3([front.x, front.y, front.z]));
        this.#rightVec = new Vec3(...normalizeVec3(crossProduct( [...this.getFrontVec()], [0, 1, 0] )));
        this.#upVec = new Vec3(...normalizeVec3(crossProduct( [...this.getRightVec()], [...this.getFrontVec()] )));

    }
    
    getCameraMatrix()
    {
        return [
            ...this.getRightVec(), 0,
            ...this.getUpVec(),    0,
            ...this.getFrontVec(), 0,
            ...this.getPosition(), 1
        ]
    }

    Look(xOffset, yOffset)
    {
        xOffset *= this.#mouseSens;
        yOffset *= this.#mouseSens;

        this.#yaw -= xOffset;
        this.#pitch += yOffset;

        if (this.#pitch > 89)
            this.#pitch = 89;
        if (this.#pitch < -89)
            this.#pitch = -89;

        this.updateVectors();
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

    /*
    gl.enableVertexAttribArray(colorAttribLocation);

    // binds currently bound array_buffer (positionBuffer) & ebo (elBuff) to this attribPointer
    gl.vertexAttribPointer(colorAttribLocation, // vertex attribute to modify
        3, // how many elements per attribute
        gl.FLOAT, // type of individual element
        false, //normalize
        6 * szFLOAT, //stride
        3 * szFLOAT //offset from start of buffer
    );
    */

    let playerProgram = createProgram(gl, vs, fs);
    let playerPosAttrib = gl.getAttribLocation(playerProgram, "a_position");

    let playerVAO = gl.createVertexArray();
    gl.bindVertexArray(playerVAO);

    let buff2 = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buff2);

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

    /////
    /////
    const fpsElem = document.querySelector("#fps").lastChild;

    let d = new Date();
    let then = d.getMilliseconds();
    let deltaTime = 1;

    gl.enable(gl.DEPTH_TEST);
    let viewMat = new Array(16);

    let camera = new Camera();

    //camera.Move("F", deltaTime )

    canvas.addEventListener('keydown', e => {
        if (e.key == "w")
            camera.keysDown.w = true;
        if (e.key == "a")
            camera.keysDown.a = true;
        if (e.key == "s")
            camera.keysDown.s = true;
        if (e.key == "d")
            camera.keysDown.d = true;
    })

    canvas.addEventListener('keyup', e => {
        if (e.key == "w")
            camera.keysDown.w = false;
        if (e.key == "a")
            camera.keysDown.a = false;
        if (e.key == "s")
            camera.keysDown.s = false;
        if (e.key == "d")
            camera.keysDown.d = false;
    })

    let firstLook = false;
    camera.updateVectors();

    canvas.addEventListener('click', e =>
    {
        firstLook = true;
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
    })

    canvas.addEventListener('mousemove', e => {
        if (document.pointerLockElement === canvas)
        {
            if (firstLook)
            {
                firstLook = false;
                camera.Look(0, 0);
            }
            else {
                camera.Look(e.movementX, e.movementY);
            }
        }
    })

    let playerPositions = [
        [0, 0, 0],
        [0, 0, 2],
        [1, 1, 0],
    ]

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
            let p = projection(3.14 / 2, gl.canvas.clientWidth / gl.canvas.clientHeight, 1, 30);
            camera.Move(deltaTime);
            let c = camera.getCameraMatrix();
            invertMat4(c, viewMat);
        //

        // Draw Grid 
            gl.useProgram(gridProgram);

            let projLoc = gl.getUniformLocation(gridProgram, "projection");
            gl.uniformMatrix4fv(projLoc, false, p);

            let camLoc = gl.getUniformLocation(gridProgram, "camera");
            gl.uniformMatrix4fv(camLoc, false, viewMat);

            let modelMat = identity();//translate(cellX, cellY, cellZ, identity());
            let modelLoc = gl.getUniformLocation(gridProgram, "model");
            gl.uniformMatrix4fv(modelLoc, false, modelMat);

            gl.bindVertexArray(gridVAO);
            gl.drawArrays(gl.LINES, 0, gridData.length);
        //

        // Draw Players

            gl.useProgram(playerProgram);

            projLoc = gl.getUniformLocation(playerProgram, "projection");
            gl.uniformMatrix4fv(projLoc, false, p);

            camLoc = gl.getUniformLocation(playerProgram, "camera");
            gl.uniformMatrix4fv(camLoc, false, viewMat);

            playerPositions.forEach(pos => {
                modelMat = translate (...pos, identity());

                modelLoc = gl.getUniformLocation(playerProgram, "model");
                gl.uniformMatrix4fv(modelLoc, false, modelMat);

                gl.bindVertexArray(playerVAO);
                gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
            })

        //

        await sleep(16);
    }
}

main();