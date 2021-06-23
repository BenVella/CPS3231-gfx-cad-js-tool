function Map() {
    this.root = null;
    this.roomList = [];
    this.roomCount = 0;
}

Map.DIRECTION = {
    north: [0, 1],
    east: [-1, 0],
    south: [0, -1],
    west: [1, 0]
};

Map.directionToString = function (directionKey) {
    if (directionKey === 'north' || directionKey === 'south' || directionKey === 'west' || directionKey === 'east')
        return directionKey;
    else
        return undefined;
}

function matchDirs(first, second) {
    return (first[0] === second[0]) && (first[1] === second[1]);
};

function addDirs(first, second) {
    return [first[0] + second[0], first[1] + second[1]];
};

function subDirs(first, second) {
    return [first[0] - second[0], first[1] - second[1]];
};

function getOppositeDirection(direction) {
    if (matchDirs(direction, Map.DIRECTION.north)) {
        return Map.DIRECTION.south;
    }
    else if (matchDirs(direction, Map.DIRECTION.east)) {
        return Map.DIRECTION.west;
    }
    else if (matchDirs(direction, Map.DIRECTION.south)) {
        return Map.DIRECTION.north;
    }
    else if (matchDirs(direction, Map.DIRECTION.west)) {
        return Map.DIRECTION.east;
    }

    throw ('Invalid direction given');
}

Map.prototype.isEmpty = function () {
    return this.root === null;
}

Map.prototype.getRoomById = function (id) {
    for (let i = 0; i < this.roomList.length; i++) {
        const room = this.roomList[i];
        if (room.id === Number(id))
            return room;
    }

    return null;
}

/** Returns all rooms */
Map.prototype.getRooms = function () {
    return this.roomList;
}

/**  Returns a list of rooms which are neighbours but not connected */
Map.prototype.getDisjointNeighbours = function () {
    let result = [];

    for (const room of this.roomList) {
        const neighbours = room.getNeighbours();

        // A single neighbour will definitely have a door
        if (neighbours.length > 1) {
            for (const direction in room.wallsType) {
                if (room.wallsType[direction] === Room.WALL_TYPE.SOLID &&
                    room.neighbours[direction] !== null) {
                    result.push(room);
                    break;
                }
            }
        }
    }

    return result;
}

Map.prototype.getRoomsSolidWallsNoNeighbours = function () {
    const roomsNotFull = this.getRoomsNotFull();
    const noNeighboursResult = [];

    for (const room of roomsNotFull) {
        if (room.getSolidWalls(false).length > 0) { // without neighbours
            noNeighboursResult.push(room);
        }
    }

    return noNeighboursResult;
}

/**  Returns a list of rooms which are not full, and have open spaces */
Map.prototype.getRoomsNotFull = function () {
    let result = [];

    for (const room of this.roomList) {
        if (!room.isFull)
            result.push(room);
    }

    return result;
}

/** Returns a list of rooms which have an available plot to create a new room in
 * @param {int} withoutId Optional.  Does not return a given room id if found in list.
 */
Map.prototype.availableAnchorRooms = function (withoutId = null) {
    let result = [];

    for (let i = 0; i < this.roomList.length; i++) {
        const room = this.roomList[i];
        if (!room.isFull && (withoutId === null || room.id !== withoutId))
            result.push(room);
    }

    return result;
};

/** Returns an array of tuples.  Each tuple contains the relative position and room object */
Map.prototype.getRoomRelativePlots = function (room, modifier = [0, 0]) {
    let result = [];
    if (room.neighbours.north !== null) {
        let direction = addDirs(Map.DIRECTION.north, modifier);
        result.push([direction, room.neighbours.north]);
    }
    if (room.neighbours.east !== null) {
        let direction = addDirs(Map.DIRECTION.east, modifier);
        result.push([direction, room.neighbours.east]);
    }
    if (room.neighbours.south !== null) {
        let direction = addDirs(Map.DIRECTION.south, modifier);
        result.push([direction, room.neighbours.south]);
    }
    if (room.neighbours.west !== null) {
        let direction = addDirs(Map.DIRECTION.west, modifier);
        result.push([direction, room.neighbours.west]);
    }
    return result;
};

