// This class will hold vertex and index generating functions
var geobuilder = new Geometry();

function Geometry() { }

Geometry.DIMENSIONS = {
    roomHeight: 3,
    floorHeight: 0.03,
    wallThickness: 0.3,
    windowLiftDivider: 4,
    doorwayHeightDivider: 2
}

Geometry.prototype.createFrontWall = function (wallWidth) {
    return geobuilder.createCuboid(wallWidth, Geometry.DIMENSIONS.wallThickness, Geometry.DIMENSIONS.roomHeight);
}

Geometry.prototype.createSideWall = function (wallWidth) {
    return geobuilder.createCuboid(Geometry.DIMENSIONS.wallThickness, wallWidth, Geometry.DIMENSIONS.roomHeight);
}

Geometry.prototype.createFloor = function (width, breadth) {
    return geobuilder.createCuboid(
        width + (Geometry.DIMENSIONS.wallThickness * 2), // Best to inset the walls.
        breadth + (Geometry.DIMENSIONS.wallThickness * 2), // Best to inset the walls.
        Geometry.DIMENSIONS.floorHeight);
}

/**
 * @param {int} wallWidth width of entire wall
 * @param {float} doorwaySize width of doorway as a ratio of wall (0.1 to 0.9)
 * @param {Int32Array} orientation 
 */
Geometry.prototype.createFrontDoorway = function (wallWidth, doorwaySize = 0.5, doorwayOffset = 0.5) {
    // Clamp window size ratio to between 0.2 and 0.8
    doorwaySize = Math.min(0.8, Math.max(0.2, doorwaySize));
    // Clamp window position offset ratio between 0.25 and 0.75
    doorwayOffset = Math.min(0.75, Math.max(0.25, doorwayOffset));

    const halfWall = wallWidth / 2;
    const doorCenter = doorwayOffset * wallWidth; // Given a width of 10 and a ratio of 0.2 logical center is 2
    let halfDoorSize = doorwaySize * doorCenter;  // Half of the window's width
    if (doorwayOffset > 0.5)
        halfDoorSize = doorwaySize * (1 - doorwayOffset) * wallWidth;
    const leftPillarWidth = doorCenter - halfDoorSize;
    const leftPillarOffset = -(leftPillarWidth / 2 - halfWall);
    const rightPillarWidth = wallWidth - doorCenter - halfDoorSize;
    const rightPillarOffset = -(wallWidth - rightPillarWidth / 2 - halfWall);
    const centerBlockOffset = -(doorCenter - halfWall);

    const leftPillar = geobuilder.createCuboid(
        leftPillarWidth,
        Geometry.DIMENSIONS.wallThickness,
        Geometry.DIMENSIONS.roomHeight,
        // Offset west, which is probably positve for right handed coordinate systems
        { x: leftPillarOffset, y: 0, z: 0 }
    );
    const centerBlockGroundOffset = Geometry.DIMENSIONS.roomHeight / Geometry.DIMENSIONS.doorwayHeightDivider;
    const centerBlock = geobuilder.createCuboid(
        halfDoorSize * 2,
        Geometry.DIMENSIONS.wallThickness,
        Geometry.DIMENSIONS.roomHeight - centerBlockGroundOffset,
        { x: centerBlockOffset, y: centerBlockGroundOffset, z: 0 }
    );
    const rightPillar = geobuilder.createCuboid(
        rightPillarWidth,
        Geometry.DIMENSIONS.wallThickness,
        Geometry.DIMENSIONS.roomHeight,
        // Offset east, which is probably negative for right handed coordinate systems
        { x: rightPillarOffset, y: 0, z: 0 }
    );

    // Combine vertex and indexes together
    const joinedVertexList = leftPillar.vertex.concat(centerBlock.vertex, rightPillar.vertex);
    const joinedIndexList = leftPillar.index.concat(centerBlock.index, rightPillar.index);

    offsetIndexesMatchVerticesInPlace(joinedVertexList, joinedIndexList, 3);

    return { vertex: joinedVertexList, index: joinedIndexList };
}

