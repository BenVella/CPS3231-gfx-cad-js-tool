var collision = new Collision();

function Collision() {
    /** Contains keys indicating roomIds and values split with another dictionary of x y and z, with min and max for each.
     * colliderList = { room1 : { x: {min: null, max: null}, y: {min: null, max: null}, z: {min: null, max: null}}, room2 : { ... }, room3 : {} }
     **/
    this.roomColliderList = {};
}

/** 
 * When an object model is passed, the limits of x, y and z 
 * are constructed with minimum and maximum values.
 * The result will be an Axis Aligned Bounding Box which 
 * will likely over-estimate the collider bounds.
 **/
Collision.getLocalObjectColliderBounds = function (objectModel) {
    const vertices = objectModel.getPositionVertices();
    const data = {
        x: { min: vertices[0], max: vertices[0] },
        y: { min: vertices[1], max: vertices[1] },
        z: { min: vertices[2], max: vertices[2] }
    };

    for (let i = 0; i < vertices.length; i++) {
        const vertex = vertices[i];

        if (i % 3 == 0) { // x
            if (data.x.min > vertex) data.x.min = vertex;
            else if (data.x.max < vertex) data.x.max = vertex;
        } else if (i % 3 == 1) { // y
            if (data.y.min > vertex) data.y.min = vertex;
            else if (data.y.max < vertex) data.y.max = vertex;
        } else if (i % 3 == 2) { // z
            if (data.z.min > vertex) data.z.min = vertex;
            else if (data.z.max < vertex) data.z.max = vertex;
        }
    }

    return data;
}

/** Returns a collider with offset values.  
 * Useful when testing objects placed relative to a room. */
Collision.getOffsetObjectCollider = function (collider, offset) {
    const result = { x: null, y: null, z: null };
    result.x = { min: collider.x.min + offset[0], max: collider.x.max + offset[0] };
    result.y = { min: collider.y.min + offset[1], max: collider.y.max + offset[1] };
    result.z = { min: collider.z.min + offset[2], max: collider.z.max + offset[2] };

    return result;
}

/** Given room dimensions and position a collider is created in absolute space **/
Collision.getRoomColliderBounds = function (width, breadth, position) {
    const data = { x: { min: null, max: null }, y: { min: null, max: null }, z: { min: null, max: null } };
    const halfWidth = width / 2;
    const halfBreadth = breadth / 2;
    data.x.min = position[0] - halfWidth;
    data.x.max = position[0] + halfWidth;
    data.y.min = -Geometry.DIMENSIONS.floorHeight; // Floor cuboid inset downwards
    data.y.max = Geometry.DIMENSIONS.roomHeight;
    data.z.min = position[2] - halfBreadth;
    data.z.max = position[2] + halfBreadth;

    return data;
}

/** Returns whether or not a given position is colliding with a door opening */
Collision.collidingWithDoorwayOpening = function (room, position, padding = 0.1) {
    const doorColliders = Collision.getDoorColliders(room);
}

/** Returns a list of colliders for each doorway present in a room */
Collision.getDoorColliders = function (room) {
    for (const direction in room.getDoorWalls()) {
        Geometry.getDoorwaySpace(room.walls[direction])
    }
}

/**
 * Adds or updates an existing collider for the given room.
 * @param {Object} room room to have a collider generated and included in list
 */
Collision.prototype.addRoomColliderBounds = function (room) {
    const data = { x: { min: null, max: null }, y: { min: null, max: null }, z: { min: null, max: null } };
    const roomHalfWidth = room.width / 2;
    const roomHalfBreadth = room.breadth / 2;
    data.x.min = room.position[0] - roomHalfWidth;
    data.x.max = room.position[0] + roomHalfWidth;
    data.y.min = -Geometry.DIMENSIONS.floorHeight; // Floor cuboid inset downwards
    data.y.max = Geometry.DIMENSIONS.roomHeight;
    data.z.min = room.position[2] - roomHalfBreadth;
    data.z.max = room.position[2] + roomHalfBreadth;

    this.roomColliderList[room.id] = data;
    return data;
}

/**
 * Takes two 2d objects and compares for overlap, returning overlapping square coordinates, null if no overlap.
 * Reference: https://stackoverflow.com/questions/5556170/finding-shared-volume-of-two-overlapping-cuboids
 **/
Collision.getColliderOverlap = function (collider1, collider2) {
    if (collider1.x.min > collider2.x.max) return false;
    if (collider1.y.min > collider2.y.max) return false;
    if (collider1.z.min > collider2.z.max) return false;

    // We have a potential overlap
    const overlap = { x: { min: null, max: null }, y: { min: null, max: null }, z: { min: null, max: null } };
    overlap.x.min = Math.max(collider1.x.min, collider2.x.min);
    overlap.x.max = Math.min(collider1.x.max, collider2.x.max);
    if (overlap.x.min >= overlap.x.max) return false;

    overlap.y.min = Math.max(collider1.y.min, collider2.y.min);
    overlap.y.max = Math.min(collider1.y.max, collider2.y.max);
    if (overlap.y.min >= overlap.y.max) return false;

    overlap.z.min = Math.max(collider1.z.min, collider2.z.min);
    overlap.z.max = Math.min(collider1.z.max, collider2.z.max);
    if (overlap.z.min >= overlap.z.max) return false;

    return overlap;
}