Map.prototype.getNewRoomPosition = function (anchor, newWidth, newBreadth, direction) {
    // north of anchor, return anchor's breadth
    let newPosition = matrixHelper.vector3.from(matrixHelper.vector3.zero);

    // TODO - FIX A BUG IN MINUTE POSITIONS
    if (matchDirs(direction, Map.DIRECTION.north)) {
        let newOffset = (anchor.breadth / 2) + (newBreadth / 2) + (Geometry.DIMENSIONS.wallThickness * 2);
        matrixHelper.vector3.add(newPosition, anchor.position, [0, 0, newOffset]) // Add
        return newPosition;
    } // East of anchor, return anchor's width
    else if (matchDirs(direction, Map.DIRECTION.west)) {
        let newOffset = (anchor.width / 2) + (newWidth / 2) + (Geometry.DIMENSIONS.wallThickness * 2);
        matrixHelper.vector3.add(newPosition, anchor.position, [newOffset, 0, 0]) // Add
        return newPosition;
    } // South, we subtract our breadth from anchor's position
    else if (matchDirs(direction, Map.DIRECTION.south)) {
        let newOffset = (anchor.breadth / 2) + (newBreadth / 2) + (Geometry.DIMENSIONS.wallThickness * 2);
        matrixHelper.vector3.sub(newPosition, anchor.position, [0, 0, newOffset])  // Subtract
        return newPosition;
    }// West, we subtract our with from anchor's position
    else if (matchDirs(direction, Map.DIRECTION.east)) {
        let newOffset = (anchor.width / 2) + (newWidth / 2) + (Geometry.DIMENSIONS.wallThickness * 2);
        matrixHelper.vector3.sub(newPosition, anchor.position, [newOffset, 0, 0]) // Subtract
        return newPosition;
    } else {
        console.error('Matched a potential neighbour but no valid directional match available');
    }
};

/** Given a first room, a second room and the position of the second relative to the first 
 * we make both neighbours of each other.
 * 
 * @param {int} doorSize Defaults to null and is ignored.  Otherwise both rooms are amended
 * to consider a doorway in place and trigger a rebuild for both. 
 * */
Map.prototype.makeNeighbours = function (primary, secondary, direction, doorSize = null) {
    const tags = Map.getDirectionalTags(direction);

    primary.neighbours[tags.primary] = secondary;
    secondary.neighbours[tags.secondary] = primary;

    if (doorSize !== null) {
        primary.wallsType[tags.primary] = Room.WALL_TYPE.DOOR;
        primary.openingSize[tags.primary] = doorSize;
        secondary.wallsType[tags.secondary] = Room.WALL_TYPE.DOOR;
        secondary.openingSize[tags.secondary] = doorSize;
        // Rebuild both rooms due to geometric changes.
        primary.build();
        secondary.build();
    }

    if (primary.getFreePlotsLength() === 0)
        primary.isFull = true;
    if (secondary.getFreePlotsLength() === 0)
        secondary.isFull = true;
}

/** Remove neighbours from room.  Ensures these can be removed before doing so */
Map.prototype.removeNeighbours = function (room) {
    if (!room.canBeMoved()) throw ('Cannot remove all neighbours from room since it cannot be moved!');

    for (const direction of room.getNeighbourDirections()) {
        const dirTags = Map.getDirectionalTags(Map.DIRECTION[direction]);
        room.neighbours[direction].neighbours[dirTags.secondary] = null;
        room.neighbours[direction].wallsType[dirTags.secondary] = Room.WALL_TYPE.SOLID;
        room.neighbours[direction].openingSize[dirTags.secondary] = null;
        room.neighbours[direction].build();
        room.neighbours[dirTags.primary] = null;
        room.wallsType[dirTags.primary] = Room.WALL_TYPE.SOLID;
        room.openingSize[dirTags.primary] = null;
        room.build();
    }
}