Geometry.prototype.createSideDoorway = function (wallWidth, doorwaySize = 0.5, doorwayOffset = 0.5) {
    // Clamp window size ratio to between 0.2 and 0.8
    doorwaySize = Math.min(0.8, Math.max(0.2, doorwaySize));
    // Clamp window position offset ratio between 0.25 and 0.75
    doorwayOffset = Math.min(0.75, Math.max(0.25, doorwayOffset));

    const halfWall = wallWidth / 2;
    const doorCenter = doorwayOffset * wallWidth; // Given a width of 10 and a ratio of 0.2 logical center is 2
    let halfDoorSize = doorwaySize * doorCenter;  // Half of the window's width
    if (doorwayOffset > 0.5)
        halfDoorSize = doorwaySize * (1 - doorwayOffset) * wallWidth;
    const bottomPillarWidth = wallWidth - doorCenter - halfDoorSize;
    const bottomPillarOffset = bottomPillarWidth / 2 - halfWall;
    const topPillarWidth = doorCenter - halfDoorSize;
    const topPillarOffset = wallWidth - topPillarWidth / 2 - halfWall;
    const centerBlockOffset = -(doorCenter - halfWall);

    const bottomPillar = geobuilder.createCuboid(
        Geometry.DIMENSIONS.wallThickness,
        bottomPillarWidth,
        Geometry.DIMENSIONS.roomHeight,
        // Offset south
        { x: 0, y: 0, z: bottomPillarOffset }
    );
    const centerBlockGroundOffset = Geometry.DIMENSIONS.roomHeight / Geometry.DIMENSIONS.doorwayHeightDivider;
    const centerBlock = geobuilder.createCuboid(
        Geometry.DIMENSIONS.wallThickness,
        halfDoorSize * 2,
        Geometry.DIMENSIONS.roomHeight - centerBlockGroundOffset,
        { x: 0, y: centerBlockGroundOffset, z: centerBlockOffset }
    );
    const topPillar = geobuilder.createCuboid(
        Geometry.DIMENSIONS.wallThickness,
        topPillarWidth,
        Geometry.DIMENSIONS.roomHeight,
        // Offset east, which is probably negative for right handed coordinate systems
        { x: 0, y: 0, z: topPillarOffset }
    );

    // Combine vertex and indexes together
    const joinedVertexList = bottomPillar.vertex.concat(centerBlock.vertex, topPillar.vertex);
    const joinedIndexList = bottomPillar.index.concat(centerBlock.index, topPillar.index);

    offsetIndexesMatchVerticesInPlace(joinedVertexList, joinedIndexList, 3);

    return { vertex: joinedVertexList, index: joinedIndexList };
}