/** 
 * Given an overlap dictionary returns a vector 3 translation adjustment
 * which negates the overlap passed.
 * @param {Dictionary} overlap An overlap dictionary in the form of
 *  { x: {min: int, max: int}, y: ...}
 * @param {Int32Array} directionOfCandidate A direction of the candidate
 * attempting the collision test.  The suggested adjustment will be in the
 * direction of this candidate instead of the static collider we overlapped against
 * @returns {Int32Array} 3D array of adjustment for x, y and z.
 */
Collision.getOverlapAdjustment = function (overlap, directionOfCandidate, padding = 0) {
    const adjustment = [0, 0, 0];
    if (directionOfCandidate[0] !== 0) { // Only adjust this direction if we can move relative to it
        adjustment[0] = Collision.getAxisDifference(overlap.x, padding) * directionOfCandidate[0];
    }
    if (directionOfCandidate.length === 2) {
        /** We're skipping Y axis since only two dimensional direction given */
        if (directionOfCandidate[1] !== 0) {
            adjustment[2] = Collision.getAxisDifference(overlap.z, padding) * directionOfCandidate[1];
        }
        return adjustment;
    }
    // 3D candidate.
    if (directionOfCandidate[1] !== 0) {
        adjustment[1] = Collision.getAxisDifference(overlap.y, padding) * directionOfCandidate[1];
    }
    if (directionOfCandidate[2] !== 0) {
        adjustment[2] = Collision.getAxisDifference(overlap.z, padding) * directionOfCandidate[2];
    }
    return adjustment;
}

/** Returns an adjustment along multiple axis, which would push the given collider out from all overlapping axis */
Collision.getColliderAdjustment = function (overlap, collider, padding = 0) {
    const overlapX = Collision.getAxisDifference(overlap.x, padding);
    const overlapY = Collision.getAxisDifference(overlap.y, padding);
    const overlapZ = Collision.getAxisDifference(overlap.z, padding);

    const adjustment = [0, 0, 0];
    if (overlap.x.min === collider.x.min) // We're moving east - right handed axis means this east grows smaller
        adjustment[0] = overlapX * RoomObject.DIRECTIONS.east[0];
    else adjustment[0] = overlapX * RoomObject.DIRECTIONS.west[0];

    if (overlap.y.min === collider.y.min) // We're moving down
        adjustment[1] = overlapY * RoomObject.DIRECTIONS.down[1];
    else adjustment[1] = overlapY * RoomObject.DIRECTIONS.up[1];

    if (overlap.z.min === collider.z.min) // We're moving south
        adjustment[2] = overlapZ * RoomObject.DIRECTIONS.south[2];
    else adjustment[2] = overlapZ * RoomObject.DIRECTIONS.north[2];

    return adjustment;
}

/** This function is designed to give adjustment vector for passed collider
 * to completely exit the collided object.
 * @param {Vector3} overlap minimum and maximum bounds for coordinates of overlap
 * @param {Vector3} collider minimum and maximum bounds of collider trying to reposition itself
 * @param {Vector3} collided min and maximum bounds of collided object
 * @param {int} padding an additional padding distance to separate objects from each other.
 */
Collision.getGroundColliderAdjustmentToEscapeCollidedObject = function (overlap, collider, collided, padding = 0) {
    const centerCollider = Collision.getColliderCenter(collider);
    const centerCollided = Collision.getColliderCenter(collided);

    const modifierVec = matrixHelper.vector3.create();
    // Subtract collided from collider to get general direction
    matrixHelper.vector3.sub(modifierVec, centerCollider, centerCollided);
    // If both centers are over each other, get direction to origin
    if (matrixHelper.vector3.lengthSquared(modifierVec) === 0) {
        matrixHelper.vector3.sub(modifierVec, matrixHelper.vector3.zero, modifierVec);
        // If are both overlapping centers and at origin of room, set direction to identity vector.
        if (matrixHelper.vector3.lengthSquared(modifierVec) === 0)
            matrixHelper.vector3.to(modifierVec, matrixHelper.vector3.one);
    }

    matrixHelper.vector3.normalise(modifierVec, modifierVec);

    return [
        Collision.getAxisDifference(overlap.x, padding) * modifierVec[0],
        Collision.getAxisDifference(overlap.y, padding) * modifierVec[1],
        Collision.getAxisDifference(overlap.z, padding) * modifierVec[2],
    ];
}

/** Returns the center point as a vector 3 of a given collider */
Collision.getColliderCenter = function (collider) {
    return [
        collider.x.min + ((collider.x.max - collider.x.min) / 2),
        collider.y.min + ((collider.y.max - collider.y.min) / 2),
        collider.z.min + ((collider.z.max - collider.z.min) / 2),
    ]
}