/**
 * Returns a dictionary of { width : Num, breadth : Num } of clamped values.  Null if no restrictions are in place.
 * @param {Room} room 
 * @param {Map.DIRECTION} wall 
 */
Map.prototype.getClampedFloorDimensions = function (room, wall) {
    const result = { width: null, breadth: null };

    wallDirection = Map.DIRECTION[wall];
    // 1 Check own room clamping in chosen direction
    if (matchDirs(wallDirection, Map.DIRECTION.north) || matchDirs(wallDirection, Map.DIRECTION.south))
        result.width = room.width;
    else
        result.breadth = room.breadth;

    // It takes at least 3 rooms present to cause 2 dimensional clamping (rooms in L shape)
    if (this.roomList.length < 3) { return result; }

    // Look for clamping by immediate neighbours.  New target location is at [0,0]
    const queue = this.getRoomRelativePlots(room, getOppositeDirection(wallDirection));

    const visitedIds = [];
    visitedIds.push(room.id);
    while (queue.length > 0) {
        const visiting = queue.shift();

        const visitorPos = visiting[0];
        const visitorRoom = visiting[1];

        // If relative sums up to 1 it's a cardinal neighbour - we check clamping and exit if both directions clamped
        if (Math.abs(visitorPos[0]) + Math.abs(visitorPos[1]) === 1) {
            // Only bother checking clamping  for the remaining direction
            if (result.width === null &&
                (matchDirs(Map.DIRECTION.north, visitorPos) || matchDirs(Map.DIRECTION.south, visitorPos))) { // check breadth
                result.width = visitorRoom.width;
                return result;
            } else if (matchDirs(Map.DIRECTION.west, visitorPos) || matchDirs(Map.DIRECTION.east, visitorPos)) {
                result.breadth = visitorRoom.breadth;
                return result;
            }
        }

        // Add visitor's ID to visited nodes
        visitedIds.push(visitorRoom.id);

        // Get visitor's neighbours to see if they need to be added
        const visitorNeighbours = this.getRoomRelativePlots(visitorRoom, visitorPos);
        // todo - Does the below need to changed from a for of to something else?
        for (entry of visitorNeighbours) {
            // Only add entries we haven't visited yet
            if (!visitedIds.includes(entry[1].id))
                queue.push(entry);
        }
    }
    return result;
};

//--------------------------------------------------------------------------------------------------------//
/** Create a new room in the map.
 * Traverses list of existing rooms to locate any new neighbours and update them of its presence.
 * It updates itself of other located neighbours.  Initial anchor room given will have a doorway constructed.
 **/
