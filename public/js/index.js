var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import vss from "./vs.js";
import fss from "./fs.js";
import { createShader, createProgram, resizeCanvasToDisplaySize, sleep } from "./utils.js";
import { identity, translate, projection, addVec3, rotationYZ, rotationXZ, scale } from "./math.js";
import { Camera } from "./camera.js";
import { GameLogic } from "./gameLogic.js";
const szFLOAT = 4;
class FrameTiming {
    constructor() {
        this.then = new Date().getTime() * .001;
        this.counterElement = document.querySelector("#fps").lastChild;
        this.elapsed = 0.;
    }
    tick() {
        let now = new Date().getTime() * .001;
        this.deltaTime = now - this.then;
        this.elapsed += this.deltaTime;
        this.then = now;
        this.fps = 1 / this.deltaTime;
        this.counterElement.textContent = this.fps.toFixed();
    }
}
class Engine {
    constructor() {
        this.canvas = document.querySelector("#c");
        this.gameLogic = new GameLogic();
        this.gl = this.canvas.getContext("webgl2", { premultipliedAlpha: false });
        if (!this.gl) {
            alert("You need a webGL compatible browser");
            return;
        }
        this.gl.enable(this.gl.DEPTH_TEST);
        this.camera = new Camera();
        this.camera.configureCameraListeners(this.canvas, this.gameLogic);
        this.camera.SetExtents([this.gameLogic.gridSizeXY,
            this.gameLogic.gridLayers,
            this.gameLogic.gridSizeXY]);
        this.configurePrograms();
        this.frameTiming = new FrameTiming();
    }
    handleServerPayload(payload) {
        if (this.gameLogic) {
            this.gameLogic.updateFences(payload);
        }
    }
    startRenderLoop() {
        return __awaiter(this, void 0, void 0, function* () {
            const gl = this.gl;
            while (true) {
                this.frameTiming.tick();
                resizeCanvasToDisplaySize(gl.canvas, 1);
                gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                this.camera.Move(this.frameTiming.deltaTime);
                let projMat = projection(3.14 / 2, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 50);
                let viewMat = this.camera.getViewMatrix();
                this.sceneObjects.forEach(so => {
                    so.render(projMat, viewMat);
                });
                yield sleep(Math.max(0, 16 - this.frameTiming.deltaTime));
            }
        });
    }
    configurePrograms() {
        this.sceneObjects = [];
        this.sceneObjects.push(this.createGridProgram());
        this.sceneObjects.push(this.createPlayerProgram());
        this.sceneObjects.push(this.createFenceProgram());
    }
    createGridProgram() {
        const gl = this.gl;
        let vs = createShader(gl, gl.VERTEX_SHADER, vss);
        let fs = createShader(gl, gl.FRAGMENT_SHADER, fss);
        let gridProgram = createProgram(gl, vs, fs);
        let positionAttribLocation = gl.getAttribLocation(gridProgram, "a_position");
        let gridVAO = gl.createVertexArray();
        gl.bindVertexArray(gridVAO);
        let buff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buff);
        let gridData = [];
        for (let a = 0; a < this.gameLogic.gridSizeXY; a++) {
            for (let b = 0; b < this.gameLogic.gridLayers; b++) {
                gridData.push(0, b, a, this.gameLogic.gridSizeXY - 1, b, a);
            }
        }
        for (let a = 0; a < this.gameLogic.gridSizeXY; a++) {
            for (let b = 0; b < this.gameLogic.gridLayers; b++) {
                gridData.push(a, b, 0, a, b, this.gameLogic.gridSizeXY - 1);
            }
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridData), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, 3 * szFLOAT, 0);
        return {
            program: gridProgram,
            VAO: gridVAO,
            render: (projMat, viewMat) => {
                gl.useProgram(gridProgram);
                gl.bindVertexArray(gridVAO);
                let projLoc = gl.getUniformLocation(gridProgram, "projection");
                gl.uniformMatrix4fv(projLoc, false, projMat);
                let camLoc = gl.getUniformLocation(gridProgram, "camera");
                gl.uniformMatrix4fv(camLoc, false, viewMat);
                let modelMat = identity();
                let modelLoc = gl.getUniformLocation(gridProgram, "model");
                gl.uniformMatrix4fv(modelLoc, false, modelMat);
                gl.drawArrays(gl.LINES, 0, gridData.length / 3);
            }
        };
    }
    createPlayerProgram() {
        const gl = this.gl;
        let vs = createShader(gl, gl.VERTEX_SHADER, vss);
        let fs = createShader(gl, gl.FRAGMENT_SHADER, fss);
        let playerProgram = createProgram(gl, vs, fs);
        let playerPosAttrib = gl.getAttribLocation(playerProgram, "a_position");
        let playerVAO = gl.createVertexArray();
        gl.bindVertexArray(playerVAO);
        let buff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buff);
        let cubeData = [
            0, 0, 0, 255, 0, 0,
            1, 0, 0, 255, 0, 0,
            1, 1, 0, 255, 0, 0,
            0, 1, 0, 255, 0, 0,
            0, 0, 1, 0, 255, 0,
            1, 0, 1, 0, 255, 0,
            1, 1, 1, 0, 255, 0,
            0, 1, 1, 0, 255, 0,
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
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(playerPosAttrib);
        gl.vertexAttribPointer(playerPosAttrib, 3, gl.FLOAT, false, 6 * szFLOAT, 0);
        return {
            program: playerProgram,
            VAO: playerVAO,
            render: (projMat, viewMat) => {
                gl.useProgram(playerProgram);
                gl.bindVertexArray(playerVAO);
                let projLoc = gl.getUniformLocation(playerProgram, "projection");
                gl.uniformMatrix4fv(projLoc, false, projMat);
                let camLoc = gl.getUniformLocation(playerProgram, "camera");
                gl.uniformMatrix4fv(camLoc, false, viewMat);
                this.gameLogic.players.forEach(player => {
                    let modelMat = translate(...addVec3(player.pos, [.2, .2, .2]), identity());
                    modelMat = scale(0.6, 0.6, 0.6, modelMat);
                    let colorLoc = gl.getUniformLocation(playerProgram, "color");
                    gl.uniform3fv(colorLoc, player.color);
                    let modelLoc = gl.getUniformLocation(playerProgram, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);
                    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
                });
                if (this.gameLogic.cursorMode == "pawn") {
                    let modelMat = translate(...addVec3(this.gameLogic.getActivePlayer().pos, this.gameLogic.cursor.pos), identity());
                    let colorLoc = gl.getUniformLocation(playerProgram, "color");
                    gl.uniform3fv(colorLoc, [0, 0, 255]);
                    let modelLoc = gl.getUniformLocation(playerProgram, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);
                    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
                }
            }
        };
    }
    createFenceProgram() {
        const gl = this.gl;
        let vs = createShader(gl, gl.VERTEX_SHADER, vss);
        let fs = createShader(gl, gl.FRAGMENT_SHADER, fss);
        let fenceProgram = createProgram(gl, vs, fs);
        let fencePosAttrib = gl.getAttribLocation(fenceProgram, "a_position");
        let fenceVAO = gl.createVertexArray();
        gl.bindVertexArray(fenceVAO);
        let buff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buff);
        let fenceData = [
            0, 0, 0, 255, 0, 0,
            2, 0, 0, 255, 0, 0,
            2, 2, 0, 255, 0, 0,
            0, 0, 0, 255, 0, 0,
            0, 2, 0, 255, 0, 0,
            2, 2, 0, 255, 0, 0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fenceData), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(fencePosAttrib);
        gl.vertexAttribPointer(fencePosAttrib, 3, gl.FLOAT, false, 6 * szFLOAT, 0);
        return {
            program: fenceProgram,
            VAO: fenceVAO,
            render: (projMat, viewMat) => {
                gl.useProgram(fenceProgram);
                gl.bindVertexArray(fenceVAO);
                let projLoc = gl.getUniformLocation(fenceProgram, "projection");
                gl.uniformMatrix4fv(projLoc, false, projMat);
                let camLoc = gl.getUniformLocation(fenceProgram, "camera");
                gl.uniformMatrix4fv(camLoc, false, viewMat);
                let timeLoc = gl.getUniformLocation(fenceProgram, "u_time");
                gl.uniform1f(timeLoc, this.frameTiming.elapsed);
                this.gameLogic.fencePositions.forEach(fence => {
                    let modelMat = translate(...fence.pos, identity());
                    if (fence.flat)
                        modelMat = rotationYZ(3 * Math.PI / 2, modelMat);
                    if (fence.sideways)
                        modelMat = rotationXZ(Math.PI / 2, modelMat);
                    let modelLoc = gl.getUniformLocation(fenceProgram, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);
                    gl.drawArrays(gl.TRIANGLES, 0, fenceData.length / 6);
                });
                if (this.gameLogic.cursorMode == "fence") {
                    let modelMat = translate(...this.gameLogic.cursor.pos, identity());
                    if (this.gameLogic.cursor.flat)
                        modelMat = rotationYZ(3 * Math.PI / 2, modelMat);
                    else if (this.gameLogic.cursor.sideways)
                        modelMat = rotationXZ(Math.PI / 2, modelMat);
                    let modelLoc = gl.getUniformLocation(fenceProgram, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);
                    gl.drawArrays(gl.TRIANGLES, 0, fenceData.length / 6);
                }
            }
        };
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let clientSocket = new WebSocket("ws://localhost:8008", "gamerzone");
        clientSocket.onopen = () => {
            clientSocket.send("yeet");
        };
        const engine = new Engine();
        clientSocket.onmessage = (event) => {
            engine.handleServerPayload(JSON.parse(event.data));
        };
        engine.startRenderLoop();
    });
}
main();
//# sourceMappingURL=index.js.map