/** STILL TODO */
Geometry.prototype.createFrontWindow = function (wallWidth, windowSize = 0.5, windowOffset = 0.5) {
    // Clamp window size ratio to between 0.2 and 0.8
    windowSize = Math.min(0.8, Math.max(0.2, windowSize));
    // Clamp window position offset ratio between 0.25 and 0.75
    windowOffset = Math.min(0.75, Math.max(0.25, windowOffset));

    const halfWall = wallWidth / 2;
    const windowCenter = windowOffset * wallWidth; // Given a width of 10 and a ratio of 0.2 logical center is 2
    let halfWindowSize = windowSize * windowCenter;  // Half of the window's width
    if (windowOffset > 0.5)
        halfWindowSize = windowSize * (1 - windowOffset) * wallWidth;
    const leftPillarWidth = windowCenter - halfWindowSize;
    const leftPillarOffset = -(leftPillarWidth / 2 - halfWall);
    const rightPillarWidth = wallWidth - windowCenter - halfWindowSize;
    const rightPillarOffset = -(wallWidth - rightPillarWidth / 2 - halfWall);
    const centerBlockOffset = -(windowCenter - halfWall);


    const leftPillar = geobuilder.createCuboid(
        leftPillarWidth,
        Geometry.DIMENSIONS.wallThickness,
        Geometry.DIMENSIONS.roomHeight,
        // Offset west, which is probably positve for right handed coordinate systems
        { x: leftPillarOffset, y: 0, z: 0 }
    );
    const windowBlockHeight = Geometry.DIMENSIONS.roomHeight / Geometry.DIMENSIONS.windowLiftDivider;
    const centerLowerBlock = geobuilder.createCuboid(
        halfWindowSize * 2,
        Geometry.DIMENSIONS.wallThickness,
        windowBlockHeight,
        { x: centerBlockOffset, y: 0, z: 0 }
    );
    const centerUpperBlock = geobuilder.createCuboid(
        halfWindowSize * 2,
        Geometry.DIMENSIONS.wallThickness,
        windowBlockHeight,
        { x: centerBlockOffset, y: Geometry.DIMENSIONS.roomHeight - windowBlockHeight, z: 0 }
    );
    const rightPillar = geobuilder.createCuboid(
        rightPillarWidth,
        Geometry.DIMENSIONS.wallThickness,
        Geometry.DIMENSIONS.roomHeight,
        // Offset east, which is probably negative for right handed coordinate systems
        { x: rightPillarOffset, y: 0, z: 0 }
    );

    // Combine vertex and indexes together
    const joinedVertexList = leftPillar.vertex.concat(centerLowerBlock.vertex, centerUpperBlock.vertex, rightPillar.vertex);
    const joinedIndexList = leftPillar.index.concat(centerLowerBlock.index, centerUpperBlock.index, rightPillar.index);

    offsetIndexesMatchVerticesInPlace(joinedVertexList, joinedIndexList, 4);

    return { vertex: joinedVertexList, index: joinedIndexList };
}

/** STILL TODO */
Geometry.prototype.createSideWindow = function (wallWidth, windowSize = 0.5, windowOffset = 0.5) {
    // Clamp window size ratio to between 0.2 and 0.8
    windowSize = Math.min(0.8, Math.max(0.2, windowSize));
    // Clamp window position offset ratio between 0.25 and 0.75
    windowOffset = Math.min(0.75, Math.max(0.25, windowOffset));

    const halfWall = wallWidth / 2;
    const windowCenter = windowOffset * wallWidth; // Given a width of 10 and a ratio of 0.2 logical center is 2
    let halfWindowSize = windowSize * windowCenter;  // Half of the window's width
    if (windowOffset > 0.5)
        halfWindowSize = windowSize * (1 - windowOffset) * wallWidth;
    const bottomPillarWidth = windowCenter - halfWindowSize;
    const bottomPillarOffset = bottomPillarWidth / 2 - halfWall;
    const topPillarWidth = wallWidth - windowCenter - halfWindowSize;
    const topPillarOffset = wallWidth - topPillarWidth / 2 - halfWall;
    const centerBlockOffset = windowCenter - halfWall;

    const bottomPillar = geobuilder.createCuboid(
        Geometry.DIMENSIONS.wallThickness,
        bottomPillarWidth,
        Geometry.DIMENSIONS.roomHeight,
        // Offset south
        { x: 0, y: 0, z: bottomPillarOffset }
    );
    const windowBlockHeight = Geometry.DIMENSIONS.roomHeight / Geometry.DIMENSIONS.windowLiftDivider;
    const centerLowerBlock = geobuilder.createCuboid(
        Geometry.DIMENSIONS.wallThickness,
        halfWindowSize * 2,
        windowBlockHeight,
        { x: 0, y: 0, z: centerBlockOffset }
    );
    const centerUpperBlock = geobuilder.createCuboid(
        Geometry.DIMENSIONS.wallThickness,
        halfWindowSize * 2,
        windowBlockHeight,
        { x: 0, y: Geometry.DIMENSIONS.roomHeight - windowBlockHeight, z: centerBlockOffset }
    );
    const topPillar = geobuilder.createCuboid(
        Geometry.DIMENSIONS.wallThickness,
        topPillarWidth,
        Geometry.DIMENSIONS.roomHeight,
        // Offset east, which is probably negative for right handed coordinate systems
        { x: 0, y: 0, z: topPillarOffset }
    );

    // Combine vertex and indexes together
    const joinedVertexList = bottomPillar.vertex.concat(centerLowerBlock.vertex, centerUpperBlock.vertex, topPillar.vertex);
    const joinedIndexList = bottomPillar.index.concat(centerLowerBlock.index, centerUpperBlock.index, topPillar.index);

    offsetIndexesMatchVerticesInPlace(joinedVertexList, joinedIndexList, 4);

    return { vertex: joinedVertexList, index: joinedIndexList };
}