Map.prototype.addRoom = function (name, width, breadth, materialsList, wall = null, anchorRoomId = null, doorsize = 0.5) {
    this.roomCount += 1;

    //--------------------------------------------------------------------------------------------------------//
    // FIRST Room
    //--------------------------------------------------------------------------------------------------------//
    if (this.roomList.length === 0) {
        let position = matrixHelper.vector3.from(0, 0, 0);
        const newRoom = new Room(this.roomCount, name, width, breadth, materialsList, position);
        newRoom.isMain = true;

        this.roomList.push(newRoom);
        this.root = newRoom;

        /** Create another room below it to act as entrance.  Grass floor no walls or ceilings */
        let entranceMaterial = {
            floor: 'grass', ceiling: null, walls: {
                north: materialsList.walls.south, east: materialsList.walls.south,
                south: materialsList.walls.south, west: materialsList.walls.south
            }
        };
        this.addRoom('mainEntrance',
            newRoom.width,
            newRoom.breadth,
            entranceMaterial, 'south', newRoom.id);

        collision.addRoomColliderBounds(newRoom);
        newRoom.build();
        return newRoom;
    }

    //--------------------------------------------------------------------------------------------------------//
    // Additional Rooms
    //--------------------------------------------------------------------------------------------------------//
    if (width < 1 || width > 10 || breadth < 1 || breadth > 10)
        throw ('Width and breadth should be clamped between 1 and 10.');

    const anchor = this.getRoomById(anchorRoomId);
    if (anchor === null)
        throw ('Anchor room could not be located within map.  Id:' + anchorRoomId);

    let direction = Map.DIRECTION[wall];

    //--------------------------------------------------------------------------------------------------------//
    // Search Map for Neighbours
    //--------------------------------------------------------------------------------------------------------//

    let position = this.getNewRoomPosition(anchor, width, breadth, direction);
    const newColliderBounds = Collision.getRoomColliderBounds(width, breadth, position);

    if (collision.colliderOverlapsWithMap(newColliderBounds)) {
        this.roomCount -= 1;
        throw ('Room creation overlaps with existing area in map');
    }

    const newRoom = new Room(this.roomCount, name, width, breadth, materialsList, position);

    // If map not empty, we search for any neighbours by traversing room list.
    const queue = this.getRoomRelativePlots(anchor, getOppositeDirection(direction));

    // We make them neighbours after enqueuing children to avoid including ourselves.
    // We reverse direction to get point of view of new room and set as relative.
    this.makeNeighbours(anchor, newRoom, direction, doorsize);

    const visitedIds = [];
    visitedIds.push(anchor.id);
    while (queue.length > 0) {
        // Slow operation by default - behaves like queue.pop() in other languages
        const visiting = queue.shift();

        const visitorPos = visiting[0];
        const visitorRoom = visiting[1];

        // Add visitor's ID to visited nodes
        visitedIds.push(visitorRoom.id);

        // Get visitor's neighbours to see if they need to be added
        const visitorNeighbours = this.getRoomRelativePlots(visitorRoom, visitorPos);
        // todo - Does the below need to changed from a for of to something else?
        for (entry of visitorNeighbours) {
            // Only add entries we haven't visited yet
            if (!visitedIds.includes(entry[1].id))
                queue.push(entry);
        }

        // If relative sums up to 1 it's a cardinal neighbour - we make it a neighbour
        if (Math.abs(visitorPos[0]) + Math.abs(visitorPos[1]) === 1) {
            this.makeNeighbours(newRoom, visitorRoom, visitorPos);
        }
    } // End while

    //--------------------------------------------------------------------------------------------------------//
    // Include room in room list
    //--------------------------------------------------------------------------------------------------------//
    this.roomList.push(newRoom);
    collision.addRoomColliderBounds(newRoom);
    return newRoom;
};

//--------------------------------------------------------------------------------------------------------//
// Add A Door
//--------------------------------------------------------------------------------------------------------//
Map.prototype.addDoor = function (room, direction, doorSize, posOffset, material) {
    const targetNeighbour = room.neighbours[direction];
    this.createDoorway(room, targetNeighbour, Map.DIRECTION[direction], doorSize, posOffset, material);
}

Map.prototype.createDoorway = function (primary, secondary, direction, doorSize, posOffset, material = null) {
    const tags = Map.getDirectionalTags(direction);

    primary.wallsType[tags.primary] = Room.WALL_TYPE.DOOR;
    primary.openingSize[tags.primary] = doorSize;
    primary.openingOffset[tags.primary] = posOffset;
    if (material !== null)
        primary.materials.walls[tags.primary] = material;
    secondary.wallsType[tags.secondary] = Room.WALL_TYPE.DOOR;
    secondary.openingSize[tags.secondary] = doorSize;
    secondary.openingOffset[tags.secondary] = posOffset;

    // Rebuild both rooms due to geometric changes.
    primary.build();
    secondary.build();
}

//--------------------------------------------------------------------------------------------------------//
// Add A Window
//--------------------------------------------------------------------------------------------------------//
Map.prototype.addWindow = function (room, direction, windowSize, posOffset, material) {
    this.createWindowOnWall(room, Map.DIRECTION[direction], windowSize, posOffset, material);
}