/** Returns difference between max and min and optionally a padded value. */
Collision.getAxisDifference = function (axis, padding) {
    return Math.abs(Math.abs(axis.max) - Math.abs(axis.min)) + padding;
}

/** Checks if a given collider is overlapping with other rooms in the map.
 * Returns true if collision is found, false otherwise. 
 * @param {int} withoutId Optional.  If given, this id will be ignored from the collider list.
 **/
Collision.prototype.colliderOverlapsWithMap = function (collider, withoutId = null) {
    if (Object.keys(this.roomColliderList).length === 0)
        return false;

    for (const collisionRoomId in this.roomColliderList) {
        if (withoutId !== null && collisionRoomId == withoutId) { continue; }
        if (Collision.getColliderOverlap(collider, this.roomColliderList[collisionRoomId]) !== false)
            return Collision.getColliderOverlap(collider, this.roomColliderList[collisionRoomId]);
    }

    return false;
}

/** Verify the given collider is within the room's bounds. */
Collision.colliderFitsRoomBounds = function (collider, room) {
    const roomBounds = room.getRoomBounds();
    collider = Collision.getOffsetObjectCollider(collider, room.position);

    return (
        collider.x.min >= roomBounds.min[0] && collider.x.max <= roomBounds.max[0] &&
        collider.y.min >= roomBounds.min[1] && collider.y.max <= roomBounds.max[1] &&
        collider.z.min >= roomBounds.min[2] && collider.z.max <= roomBounds.max[2]
    );
}

/** Returns an adjustment value to make sure the object sits on the ground
 * Optionally, the ground may be specified to be higher or lower than the default of zero, such as when placing an object onto another.
 */
Collision.returnGroundAdjustment = function (collider, groundVal = 0) {
    let diff = (collider.y.min - groundVal) * -1;
    if (diff > 0) diff = Math.max(0.0001 , diff);
    else if (diff <0) diff = Math.min(-0.0001, diff);
    return [0, diff, 0];
}

/** Returns an adjustment Vector3 to set the object nearest to the closest wall. */
Collision.returnInitialWallAdjustment = function (collider, room) {
    const avgX = (collider.x.min + collider.x.max) / 2;
    const avgY = (collider.y.min + collider.y.max) / 2;
    const avgZ = (collider.z.min + collider.z.max) / 2;

    const lowestHeight = Geometry.DIMENSIONS.roomHeight / Geometry.DIMENSIONS.doorwayHeightDivider;
    const highestHeight = Geometry.DIMENSIONS.roomHeight - 0.3;

    let yOff = Math.min(highestHeight,Math.max(lowestHeight, collider.y.min));

    if (avgX > avgZ)    // X Dominates.
        if (avgX >= 0)  // To west wall
            return [room.width / 2 - collider.x.max, yOff, 0];
        else
            return [-(room.width / 2 - collider.x.min), yOff, 0];
    else                // Z dominates
        if (avgX >= 0)  // To north wall
            return [0, yOff, room.breadth / 2 - collider.z.max];
        else
            return [0, yOff, -(room.breadth / 2 - collider.z.min)];
}

/** Returns an adjustment value to make sure the object hangs off the ceiling */
Collision.returnCeilingAdjustment = function (collider) {
    return [0,(collider.y.max - Geometry.DIMENSIONS.roomHeight) * -1,0];
}

/** Checks if a given room is overlapping with other rooms in the map.
 * Returns true if collision is found, false otherwise. 
 * @deprecated Detecting that a room overlaps with a map means it's
 * already been created in place and it's too late! use colliderOverlapsWithMap()
 **/
Collision.prototype.roomOverlapsWithMap = function (room) {
    if (Object.keys(this.roomColliderList).length === 0)
        return false;

    let roomCollider = this.roomColliderList[room.id];
    if (roomCollider === undefined)
        roomCollider = this.addRoomColliderBounds(room);

    for (const collisionRoomId in this.roomColliderList) {
        if (collisionRoomId != room.id && Collision.getColliderOverlap(roomCollider, this.roomColliderList[collisionRoomId]) !== false)
            return true;
    }

    return false;
}


/** Given a collider and a room, returns the first object in room 
 * we collide against. Otherwise false. */
Collision.getCollisionObjectFromRoom = function (collider, room, skipId = 0) {
    for (const objKey in room.objectList) {
        if (room.objectList[objKey].id === skipId) continue; // Skip a given id
        const overlap = Collision.getColliderOverlap(collider, room.objectList[objKey].getCollider());

        // If we hit, return the object we hit against.  Otherwise false.
        if (overlap)
            return room.objectList[objKey];
    }
    return false;
}

/** Returns room collider is in */
Collision.prototype.getCameraLocationRoomId = function (collider) {
    for (const collisionRoomId in this.roomColliderList) {
        if (Collision.getColliderOverlap(collider, this.roomColliderList[collisionRoomId]) !== false)
            return collisionRoomId;
    }

    return false; // Out of map
}