/** Creates and returns a dictionary of vertices and indexes for the cuboid.
 *  Used directly for the creation of walls, floors and other simple geometry.
 * Also applies a given offset directly to the vertex creation allowing for more
 * complex constructions when the end result is passed through 
 * offsetIndexesMatchVerticesInPlace() to join all vertices in place
 */
Geometry.prototype.createCuboid = function (width, breadth, height = Geometry.DIMENSIONS.roomHeight, off = { x: 0, y: 0, z: 0 }) {
    // Find center of x, and z, and base of y, shifted each by offset.
    // Y goes from base (0) to h.
    const x = (width / 2);
    const y = 0;
    const z = (breadth / 2);
    const h = height;
    const left = this.makeQuad(
        [[x + off.x, y + off.y, -z + off.z], [x + off.x, y + off.y, z + off.z], [x + off.x, h + off.y, z + off.z], [x + off.x, h + off.y, -z + off.z]],
        [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]],
        [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        [[0, 0], [1, 0], [1, 1], [0, 1]]);

    const right = this.makeQuad(
        [[-x + off.x, y + off.y, -z + off.z], [-x + off.x, y + off.y, z + off.z], [-x + off.x, h + off.y, z + off.z], [-x + off.x, h + off.y, -z + off.z]],
        [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]],
        [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        [[0, 0], [1, 0], [1, 1], [0, 1]]);

    const top = this.makeQuad(
        [[x + off.x, h + off.y, -z + off.z], [x + off.x, h + off.y, z + off.z], [-x + off.x, h + off.y, z + off.z], [-x + off.x, h + off.y, -z + off.z]],
        [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]],
        [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        [[0, 0], [1, 0], [1, 1], [0, 1]]);

    const bottom = this.makeQuad(
        [[x + off.x, y + off.y, -z + off.z], [x + off.x, y + off.y, z + off.z], [-x + off.x, y + off.y, z + off.z], [-x + off.x, y + off.y, -z + off.z]],
        [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]],
        [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        [[0, 0], [1, 0], [1, 1], [0, 1]]);

    const front = this.makeQuad(
        [[x + off.x, y + off.y, -z + off.z], [-x + off.x, y + off.y, -z + off.z], [-x + off.x, h + off.y, -z + off.z], [x + off.x, h + off.y, -z + off.z]],
        [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]],
        [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        [[0, 0], [1, 0], [1, 1], [0, 1]]);

    const back = this.makeQuad(
        [[x + off.x, y + off.y, z + off.z], [-x + off.x, y + off.y, z + off.z], [-x + off.x, h + off.y, z + off.z], [x + off.x, h + off.y, z + off.z]],
        [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]],
        [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        [[0, 0], [1, 0], [1, 1], [0, 1]]);

    const joinedVertexList = front.vertex.concat(back.vertex, top.vertex, bottom.vertex, left.vertex, right.vertex);
    const joinedIndexList = front.index.concat(back.index, top.index, bottom.index, left.index, right.index);

    offsetIndexesMatchVerticesInPlace(joinedVertexList, joinedIndexList, 6);

    return { vertex: joinedVertexList, index: joinedIndexList };
}