/** Sets wall type as window, assigns size to room's opening sizes and rebuilds room */
Map.prototype.createWindowOnWall = function (primary, direction, windowSize, posOffset, material = null) {
    const tags = Map.getDirectionalTags(direction);

    primary.wallsType[tags.primary] = Room.WALL_TYPE.WINDOW;
    primary.openingSize[tags.primary] = windowSize;
    primary.openingOffset[tags.primary] = posOffset;
    if (material !== null)
        primary.materials.walls[tags.primary] = material;
    primary.build();
}

//--------------------------------------------------------------------------------------------------------//
// Resize Room
//--------------------------------------------------------------------------------------------------------//
Map.prototype.resizeRoom = function (room, newWidth, newBreadth) {
    if (room === null) { throw ('Invalid Room'); }
    if (newWidth < 0 || newWidth > 10) { throw (`Invalid Resizing Width of ${newWidth}`); }
    if (newBreadth < 0 || newBreadth > 10) { throw (`Invalid Resizing Breadth of ${newBreadth}`); }

    if (room.clampedWidth()) newWidth = room.width;
    if (room.clampedBreadth()) newBreadth = room.breadth;

    // Recalculate position
    let newPosition = room.position;
    // Adjust horizontally
    if (newWidth !== room.width) {
        if (room.position[0] >= 0)
            matrixHelper.vector3.add(newPosition, room.position, [(newWidth - room.width) / 2, 0, 0]);
        else
            matrixHelper.vector3.sub(newPosition, room.position, [(newWidth - room.width) / 2, 0, 0]);

    }
    if (newBreadth !== room.breadth) {
        if (room.position[2] >= 0)
            matrixHelper.vector3.add(newPosition, room.position, [0, 0, (newBreadth - room.breadth) / 2]);
        else
            matrixHelper.vector3.sub(newPosition, room.position, [0, 0, (newBreadth - room.breadth) / 2]);
    }

    // If there's a collision we try to resolve it otherwise we fail to user.
    const collisionTest = collision.colliderOverlapsWithMap(Collision.getRoomColliderBounds(newWidth, newBreadth, newPosition), room.id);
    if (collisionTest) {
        /** Resizing means one direction is bound, the other is not. 
        We try to adjust our position away from our binding neighbour,
        using the collision overlap from the collisionTest and an overlap
        adjustment into our free direction (away from our binding anchor)*/
        let freeDirection = null;
        // We have north or south, so we get opposite
        if (room.clampedWidth())
            if (room.neighbours['north'] !== null) freeDirection = 'south'; // Clamped by width
            else freeDirection = 'north'; // Since north is null and clamped by width
        else if (room.neighbours['west'] !== null) freeDirection = 'east'; // Clamped by breadth
        else freeDirection = 'west'; // Since west is null and clamped by breadth
        const adjustment = Collision.getOverlapAdjustment(collisionTest, Map.DIRECTION[freeDirection]);

        // Let's apply the adjustment and re-test
        matrixHelper.vector3.add(newPosition, newPosition, adjustment);

        if (collision.colliderOverlapsWithMap(Collision.getRoomColliderBounds(newWidth, newBreadth, newPosition), room.id))
            throw ('Unable to resize room.  New size would overlap with nearby rooms!');

        // If not thrown, we can continue on with the adjusted position.
    }


    room.width = newWidth;
    room.breadth = newBreadth;
    room.position = newPosition;
    room.build();
}

