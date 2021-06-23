ExplorationCamera.MODE = {
    GROUNDED: 0,
    FLOATING: 1
};

function ExplorationCamera(canvas) {
    console.log('Loading Exploration Camera');
    this.canvas = canvas;
    this.mode = ExplorationCamera.MODE.GROUNDED;
    this.startingPosition = matrixHelper.vector3.from(0, 0, 0); // Common starting position variable
    this.position = this.startingPosition // Camera location
    this.direction = matrixHelper.vector3.from(0, 0, -1); // Start forward.
    this.up = matrixHelper.vector3.from(0, 1, 0);
    this.moveSpeed = 0.05; // Movement speed
    this.floatSpeed = 0.2; // Floating speed
    this.scrollSpeed = 0.3; // Yaw and Pitch sensitivity
    this.rotationalTransform = matrixHelper.matrix4.create();
    matrixHelper.matrix4.makeIdentity(this.rotationalTransform);

    this.active = false;
    this.pointerLockElement = null; // Element which owns the pointer lock
    this.requestPointerLock = null; // Locking pointer
    this.exitPointerLock = null;    // Unlocking pointer
    this.lookSpeed = 0.3;
    this.mouseMove = {  // Mouse movement stored here.
        x: 0,
        y: 0
    }

    this.initialize(); // Populate above
    this.getCollider = function (padding = 0) { return Collision.getRoomColliderBounds(padding, padding, this.position); }

    this.floatWidth = 100; // 
    this.floatBreadth = 100;
    this.groundedHeight = 1; // Height of grounded view.
    this.roamBounds = { // Min and max bounds for 
        min: [-this.floatWidth / 2, Geometry.DIMENSIONS.floorHeight, -this.floatBreadth / 2],
        max: [this.floatWidth / 2, 30, this.floatBreadth / 2],
    }
    this.controls = { // Camera movement
        left: false,
        right: false,
        forward: false,
        backward: false,
        up: false,
        down: false,
    };
    this.moveVectors = {  // Movement vectors
        left: [1, 0, 0],
        right: [-1, 0, 0],
        forward: [0, 0, 1],
        backward: [0, 0, -1],
        up: [0, 1, 0],
        down: [0, -1, 0]
    }

    this.updatePerspective(1);
}

/** Populate pointer lock components */
ExplorationCamera.prototype.initialize = function () {
    this.pointerLockElement = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;

    if (!this.pointerLockElement)
        throw (`Exploration mode unavailable - pointer lock not supported.  Suggested browsers: Edge / Chrome / Firefox.`);

    this.requestPointerLock = this.canvas.requestPointerLock ||
        this.canvas.mozRequestPointerLock ||
        this.canvas.webkitRequestPointerLock;

    /** Attempt to lock pointer when user clicks on canvas*/
    this.canvas.onclick = function () {
        this.requestPointerLock(); // This will fire the pointerLockChangeCallback.
    }

    globalThis = this; // Expose this publicly.

    console.log('Exploration: Binding pointerLock listeners');
    // Hook pointer lock state change events
    document.addEventListener('pointerlockchange', pointerLockChangeCallback, false);
    document.addEventListener('mozpointerlockchange', pointerLockChangeCallback, false);
    document.addEventListener('webkitpointerlockchange', pointerLockChangeCallback, false);

    // Error handling
    document.pointerlockerror = pointerLockErrorCallback.bind(this);
    document.mozpointerlockerror = pointerLockErrorCallback.bind(this);
    document.webkitpointerlockerror = pointerLockErrorCallback.bind(this);
}

/** When canvas is clicked or escape is pressed this will fire */
function pointerLockChangeCallback() {
    console.log("Pointer Lock Change event!");
    // If we have canvas access, we listen to mouse moves
    if (document.pointerLockElement === globalThis.canvas) {
        console.log('Pointer locked');
        globalThis.canvas.addEventListener("mousemove", mouseMovedCallback, false);
        console.log('Exploration: Binding key listeners');
        document.onkeydown = ExplorationCamera.keyDownHandler.bind(globalThis);
        document.onkeyup = ExplorationCamera.keyUpHandler.bind(globalThis);
        globalThis.active = true;
    } else {
        console.log('Pointer unlocked');
        globalThis.canvas.removeEventListener("mousemove", mouseMovedCallback, false);
        console.log('Exploration: Binding key listeners');
        document.onkeydown = null;
        document.onkeyup = null;
        globalThis.active = false;
    }
}