/** Takes positions, normals, colours and uvs to return a
 * { vertex : vertexList, index : indexList } object.
 */
Geometry.prototype.makeQuad = function (positions, normals, colours, uvs) {
    const vertexList = [], indexList = [];

    // Modify 2d array of positions, normals, colours 
    // and uvs into a single array in that order.
    for (let i = 0; i < 4; ++i) {
        for (let k = 0; k < 3; ++k)
            vertexList[vertexList.length] = positions[i][k];
        for (let k = 0; k < 3; ++k)
            vertexList[vertexList.length] = normals[i][k];
        for (let k = 0; k < 3; ++k)
            vertexList[vertexList.length] = colours[i][k];
        for (let k = 0; k < 2; ++k)
            vertexList[vertexList.length] = uvs[i][k];
    }

    indexList[indexList.length] = 0; // Create first triangle
    indexList[indexList.length] = 1;
    indexList[indexList.length] = 2;
    indexList[indexList.length] = 0; // Second triangle
    indexList[indexList.length] = 2;
    indexList[indexList.length] = 3;

    return { vertex: vertexList, index: indexList };
};

/**
 * Offset each subsequent chunk after the first by the number of vertices per chunk.
 * Vertices per chunk MUST be consistent. 
 * @param {array} joinedVertices 
 * @param {array} joinedIndexes 
 * @param {int} numOfChunks 
 */
function offsetIndexesMatchVerticesInPlace(joinedVertices, joinedIndexes, numOfChunks) {
    const verticesPerChunk = joinedVertices.length / numOfChunks / 11;
    const indicesPerChunk = joinedIndexes.length / numOfChunks;
    for (let chunk = 1; chunk < numOfChunks; chunk++) {
        for (let vertex = 0; vertex < indicesPerChunk; vertex++) {
            joinedIndexes[(chunk * indicesPerChunk) + vertex] = joinedIndexes[(chunk * indicesPerChunk) + vertex] + (chunk * verticesPerChunk);
        }
    }
}

/** Create a block which is positioned where the front door would be 
 * Useful for collision detection with a doorway. */
Geometry.getFrontDoorOpening = function (wallWidth, doorwaySize = 0.5, doorwayOffset = 0.5, barrierModifier = 0.5) {
    // Clamp window size ratio to between 0.2 and 0.8
    doorwaySize = Math.min(0.8, Math.max(0.2, doorwaySize));
    // Clamp window position offset ratio between 0.25 and 0.75
    doorwayOffset = Math.min(0.75, Math.max(0.25, doorwayOffset));

    const halfWall = wallWidth / 2;
    const doorCenter = doorwayOffset * wallWidth; // Given a width of 10 and a ratio of 0.2 logical center is 2
    let halfDoorSize = doorwaySize * doorCenter;  // Half of the window's width
    if (doorwayOffset > 0.5)
        halfDoorSize = doorwaySize * (1 - doorwayOffset) * wallWidth;
    const centerBlockOffset = -(doorCenter - halfWall);
    const centerBlockHeight = Geometry.DIMENSIONS.roomHeight / Geometry.DIMENSIONS.doorwayHeightDivider;
    const centerBlock = geobuilder.createCuboid(
        halfDoorSize * 2 - barrierModifier,
        Geometry.DIMENSIONS.wallThickness + barrierModifier,
        Geometry.DIMENSIONS.roomHeight - centerBlockHeight,
        { x: centerBlockOffset, y: 0, z: 0 }
    );

    return { vertex: centerBlock.vertex, index: centerBlock.index };
}