//--------------------------------------------------------------------------------------------------------//
// Move Room
//--------------------------------------------------------------------------------------------------------//
Map.prototype.moveRoom = function (room, anchor, wall) {
    if (room === null || anchor === null) throw (`Null parameters passed`);
    if (!room.canBeMoved()) throw (`Room cannot be moved!`);

    if (matchDirs(Map.DIRECTION[wall], Map.DIRECTION.north) ||
        matchDirs(Map.DIRECTION[wall], Map.DIRECTION.south))
        if (room.width !== anchor.width) throw ('Width of room is not the same as anchor');
        else if (room.breadth !== anchor.breadth) throw ('Breadth of room is not the same as anchor');

    // Initial sanity checked passed.  Verifying if we can move to new location due to overlap
    let newPosition = this.getNewRoomPosition(anchor, room.width, room.breadth, Map.DIRECTION[wall]);
    const newColliderBounds = Collision.getRoomColliderBounds(room.width, room.breadth, newPosition);
    /** Ideally room to be moved is removed from collision check */
    if (collision.colliderOverlapsWithMap(newColliderBounds, room.id))
        throw ('Room creation overlaps with existing area in map');

    /** MOVE ALLOWED */
    room.position = newPosition;
    // This will internally override the existing collider since they're indexed by room ids.
    collision.addRoomColliderBounds(room);
    // If map not empty, we search for any neighbours by traversing room list.
    const queue = this.getRoomRelativePlots(anchor, getOppositeDirection(Map.DIRECTION[wall]));

    // We move the room given all the above sanity checks passed.
    this.removeNeighbours(room);
    // We make them neighbours after enqueuing children to avoid including ourselves.
    // We reverse direction to get point of view of new room and set as relative.
    this.makeNeighbours(anchor, room, Map.DIRECTION[wall], 0.5);

    const visitedIds = [anchor.id, room.id];
    while (queue.length > 0) {
        const visiting = queue.shift();

        const visitorPos = visiting[0];
        const visitorRoom = visiting[1];

        // Add visitor's ID to visited nodes
        visitedIds.push(visitorRoom.id);

        // Get visitor's neighbours to see if they need to be added
        const visitorNeighbours = this.getRoomRelativePlots(visitorRoom, visitorPos);

        for (entry of visitorNeighbours) {
            // Only add entries we haven't visited yet
            if (!visitedIds.includes(entry[1].id))
                queue.push(entry);
        }

        // If relative sums up to 1 it's a cardinal neighbour - we make it a neighbour
        if (Math.abs(visitorPos[0]) + Math.abs(visitorPos[1]) === 1) {
            this.makeNeighbours(room, visitorRoom, visitorPos);
        }
    } // End while
}

/** Given a direction, a dictionary containing the matched direction
 *  as primary and its opposite as secondary is returned. 
 * @returns {dictionary} formatted as {primary: 'north', secondary: 'south'} */
Map.getDirectionalTags = function (direction) {
    if (matchDirs(direction, Map.DIRECTION.north))
        return { primary: 'north', secondary: 'south' };
    else if (matchDirs(direction, Map.DIRECTION.east))
        return { primary: 'east', secondary: 'west' };
    else if (matchDirs(direction, Map.DIRECTION.south))
        return { primary: 'south', secondary: 'north' };
    else if (matchDirs(direction, Map.DIRECTION.west))
        return { primary: 'west', secondary: 'east' };
    else
        throw (`No valid directional match available from: ${direction}`)
}


Map.prototype.updateFloorMaterial = function (room, material) {
    room.materials.floor = material;
    room.build();
}

Map.prototype.updateWallMaterial = function (room, direction, material) {
    room.materials.walls[direction] = material;
    room.build();
}

Map.prototype.updateCeilingMaterial = function (room, material) {
    room.materials.ceiling = material;
    room.build();
}

//--------------------------------------------------------------------------------------------------------//
// Add A Wall
//--------------------------------------------------------------------------------------------------------//
Map.prototype.addWall = function (room, direction, material) {
    this.createWall(room, Map.DIRECTION[direction], material);
}

/** Sets wall type as window, assigns size to room's opening sizes and rebuilds room */
Map.prototype.createWall = function (primary, direction, material = null) {
    const tags = Map.getDirectionalTags(direction);

    if (primary.wallsType[tags.primary] === Room.WALL_TYPE.DOOR) {
        const secondary = primary.neighbours[tags.primary];
        secondary.wallsType[tags.secondary] = Room.WALL_TYPE.SOLID;
        secondary.openingSize[tags.secondary] = null;
        secondary.build();
    }
    primary.wallsType[tags.primary] = Room.WALL_TYPE.SOLID;
    primary.openingSize[tags.primary] = null;
    if (material !== null)
        primary.materials.walls[tags.primary] = material;
    primary.build();
}