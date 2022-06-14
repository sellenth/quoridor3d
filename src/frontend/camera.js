import {crossProductVec3, subVec3, addVec3, scaleVec3, normalizeVec3, cos_d, sin_d, invertMat4} from "./math.js"

export class Camera {
    #frontVec = [0, 0, 1];
    #rightVec = [1, 0, 0];
    #upVec    = [0, 1, 0];
    #position = [5, 3, -5];
    #yaw = -89;
    #pitch = 0;
    #moveSpeed = 10;
    #mouseSens = 0.1;
    keysDown = {};
    firstLook = true;

    constructor()
    {
        this.updateVectors();
    }

    Move(deltaTime)
    {
        let velocity = this.#moveSpeed * deltaTime;
        if (this.keysDown.w)
        {
            this.#position = subVec3(this.#position, scaleVec3(this.#frontVec, velocity));
        }
        if (this.keysDown.s) {
            this.#position = addVec3(this.#position, scaleVec3(this.#frontVec, velocity));
        }
        if (this.keysDown.a) {
            this.#position = subVec3(this.#position, scaleVec3(this.#rightVec, velocity));
        }
        if (this.keysDown.d) {
            this.#position = addVec3(this.#position, scaleVec3(this.#rightVec, velocity));
        }
    }

    updateVectors()
    {
        let front = [0, 0, 0];
        front[0] = cos_d(this.#yaw) * cos_d(this.#pitch);
        front[1] = sin_d(this.#pitch);
        front[2] = sin_d(this.#yaw) * cos_d(this.#pitch);

        this.#frontVec = normalizeVec3(front);
        this.#rightVec = normalizeVec3(crossProductVec3( this.#frontVec, [0, 1, 0] ));
        this.#upVec = normalizeVec3(crossProductVec3( this.#rightVec, this.#frontVec ));

    }
    
    getCameraMatrix()
    {
        return [
            ...this.#rightVec, 0,
            ...this.#upVec,    0,
            ...this.#frontVec, 0,
            ...this.#position, 1
        ]
    }

    getViewMatrix()
    {
        return invertMat4(this.getCameraMatrix());
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

    configureCameraListeners(canvas)
    {

        canvas.addEventListener('keydown', e => {
            if (e.key == "w")
                this.keysDown.w = true;
            if (e.key == "a")
                this.keysDown.a = true;
            if (e.key == "s")
                this.keysDown.s = true;
            if (e.key == "d")
                this.keysDown.d = true;
        })

        canvas.addEventListener('keyup', e => {
            if (e.key == "w")
                this.keysDown.w = false;
            if (e.key == "a")
                this.keysDown.a = false;
            if (e.key == "s")
                this.keysDown.s = false;
            if (e.key == "d")
                this.keysDown.d = false;
        })

        canvas.addEventListener('click', e => {
            this.firstLook = true;
            canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
            canvas.requestPointerLock();
        })

        canvas.addEventListener('mousemove', e => {
            if (document.pointerLockElement === canvas) {
                if (this.firstLook) {
                    this.firstLook = false;
                    this.Look(0, 0);
                }
                else {
                    this.Look(e.movementX, e.movementY);
                }
            }
        })
    }
}