/** Acquire mouse movement */
function mouseMovedCallback(e) {
    globalThis.mouseMove.x = e.movementX ||
        e.mozMovementX ||
        e.webkitMovementX ||
        0;
    globalThis.mouseMove.y = e.movementY ||
        e.mozMovementY ||
        e.webkitMovementY ||
        0;
}

function pointerLockErrorCallback() {
    console.warn('Error from pointer lock.  Please debug for more info.');
}

// Reference must be made to instanced object (from script.js) as `camera`
ExplorationCamera.keyDownHandler = function (e) {
    e.preventDefault();
    switch (e.key.toLowerCase()) {
        case 'a': // left
            this.controls.left = true;
            break;
        case 'w': // up
            this.controls.forward = true;
            break;
        case 'd': // right
            this.controls.right = true;
            break;
        case 's': // down
            this.controls.backward = true;
            break;
    }
    if (e.which == 16) // shift
        this.controls.down = true;
    else if (e.which == 32) // space
        this.controls.up = true;
}

// Reference must be made to instanced object (from script.js) as `camera`
ExplorationCamera.keyUpHandler = function (e) {
    e.preventDefault();
    switch (e.key.toLowerCase()) {
        case 'a': // left
            this.controls.left = false;
            break;
        case 'w': // front
            this.controls.forward = false;
            break;
        case 'd': // right
            this.controls.right = false;
            break;
        case 's': // back
            this.controls.backward = false;
            break;
    }
    if (e.which == 16) // shift
        this.controls.down = false;
    else if (e.which == 32) // space
        this.controls.up = false;
}

/* Updates position of camera based on speed and delta time */
ExplorationCamera.prototype.update = function () {
    const pos_adjustment = matrixHelper.vector3.from(0, 0, 0),
        forward = matrixHelper.vector3.from(0, 0, 0),
        strafe = matrixHelper.vector3.from(0, 0, 0),
        strafeNeg = matrixHelper.vector3.from(0, 0, 0),
        upNeg = matrixHelper.vector3.from(0, 0, 0);

    const backward = matrixHelper.vector3.clone(this.direction);
    matrixHelper.vector3.neg(forward, backward);
    matrixHelper.vector3.cross(strafe, forward, this.up);
    matrixHelper.vector3.neg(strafeNeg, strafe);
    matrixHelper.vector3.neg(upNeg, this.up);

    if (this.controls.left)
        matrixHelper.vector3.add(pos_adjustment, pos_adjustment, strafeNeg);
    if (this.controls.right)
        matrixHelper.vector3.add(pos_adjustment, pos_adjustment, strafe);
    if (this.controls.forward)
        matrixHelper.vector3.add(pos_adjustment, pos_adjustment, forward);
    if (this.controls.backward)
        matrixHelper.vector3.add(pos_adjustment, pos_adjustment, backward);
    if (this.controls.up)
        matrixHelper.vector3.add(pos_adjustment, pos_adjustment, this.up);
    if (this.controls.down)
        matrixHelper.vector3.add(pos_adjustment, pos_adjustment, upNeg);

    // If any change, normalize, multiply by speed and apply positional change.
    if (matrixHelper.vector3.lengthSquared(pos_adjustment) > Number.EPSILON) {
        const savedPosition = matrixHelper.vector3.clone(this.position);
        matrixHelper.vector3.normalise(pos_adjustment, pos_adjustment); // Normalized Direction
        if (cameraType === CAM_TYPES.EXPLORE)
            matrixHelper.vector3.mult(pos_adjustment, pos_adjustment, this.moveSpeed);
        else
            matrixHelper.vector3.mult(pos_adjustment, pos_adjustment, this.floatSpeed);
        matrixHelper.vector3.add(this.position, this.position, pos_adjustment);

        try {
            if (map.root !== null && (cameraType === CAM_TYPES.EXPLORE && !this.correctForExploreCollision())
                || (cameraType === CAM_TYPES.ROAM && !this.correctForRoamCollision())) {
                if (cameraType === CAM_TYPES.EXPLORE && this.correctForExploreCollision() === null)
                    this.position = matrixHelper.vector3.from(0, this.groundedHeight, 0);
                else
                    matrixHelper.vector3.to(this.position, savedPosition); // Reset if failed collision.
            }
        } catch (err) {
            // We're in an invalid location.  Reset position to start.
            this.position = matrixHelper.vector3.clone(this.startingPosition);
        }
    }

    if (cameraType === CAM_TYPES.EXPLORE)
        this.position[1] = this.groundedHeight;

    // Mouse movement
    // console.log(`Mouse: ${this.mouseMove.x} ; ${this.mouseMove.y}`);
    matrixHelper.matrix4.makeRotationY(globalThis.rotationalTransform, - Math.radians(this.mouseMove.x) * this.scrollSpeed);
    matrixHelper.matrix4.multiplyVector(this.direction, globalThis.rotationalTransform, this.direction);

    matrixHelper.matrix4.makeIdentity(globalThis.rotationalTransform);
    matrixHelper.matrix4.makeRotationAny(globalThis.rotationalTransform, strafe, - Math.radians(this.mouseMove.y) * this.scrollSpeed);
    matrixHelper.matrix4.multiplyVector(this.direction, globalThis.rotationalTransform, this.direction);


    scene.lookTo(this.position, this.direction, this.up); // Camera
    // matrixHelper.matrix4.makeIdentity(globalThis.rotationalTransform);
    this.mouseMove.x = 0; this.mouseMove.y = 0;
}