/** Create a block which is positioned where the side door would be 
 * Useful for collision detection with a doorway.
 * Barriermodifier is used to thicken the opening to allow doorway detection
 * and make it narrower to avoid clipping through side of walls
 * These values will depend on ViewFrustrum range of visual. */
Geometry.getSideDoorOpening = function (wallWidth, doorwaySize = 0.5, doorwayOffset = 0.5, barrierModifier = 0.5) {
    // Clamp window size ratio to between 0.2 and 0.8
    doorwaySize = Math.min(0.8, Math.max(0.2, doorwaySize));
    // Clamp window position offset ratio between 0.25 and 0.75
    doorwayOffset = Math.min(0.75, Math.max(0.25, doorwayOffset));

    const halfWall = wallWidth / 2;
    const doorCenter = doorwayOffset * wallWidth; // Given a width of 10 and a ratio of 0.2 logical center is 2
    let halfDoorSize = doorwaySize * doorCenter;  // Half of the window's width
    if (doorwayOffset > 0.5)
        halfDoorSize = doorwaySize * (1 - doorwayOffset) * wallWidth;
    const centerBlockOffset = -(doorCenter - halfWall);

    const centerBlockHeight = Geometry.DIMENSIONS.roomHeight / Geometry.DIMENSIONS.doorwayHeightDivider;
    const centerBlock = geobuilder.createCuboid(
        Geometry.DIMENSIONS.wallThickness + barrierModifier,
        halfDoorSize * 2 - barrierModifier,
        Geometry.DIMENSIONS.roomHeight - centerBlockHeight,
        { x: 0, y: centerBlockHeight, z: centerBlockOffset }
    );

    return { vertex: centerBlock.vertex, index: centerBlock.index };
}

/** Builds and returns a cube with inverted normals */
Geometry.prototype.buildSkyBoxCube = function (size = 100) {
    // Find center of x, and z, and base of y, shifted each by offset.
    // Y goes from base (0) to h.
    const half = size / 2 ;
    const left = this.makeQuad(
        [[half, -half, -half], [half, -half, half], [half, half, half], [half, half, -half]],
        [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]],
        [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        [[0, 1/3], [1/4, 1/3], [1/4, 2/3], [0, 2/3]]);

    const right = this.makeQuad(
        [[-half, -half, -half], [-half, -half, half], [-half, half, half], [-half, half, -half]],
        [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]],
        [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        [[2/4, 1/3], [3/4, 1/3], [3/4, 2/3], [2/4, 2/3]]);

    const top = this.makeQuad(
        [[half, half, -half], [half, half, half], [-half, half, half], [-half, half, -half]],
        [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]],
        [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        [[1/4, 2/3], [2/4, 2/3], [2/4, 1], [1/4, 1]]);

    const bottom = this.makeQuad(
        [[half, -half, -half], [half, -half, half], [-half, -half, half], [-half, -half, -half]],
        [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]],
        [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        [[1/4, 0], [2/4, 0], [2/4, 1/3], [1/4, 1/3]]);

    const front = this.makeQuad(
        [[half, -half, -half], [-half, -half, -half], [-half, half, -half], [half, half, -half]],
        [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]],
        [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        [[1/4, 1/3], [2/4, 1/3], [2/4, 2/3], [1/4, 2/3]]);

    const back = this.makeQuad(
        [[half, -half, half], [-half, -half, half], [-half, half, half], [half, half, half]],
        [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]],
        [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        [[3/4, 1/3], [1, 1/3], [1, 2/3], [3/4, 2/3]]);

    const joinedVertexList = front.vertex.concat(back.vertex, top.vertex, bottom.vertex, left.vertex, right.vertex);
    const joinedIndexList = front.index.concat(back.index, top.index, bottom.index, left.index, right.index);

    offsetIndexesMatchVerticesInPlace(joinedVertexList, joinedIndexList, 6);

    return { vertex: joinedVertexList, index: joinedIndexList };
}