/** Update perspective changes for view volume or FOV. */
ExplorationCamera.prototype.updatePerspective = function (fov) {
    console.log('Setting Perspective View Volume');
    scene.setViewPerspective(0.1, 100, fov);
}

ExplorationCamera.prototype.correctForRoamCollision = function () {
    return this.position[0] > this.roamBounds.min[0] && this.position[0] < this.roamBounds.max[0] &&
        this.position[1] > this.roamBounds.min[1] && this.position[1] < this.roamBounds.max[1] &&
        this.position[2] > this.roamBounds.min[2] && this.position[2] < this.roamBounds.max[2];
}

/** Corrects camera position to account for correct pathing. */
ExplorationCamera.prototype.correctForExploreCollision = function () {
    const room = this.getClosestRoom();

    if (!room) {
        return null; // We're outside room max range.
    }
    // If we're in room, check we're not walking into objects, otherwise safe.
    if (this.isInRoom(room)) {
        const collidedObject = Collision.getCollisionObjectFromRoom(this.getCollider(0.1), room);
        if (collidedObject) return false;
        return true;
    }

    // If not in room, check if we're passing through a doorway
    if (!this.isInDoorwayGetRoom())
        return false;

    return true;
}

/** Returns the room if camera position is within a given roomBounds */
ExplorationCamera.prototype.getClosestRoom = function (padding = 0.1, maxRange = 5) {
    let bestRoom = false;
    let minDistance = maxRange;
    // Get closest room
    for (const room of map.getRooms()) {
        if (this.isInRoom(room)) return room;
        const newDistance = matrixHelper.vector3.distance(this.position, room.position);
        if (minDistance > newDistance) {
            bestRoom = room;
            minDistance = newDistance;
        }
    }
    return bestRoom;
}

ExplorationCamera.prototype.isInRoom = function (room, margin = 0.1) {
    const roomBounds = room.getRoomBounds();
    const inBounds = roomBounds.min[0] + margin < this.position[0] &&
        roomBounds.max[0] - margin > this.position[0] &&
        // roomBounds.min[1] + margin < this.position[1] && // skipping ycheck 
        // roomBounds.max[1] - margin > this.position[1] &&
        roomBounds.min[2] + margin < this.position[2] &&
        roomBounds.max[2] - margin > this.position[2];

    return inBounds;
}

ExplorationCamera.prototype.isInDoorwayGetRoom = function () {
    for (const room of map.getRooms()) {

        // Not in bounds, are we going through a doorway?
        const doorways = room.getDoorwayColliders();
        for (const door of doorways) {
            if (Collision.getColliderOverlap(this.getCollider(0.1), door))
                return room;
        }
    }

    return false;
}