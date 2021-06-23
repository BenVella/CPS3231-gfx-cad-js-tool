//--------------------------------------------------------------------------------------------------------//
// MAIN PAGE USER INTERFACE FUNCTIONS
//--------------------------------------------------------------------------------------------------------//

toggleVisibility.primaryDivs = {
    createRoom: '#userInput #createRoom',
    addDoor: '#userInput #addDoor',
    addWindow: '#userInput #addWindow',
    editRooms: '#userInput #editRooms',
    roomObjects: '#userInput #roomObjects',
    exploration: '#userInput #exploration'
}

function toggleVisibility(divId) {
    for (const mainDiv in toggleVisibility.primaryDivs) {
        const elem = document.querySelector(toggleVisibility.primaryDivs[mainDiv]);
        if (mainDiv === divId)  // Show clicked
            elem.style.display = 'block';
        else                    // Hide the rest
            elem.style.display = 'none';
    }
}

//--------------------------------------------------------------------------------------------------------//
// CREATING ROOMS
//--------------------------------------------------------------------------------------------------------//
createRoom.elementIds = {
    result: '#userInput #result',
    roomAnchor: '#createRoom #anchorSelection',
    roomWall: '#createRoom #wallSelection',
    rname: '#createRoom #rname',
    rwidth: '#createRoom #rwidth',
    rbreadth: '#createRoom #rbreadth',
    floorMaterial: '#createRoom #floorMaterial',
    wallMaterial: '#createRoom #wallMaterial',
    ceilingMaterial: '#createRoom #ceilingMaterial',
    doorWallRatio: '#createRoom #doorWallRatio',
    createRoomShowCeiling: '#createRoom #createRoomShowCeiling',
    createRoomCeilingMaterial: '#createRoom #createRoomCeilingMaterial',
    createRoomDoorSize: '#createRoom #createRoomDoorSize'
}

/** Called when user presses Create Room Button */
function createRoom() {
    const result = document.querySelector(createRoom.elementIds.result);
    // Fetch all available data
    const roomAnchor = document.querySelector(createRoom.elementIds.roomAnchor);
    const roomWall = document.querySelector(createRoom.elementIds.roomWall);
    const rname = document.querySelector(createRoom.elementIds.rname);
    const rwidth = document.querySelector(createRoom.elementIds.rwidth);
    const rbreadth = document.querySelector(createRoom.elementIds.rbreadth);
    const floorMaterial = document.querySelector(createRoom.elementIds.floorMaterial);
    const wallMaterial = document.querySelector(createRoom.elementIds.wallMaterial);
    const createRoomShowCeiling = document.querySelector(createRoom.elementIds.createRoomShowCeiling);
    const ceilingMaterial = document.querySelector(createRoom.elementIds.ceilingMaterial);
    const doorWallRatio = document.querySelector(createRoom.elementIds.doorWallRatio);

    if (map.isEmpty())
        createRoomEnableDoorSize(true);
    try {
        const materialList = {
            floor: floorMaterial.value,
            ceiling: ceilingMaterial.value,
            walls: {
                north: wallMaterial.value,
                east: wallMaterial.value,
                south: wallMaterial.value,
                west: wallMaterial.value
            }
        };
        const width = Number(rwidth.value);
        const breadth = Number(rbreadth.value);
        if (width < 1 || width > 10 || breadth < 1 || breadth > 10) {
            result.textContent = "Width and Breadth must be numerical between 1 and 10.";
            return;
        }
        const doorSize = Number(doorWallRatio.value) / 100;
        const createdRoom = map.addRoom(rname.value, width, breadth, materialList, roomWall.value, roomAnchor.value, doorSize);
        if (createRoomShowCeiling.checked) {
            createdRoom.buildCeiling = true;
            createdRoom.build();
        }

    } catch (err) {
        result.textContent = "Failed to create Room. Error: " + err;
    }

    if (map.isEmpty())
        createRoomEnableDoorSize(false);
    result.textContent = "Successfully Created Room.";

    // Update UI
    createRoomUpdateInterface();
}

function createRoomUpdateInterface() {
    createRoomGetAnchors();
    addDoorGetRooms();
    addWindowGetRooms();
    editRoomsGetRooms();
    roomObjects();
}

function createRoomGetAnchors() {
    const roomAnchor = document.querySelector(createRoom.elementIds.roomAnchor);
    // Delete all children
    emptySelectionElement(roomAnchor);

    const rooms = map.availableAnchorRooms();

    if (rooms.length === 0) {
        defaultSelectDisabledHiddenOption(roomAnchor, `No Rooms Available`);
        return;
    }

    for (var i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        const el = document.createElement('option');
        el.textContent = room.reference;
        el.value = room.id;
        roomAnchor.appendChild(el);
    }

    createRoomGetWalls();
}

function createRoomGetWalls() {
    const roomAnchor = document.querySelector(createRoom.elementIds.roomAnchor);
    const roomWall = document.querySelector(createRoom.elementIds.roomWall);
    // Delete all children
    emptySelectionElement(roomWall);

    if (roomAnchor.value === undefined || roomAnchor.value === 'undefined') {
        defaultSelectDisabledHiddenOption(roomWall, `No Room Selected`);
        return;
    }

    const roomId = roomAnchor.value;
    const room = map.getRoomById(roomId);

    if (room === null) {
        console.error('Cannot get room creation anchor walls. Room select with id: ' + roomId + ' was not found in roomList!');
        return;
    }

    const directions = room.getFreePlotDirections();

    for (var i = 0; i < directions.length; i++) {
        const direction = directions[i]
        const el = document.createElement('option');
        el.textContent = direction;
        el.value = direction;
        roomWall.appendChild(el);
    }

    createRoomCheckClamping();
}

/** Binds Create Room Width and Breadth text boxes to static values when required. */
function createRoomCheckClamping() {
    const roomAnchor = document.querySelector(createRoom.elementIds.roomAnchor);
    const roomWall = document.querySelector(createRoom.elementIds.roomWall);
    const rwidth = document.querySelector(createRoom.elementIds.rwidth);
    const rbreadth = document.querySelector(createRoom.elementIds.rbreadth);
    // Update bounds on width and breadth for rooms
    const room = map.getRoomById(roomAnchor.value);
    const wall = roomWall.value;

    // returns a dictionary {width: value, breadth: value}, null if not clamped.
    clampedDimensions = map.getClampedFloorDimensions(room, wall);

    if (clampedDimensions.width !== null) { rwidth.value = clampedDimensions.width; rwidth.disabled = true; }
    else { rwidth.disabled = false; }

    if (clampedDimensions.breadth !== null) { rbreadth.value = clampedDimensions.breadth; rbreadth.disabled = true; }
    else { rbreadth.disabled = false; }
}

function createRoomToggleCeiling() {
    const toggleCeilingCheck = document.querySelector(createRoom.elementIds.createRoomShowCeiling);
    const ceilingMaterial = document.querySelector(createRoom.elementIds.createRoomCeilingMaterial);

    if (toggleCeilingCheck.value === 'true' || toggleCeilingCheck.value)
        ceilingMaterial.style.display = 'block';
    else
        ceilingMaterial.style.display = 'none';
}

function createRoomEnableDoorSize(type) {
    const createRoomDoorSize = document.querySelector(createRoom.elementIds.createRoomDoorSize);
    if (type)
        createRoomDoorSize.style.display = 'block';
    else
        createRoomDoorSize.style.display = 'none';

}
//--------------------------------------------------------------------------------------------------------//
// ADDING DOORS
//--------------------------------------------------------------------------------------------------------//

addDoor.elementIds = {
    result: '#userInput #result', // Label up top
    selectedRoom: '#addDoor #roomSelection', // 
    selectedWall: '#addDoor #wallSelection',
    doorWallMaterial: '#addDoor #doorWallMaterial',
    doorWallRatio: '#addDoor #doorWallRatio',
}

/** Called when user presses Create Room Button */
function addDoor() {
    const result = document.querySelector(addDoor.elementIds.result);
    // Fetch all available data
    const selectedRoom = document.querySelector(addDoor.elementIds.selectedRoom);
    const selectedWall = document.querySelector(addDoor.elementIds.selectedWall);
    const doorWallMaterial = document.querySelector(addDoor.elementIds.doorWallMaterial);
    const doorWallRatio = document.querySelector(addDoor.elementIds.doorWallRatio);

    try {
        const room = map.getRoomById(selectedRoom.value);
        if (room === null) {
            result.textContent = "Select a valid room and wall to convert.";
            return;
        }
        const direction = selectedWall.value;
        const doorMaterial = doorWallMaterial.value;
        const doorSize = Number(doorWallRatio.value) / 100;
        map.addDoor(room, direction, doorSize, undefined, doorMaterial);
    } catch (err) {
        result.textContent = "Failed to add door. Error: " + err;
    }
    // Update anchors and room walls
    addDoorGetRooms();
}

/** Lists Rooms which may have a door added to them */
function addDoorGetRooms() {
    const selectedRoom = document.querySelector(addDoor.elementIds.selectedRoom);
    // Delete all children
    while (selectedRoom.lastChild) {
        selectedRoom.removeChild(selectedRoom.lastChild);
    }

    const rooms = map.getDisjointNeighbours();

    if (rooms.length === 0) {
        defaultSelectDisabledHiddenOption(selectedRoom, `No Rooms Available`);
        addDoorGetWalls();
        return;
    }

    for (const room of rooms) {
        const elem = document.createElement('option');
        elem.textContent = room.reference;
        elem.value = room.id;
        selectedRoom.appendChild(elem);
    }

    addDoorGetWalls();
}

/** Lists cardinal directions of a room to add a door to (wall type is solid) */
function addDoorGetWalls() {
    const selectedRoom = document.querySelector(addDoor.elementIds.selectedRoom);
    const selectedWall = document.querySelector(addDoor.elementIds.selectedWall);
    // Delete all children
    while (selectedWall.lastChild) {
        selectedWall.removeChild(selectedWall.lastChild);
    }
    if (selectedRoom.value === undefined || selectedRoom.value === 'undefined') {
        defaultSelectDisabledHiddenOption(selectedWall, `No Room Selected`);
        return;
    }

    const roomId = selectedRoom.value;
    const room = map.getRoomById(roomId);

    if (room === null) {
        console.error('Cannot Fetch Door Walls. Room select with id: ' + roomId + ' was not found in roomList!');
        return;
    }

    const hasNeighbours = true;
    const directions = room.getSolidWalls(hasNeighbours);

    for (const direction of directions) {
        const elem = document.createElement('option');
        elem.textContent = direction;
        elem.value = direction;
        selectedWall.appendChild(elem);
    }
}


//--------------------------------------------------------------------------------------------------------//
// ADDING WINDOWS
//--------------------------------------------------------------------------------------------------------//

addWindow.elementIds = {
    result: '#userInput #result', // Label up top
    selectedRoom: '#addWindow #roomSelection', // 
    selectedWall: '#addWindow #wallSelection',
    windowWallMaterial: '#addWindow #windowWallMaterial',
    windowWallRatio: '#addWindow #windowWallRatio',
}

/** Called when user presses Create Room Button */
function addWindow() {
    const result = document.querySelector(addWindow.elementIds.result);
    // Fetch all available data
    const selectedRoom = document.querySelector(addWindow.elementIds.selectedRoom);
    const selectedWall = document.querySelector(addWindow.elementIds.selectedWall);
    const windowWallMaterial = document.querySelector(addWindow.elementIds.windowWallMaterial);
    const windowWallRatio = document.querySelector(addWindow.elementIds.windowWallRatio);

    try {
        const room = map.getRoomById(selectedRoom.value);
        if (room === null) {
            result.textContent = "Select a valid room and wall to convert.";
            return;
        }
        const direction = selectedWall.value;
        const windowMaterial = windowWallMaterial.value;
        const windowSize = Number(windowWallRatio.value) / 100;
        map.addWindow(room, direction, windowSize, undefined, windowMaterial);
    } catch (err) {
        result.textContent = "Failed to add window. Error: " + err;
    }

    // Update anchors and room walls
    addWindowGetRooms();
}

/** Lists Rooms which may have a window added to them */
function addWindowGetRooms() {
    const selectedRoom = document.querySelector(addWindow.elementIds.selectedRoom);
    // Delete all children
    while (selectedRoom.lastChild) {
        selectedRoom.removeChild(selectedRoom.lastChild);
    }

    const rooms = map.getRoomsSolidWallsNoNeighbours();

    if (rooms.length === 0) {
        defaultSelectDisabledHiddenOption(selectedRoom, `No Rooms Available`);
        addWindowGetWalls();
        return;
    }

    for (const room of rooms) {
        const elem = document.createElement('option');
        elem.textContent = room.reference;
        elem.value = room.id;
        selectedRoom.appendChild(elem);
    }

    addWindowGetWalls();
}

/** Lists cardinal directions of a room to add a window to (wall type is solid) */
function addWindowGetWalls() {
    const selectedRoom = document.querySelector(addWindow.elementIds.selectedRoom);
    const selectedWall = document.querySelector(addWindow.elementIds.selectedWall);
    // Delete all children
    while (selectedWall.lastChild) {
        selectedWall.removeChild(selectedWall.lastChild);
    }
    if (selectedRoom.value === undefined || selectedRoom.value === 'undefined') {
        defaultSelectDisabledHiddenOption(selectedWall, `No Room Selected`);
        return;
    }

    const roomId = selectedRoom.value;
    const room = map.getRoomById(roomId);

    if (room === null) {
        console.error('Cannot Fetch Window Walls. Room select with id: ' + roomId + ' was not found in roomList!');
        return;
    }

    const hasNeighbours = false;
    const directions = room.getSolidWalls(hasNeighbours);

    for (const direction of directions) {
        const elem = document.createElement('option');
        elem.textContent = direction;
        elem.value = direction;
        selectedWall.appendChild(elem);
    }
}

//--------------------------------------------------------------------------------------------------------//
// EDITING ROOMS - General
//--------------------------------------------------------------------------------------------------------//

editRooms.elementIds = {
    result: '#userInput #result', // Label up top
    selectedRoom: '#editRooms #roomSelection',
    selectedWall: '#editRooms #wallSelection',

    // Resizing Room
    editRoomResizeRoomDiv: '#editRooms #editRoomResizeRoomDiv',
    resizeWidth: '#editRooms #editRoomResizeRoomDiv #resizeWidth',
    resizeBreadth: '#editRooms #editRoomResizeRoomDiv #resizeBreadth',

    // Room Movement
    editRoomChangeAnchorDiv: '#editRooms #editRoomChangeAnchorDiv',
    editRoomMoveToAnchor: '#editRooms #editRoomChangeAnchorDiv #editRoomMoveToAnchor',
    editRoomMoveToWall: '#editRooms #editRoomChangeAnchorDiv #editRoomMoveToWall',

    // Changing Materials
    editRoomUpdateMaterials: '#editRooms #editRoomUpdateMaterials',
    editRoomPaintMaterial: '#editRooms #editRoomUpdateMaterials #editRoomPaintMaterial',
    editRoomsPaintFloor: '#editRooms #editRoomUpdateMaterials #editRoomsPaintFloor',
    editRoomsPaintCeiling: '#editRooms #editRoomUpdateMaterials #editRoomsPaintCeiling',
    editRoomsPaintWall: '#editRooms #editRoomUpdateMaterials #editRoomsPaintWall',

    // Creating doors / windows / walls of varying sizes
    editRoomWallOpenings: '#editRooms #editRoomWallOpenings',
    editRoomOpeningRatio: '#editRooms #editRoomOpeningRatio',
    editRoomPositionOffset: '#editRooms #editRoomPositionOffset',
    editRoomsMakeSolid: '#editRooms #editRoomsMakeSolid',
    editRoomsMakeDoor: '#editRooms #editRoomsMakeDoor',
    editRoomsMakeWindow: '#editRooms #editRoomsMakeWindow'
}

function editRooms() { }

/** Lists Rooms which may have a window added to them */
function editRoomsGetRooms() {
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    // Delete all children
    while (selectedRoom.lastChild) {
        selectedRoom.removeChild(selectedRoom.lastChild);
    }

    const rooms = map.getRooms();

    if (rooms.length === 0) {
        defaultSelectDisabledHiddenOption(selectedRoom, `No Rooms Available`);
        editRoomsGetWalls();
        return;
    }

    for (const room of rooms) {
        const elem = document.createElement('option');
        elem.textContent = room.reference;
        elem.value = room.id;
        selectedRoom.appendChild(elem);
    }

    editRoomsChangedRoomSelection();
}

function editRoomsChangedRoomSelection() {
    editRoomsCheckResizeOption();
    editRoomsCheckMovementOption();
    editRoomsGetWalls();
}

/** Lists cardinal directions of a room regardless of type */
function editRoomsGetWalls() {
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    const selectedWall = document.querySelector(editRooms.elementIds.selectedWall);
    // Delete all children
    while (selectedWall.lastChild) {
        selectedWall.removeChild(selectedWall.lastChild);
    }
    if (selectedRoom.value === undefined || selectedRoom.value === 'undefined') {
        defaultSelectDisabledHiddenOption(selectedWall, `No Room Selected`);
        return;
    }

    const roomId = selectedRoom.value;
    const room = map.getRoomById(roomId);

    if (room === null) {
        console.error('Cannot Fetch Walls. Room select with id: ' + roomId + ' was not found in roomList!');
        return;
    }

    const descriptiveWalls = room.getDescriptiveWalls();

    for (const dictWall of descriptiveWalls) {
        const elem = document.createElement('option');
        elem.textContent = dictWall.description;
        elem.value = dictWall.direction;
        selectedWall.appendChild(elem);
    }

    editRoomsUpdateWallOptions();
}

/** Updated HTML visibility and enabled options based on which room and wall has been chosen */
function editRoomsUpdateWallOptions() {
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    const selectedWall = document.querySelector(editRooms.elementIds.selectedWall);

    const editRoomUpdateMaterials = document.querySelector(editRooms.elementIds.editRoomUpdateMaterials);
    const editRoomWallOpenings = document.querySelector(editRooms.elementIds.editRoomWallOpenings);

    const roomId = selectedRoom.value;
    const room = map.getRoomById(roomId);

    if (room === null) {
        console.error('Cannot Fetch Edit Room Walls. Room select with id: ' + roomId + ' was not found in roomList!');
        editRoomUpdateMaterials.style.display = 'none';
        return;
    }

    const wall = selectedWall.value;
    if (Map.directionToString(wall) === undefined) {
        console.error(`Cannot Update Edit Room Wall Options.  Invalid wall parameter ${wall}.`);
        editWallOptions.style.display = 'none';
        return;
    }

    editRoomUpdateMaterials.style.display = 'block';
    editRoomWallOpenings.style.display = 'block';

    // Get wall buttons
    const editRoomsMakeSolidButton = document.querySelector(editRooms.elementIds.editRoomsMakeSolid);
    const editRoomsMakeDoorButton = document.querySelector(editRooms.elementIds.editRoomsMakeDoor);
    const editRoomsMakeWindowButton = document.querySelector(editRooms.elementIds.editRoomsMakeWindow);

    // Enable or disable depending on available options
    editRoomsMakeSolidButton.disabled = !room.isSolidAllowed(wall);
    editRoomsMakeDoorButton.disabled = !room.isDoorAllowed(wall);
    editRoomsMakeWindowButton.disabled = !room.isWindowAllowed(wall);

    // Shrink or hide entire panel if all are disabled.
    const availableOptions = [];
    availableOptions.push(editRoomsMakeSolidButton.disabled);
    availableOptions.push(editRoomsMakeDoorButton.disabled);
    availableOptions.push(editRoomsMakeWindowButton.disabled);

    if (availableOptions.includes(false))
        editRoomWallOpenings.style.display = 'block';
    else
        editRoomWallOpenings.style.display = 'none';
}

//--------------------------------------------------------------------------------------------------------//
// EDITING ROOMS - Resize
//--------------------------------------------------------------------------------------------------------//

/** Called by user when resizing a room's dimension */
function editRoomsResizeRoom() {
    const result = document.querySelector(editRooms.elementIds.result);
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    const resizeWidth = document.querySelector(editRooms.elementIds.resizeWidth);
    const resizeBreadth = document.querySelector(editRooms.elementIds.resizeBreadth);

    try {
        const room = map.getRoomById(selectedRoom.value);
        if (room === null) { result.textContent = `Room with id ${selectedRoom.value} could not be located.`; return; }

        let width = room.width;
        let breadth = room.breadth;
        if (!room.clampedWidth()) {
            width = Number(resizeWidth.value);
            if (width > 10 || width < 1) { result.textContent = "Width must be between 1 and 10 meters."; return; }
        }
        if (!room.clampedBreadth()) {
            breadth = Number(resizeBreadth.value);
            if (breadth > 10 || breadth < 1) { result.textContent = "Breadth must be between 1 and 10 meters."; return; }
        }

        map.resizeRoom(room, width, breadth);
    } catch (err) {
        console.error(`Unable to resize. Error: ${err}`);
    }
}

/** Toggles resize option for rooms */
function editRoomsCheckResizeOption() {
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    const editRoomResizeRoomDiv = document.querySelector(editRooms.elementIds.editRoomResizeRoomDiv);
    const resizeWidth = document.querySelector(editRooms.elementIds.resizeWidth);
    const resizeBreadth = document.querySelector(editRooms.elementIds.resizeBreadth);

    // Get Room
    try {
        const room = map.getRoomById(selectedRoom.value);
        if (room === null) {
            result.textContent = `Room id ${selectedRoom.value} was not found in Map.`;
            return;
        }

        if (room.id === 1 || (room.clampedBreadth() && room.clampedWidth())) {
            editRoomResizeRoomDiv.style.display = "none";
        } else {
            editRoomResizeRoomDiv.style.display = "block";
            resizeWidth.disabled = room.clampedWidth();
            resizeWidth.value = room.width;
            resizeBreadth.disabled = room.clampedBreadth();
            resizeBreadth.value = room.breadth;
        }
    } catch (err) {
        result.textContent = "Failed to check room resize option. Error: " + err;
    }
}

//--------------------------------------------------------------------------------------------------------//
// EDITING ROOMS - Movement
//--------------------------------------------------------------------------------------------------------//

/** Attempts room movement */
function editRoomsMoveRoom() {
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    const editRoomMoveToAnchor = document.querySelector(editRooms.elementIds.editRoomMoveToAnchor);
    const editRoomMoveToWall = document.querySelector(editRooms.elementIds.editRoomMoveToWall);

    const room = map.getRoomById(selectedRoom.value);
    const anchorRoom = map.getRoomById(editRoomMoveToAnchor.value);

    if (room === null || anchorRoom === null) {
        result.textContent = `Room id ${selectedRoom.value} or ${editRoomMoveToAnchor.value} was not found in Map.`;
        return;
    }

    const wallDir = editRoomMoveToWall.value;

    try {
        map.moveRoom(room, anchorRoom, wallDir);
        // Refresh general interface when a room has moved.
        createRoomUpdateInterface();
        editRoomsMoveRoomUpdateWalls();
    } catch (err) {
        result.textContent = `Failed to move room with error: ${err}`;
    }
}

/** Toggles movement option for rooms */
function editRoomsCheckMovementOption() {
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    const editRoomChangeAnchorDiv = document.querySelector(editRooms.elementIds.editRoomChangeAnchorDiv);
    const editRoomMoveToAnchor = document.querySelector(editRooms.elementIds.editRoomMoveToAnchor);

    // Get Room
    const room = map.getRoomById(selectedRoom.value);
    if (room === null) {
        result.textContent = `Room id ${selectedRoom.value} was not found in Map.`;
        return;
    }

    if (!room.canBeMoved()) {
        editRoomChangeAnchorDiv.style.display = "none"; // Hide Movement
    } else {
        editRoomChangeAnchorDiv.style.display = "block"; // Show movement
        // Empty anchor and repopulate
        emptySelectionElement(editRoomMoveToAnchor);

        const anchorRooms = map.availableAnchorRooms(room.id);
        if (anchorRooms.length === 0) {
            defaultSelectDisabledHiddenOption(roomAnchor, `No Rooms Available`);
            return;
        }

        for (var i = 0; i < anchorRooms.length; i++) {
            const room = anchorRooms[i];
            const el = document.createElement('option');
            el.textContent = room.reference;
            el.value = room.id;
            editRoomMoveToAnchor.appendChild(el);
        }

        editRoomsMoveRoomUpdateWalls();
    }
}

/** Called by editRoomsCheckMovementOption() and when user changes selected anchor */
function editRoomsMoveRoomUpdateWalls() {
    const editRoomMoveToAnchor = document.querySelector(editRooms.elementIds.editRoomMoveToAnchor);
    const editRoomMoveToWall = document.querySelector(editRooms.elementIds.editRoomMoveToWall);

    emptySelectionElement(editRoomMoveToWall);

    // Get Room
    const room = map.getRoomById(editRoomMoveToAnchor.value);
    if (room === null) {
        result.textContent = `Room id ${editRoomMoveToAnchor.value} was not found in Map.`;
        return;
    }

    const directions = room.getFreePlotDirections();

    for (var i = 0; i < directions.length; i++) {
        const direction = directions[i]
        const el = document.createElement('option');
        el.textContent = direction;
        el.value = direction;
        editRoomMoveToWall.appendChild(el);
    }
}


//--------------------------------------------------------------------------------------------------------//
// EDITING ROOMS - Painting
//--------------------------------------------------------------------------------------------------------//
function editRoomsPaintFloor() {
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    const editRoomPaintMaterial = document.querySelector(editRooms.elementIds.editRoomPaintMaterial);

    const room = map.getRoomById(selectedRoom.value);
    if (room === null) {
        console.error(`Cannot paint floor. Room select with id: ${room.id} was not found in roomList!`);
        editWallOptions.style.display = 'none';
        return;
    }

    map.updateFloorMaterial(room, editRoomPaintMaterial.value);
}

function editRoomsPaintWall() {
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    const selectedWall = document.querySelector(editRooms.elementIds.selectedWall);
    const editRoomPaintMaterial = document.querySelector(editRooms.elementIds.editRoomPaintMaterial);

    const room = map.getRoomById(selectedRoom.value);
    if (room === null) {
        console.error(`Cannot paint wall. Room select with id: ${room.id} was not found in roomList!`);
        editWallOptions.style.display = 'none';
        return;
    }

    const wall = selectedWall.value;
    if (Map.directionToString(wall) === undefined) {
        console.error(`Cannot paint wall.  Invalid wall parameter ${wall}.`);
        return;
    }

    map.updateWallMaterial(room, wall, editRoomPaintMaterial.value);
}

function editRoomsPaintCeiling() {
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    const editRoomPaintMaterial = document.querySelector(editRooms.elementIds.editRoomPaintMaterial);

    const room = map.getRoomById(selectedRoom.value);
    if (room === null) {
        console.error(`Cannot paint ceiling. Room select with id: ${room.id} was not found in roomList!`);
        editWallOptions.style.display = 'none';
        return;
    }

    map.updateCeilingMaterial(room, editRoomPaintMaterial.value);
}

//--------------------------------------------------------------------------------------------------------//
// EDITING ROOMS - Geometric Modification
//--------------------------------------------------------------------------------------------------------//

function editRoomsMakeSolid() {
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    const selectedWall = document.querySelector(editRooms.elementIds.selectedWall);

    const roomId = selectedRoom.value;
    const room = map.getRoomById(roomId);

    if (room === null) {
        console.error(`Cannot Remove Window. Room select with id: ${room.id} was not found in roomList!`);
        editWallOptions.style.display = 'none';
        return;
    }

    const wall = selectedWall.value;
    if (Map.directionToString(wall) === undefined) {
        console.error(`Cannot Remove Window.  Invalid wall parameter ${wall}.`);
        return;
    }

    map.addWall(room, selectedWall.value);
    editRoomsUpdateWallOptions();
}

function editRoomsMakeDoor() {
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    const selectedWall = document.querySelector(editRooms.elementIds.selectedWall);
    const editRoomOpeningRatio = document.querySelector(editRooms.elementIds.editRoomOpeningRatio);
    const editRoomPositionOffset = document.querySelector(editRooms.elementIds.editRoomPositionOffset);

    const roomId = selectedRoom.value;
    const room = map.getRoomById(roomId);

    if (room === null) {
        console.error(`Cannot Make Door. Room select with id: ${room.id} was not found in roomList!`);
        editWallOptions.style.display = 'none';
        return;
    }

    const wall = selectedWall.value;
    if (Map.directionToString(wall) === undefined) {
        console.error(`Cannot Make Door.  Invalid wall parameter ${wall}.`);
        return;
    }

    if (!room.isDoorAllowed(selectedWall.value)) {
        console.error('Room reports a door cannot be created at desired location!');
        return;
    }

    map.addDoor(room, selectedWall.value, editRoomOpeningRatio.value / 100, editRoomPositionOffset.value / 100);
    editRoomsUpdateWallOptions();
}

function editRoomsMakeWindow() {
    const selectedRoom = document.querySelector(editRooms.elementIds.selectedRoom);
    const selectedWall = document.querySelector(editRooms.elementIds.selectedWall);
    const editRoomOpeningRatio = document.querySelector(editRooms.elementIds.editRoomOpeningRatio);
    const editRoomPositionOffset = document.querySelector(editRooms.elementIds.editRoomPositionOffset);

    const roomId = selectedRoom.value;
    const room = map.getRoomById(roomId);

    if (room === null) {
        console.error(`Cannot Make Window. Room select with id: ${room.id} was not found in roomList!`);
        editWallOptions.style.display = 'none';
        return;
    }

    const wall = selectedWall.value;
    if (Map.directionToString(wall) === undefined) {
        console.error(`Cannot Make Window.  Invalid wall parameter ${wall}.`);
        return;
    }

    if (!room.isWindowAllowed(selectedWall.value)) {
        console.error('Room reports a window cannot be created at desired location!');
        return;
    }

    map.addWindow(room, selectedWall.value, editRoomOpeningRatio.value / 100, editRoomPositionOffset.value / 100);
    editRoomsUpdateWallOptions();
}

//--------------------------------------------------------------------------------------------------------//
// CREATE OBJECTS
//--------------------------------------------------------------------------------------------------------//

roomObjects.elementIds = {
    result: '#userInput #result', // Label up top
    selectedRoom: '#roomObjects #roomSelection',

    // Object Creation
    createObjectChoice: '#roomObjects #createObjectChoice',
    createObjectLocation: '#roomObjects #createObjectLocation',

    // Object Modification
    objectIdSelection: '#roomObjects #objectIdSelection',
    roomObjectsModifyScale: '#roomObjects #roomObjectsModifyScale',
    roomObjectsModifyTranslate: '#roomObjects #roomObjectsModifyTranslate',
    roomObjectsModifyRotate: '#roomObjects #roomObjectsModifyRotate',
}

/** Populates catalog and calls Get Room List */
function roomObjects() {
    // Populate object catalogue
    const createObjectChoice = document.querySelector(roomObjects.elementIds.createObjectChoice);

    // Delete all children
    while (createObjectChoice.lastChild) {
        createObjectChoice.removeChild(createObjectChoice.lastChild);
    }

    const objects = objectManager.getObjectCatalogue();

    if (objects.length === 0) {
        defaultSelectDisabledHiddenOption(createObjectChoice, `Catalogue Empty`);
        return;
    }

    for (const object of objects) {
        const elem = document.createElement('option');
        elem.textContent = object;
        elem.value = object;
        createObjectChoice.appendChild(elem);
    }
    roomObjectsGetRooms();
}

/** Lists Rooms available to add objects to them */
function roomObjectsGetRooms() {
    const selectedRoom = document.querySelector(roomObjects.elementIds.selectedRoom);
    // Delete all children
    while (selectedRoom.lastChild) {
        selectedRoom.removeChild(selectedRoom.lastChild);
    }

    const rooms = map.getRooms();

    if (rooms.length === 0) {
        defaultSelectDisabledHiddenOption(selectedRoom, `No Rooms Available`);
        roomObjectsGetWalls();
        return;
    }

    for (const room of rooms) {
        const elem = document.createElement('option');
        elem.textContent = room.reference;
        elem.value = room.id;
        selectedRoom.appendChild(elem);
    }
}

function roomObjectsCreateObject() {
    const result = document.querySelector(roomObjects.elementIds.result);
    const selectedRoom = document.querySelector(roomObjects.elementIds.selectedRoom);
    const createObjectChoice = document.querySelector(roomObjects.elementIds.createObjectChoice);
    const createObjectLocation = document.querySelector(roomObjects.elementIds.createObjectLocation);

    try {
        const room = map.getRoomById(selectedRoom.value);
        if (room === null) {
            result.textContent = `Invalid room - not found in map.`;
            return;
        }

        const objectName = createObjectChoice.value;
        const newLocation = verifyAndSplitPositionText(createObjectLocation.value);

        // Make sure input is numeric and acceptable
        if (!newLocation) {
            result.textContent = `Given Location must in the form of '1,-2,0.5'`;
            return;
        }

        if (room.createObject(objectName, newLocation))
            result.textContent = `Successfully added object`;
        else
            result.textContent = `Object creation unsuccessful`;
    } catch (err) {
        result.textContent = `Failed to add object with error: ${err}`;
    }

    // Update anchors and room walls
    roomObjectsModifyGetObjects();
}

/** Lists objects in a given room to be modified. */
function roomObjectsModifyGetObjects() {
    const selectedRoom = document.querySelector(roomObjects.elementIds.selectedRoom);
    const objectIdSelection = document.querySelector(roomObjects.elementIds.objectIdSelection);

    // Delete all children
    while (objectIdSelection.lastChild) {
        objectIdSelection.removeChild(objectIdSelection.lastChild);
    }
    if (selectedRoom.value === undefined || selectedRoom.value === 'undefined') {
        defaultSelectDisabledHiddenOption(objectIdSelection, `Invalid Room Selected`);
        return;
    }

    const roomId = selectedRoom.value;
    const room = map.getRoomById(roomId);

    if (room === null) {
        console.error(`Cannot Fetch Room Objects. Room select with id: ${roomId} was not found in roomList!`);
        return;
    }

    const activeObjects = room.getActiveObjectsList();

    if (Object.keys(activeObjects).length === 0) {
        defaultSelectDisabledHiddenOption(objectIdSelection, `No Objects Present`);
        return;
    }

    for (const keyId in activeObjects) {
        const elem = document.createElement('option');
        elem.textContent = `${keyId} | ${activeObjects[keyId].name}`;
        elem.value = keyId;
        objectIdSelection.appendChild(elem);
    }
}

/** Modify the actual object being requested 
 * TODO - Implement modification logic into room js
*/
function roomObjectsModifyObject() {
    const selectedRoom = document.querySelector(roomObjects.elementIds.selectedRoom);
    const objectIdSelection = document.querySelector(roomObjects.elementIds.objectIdSelection);
    const roomObjectsModifyScale = document.querySelector(roomObjects.elementIds.roomObjectsModifyScale);
    const roomObjectsModifyTranslate = document.querySelector(roomObjects.elementIds.roomObjectsModifyTranslate);
    const roomObjectsModifyRotate = document.querySelector(roomObjects.elementIds.roomObjectsModifyRotate);

    const room = map.getRoomById(selectedRoom.value);

    if (room === null) {
        result.textContent = `Cannot Modify Object. Room select with id: ${roomId} was not found in roomList!`;
        return;
    }

    const objectId = objectIdSelection.value;

    try {
        const newScale = verifyAndSplitPositionText(roomObjectsModifyScale.value);
        const newTranslate = verifyAndSplitPositionText(roomObjectsModifyTranslate.value);
        const rotationAngle = roomObjectsModifyRotate.value;

        // Make sure input is numeric and acceptable
        if (!newScale || !newTranslate || rotationAngle < -360 || rotationAngle > 360) {
            result.textContent = `Scale and Translation must in the form of '1,-2,0.5'.  Rotation should be a numeric value of angle +-360`;
            return;
        }

        room.modifyObject(Number(objectId), newScale, newTranslate, rotationAngle);
    } catch (err) {
        result.textContent = `Failed to modify object with error: ${err}`;
    }
}

//--------------------------------------------------------------------------------------------------------//
// EXPLORATION
//--------------------------------------------------------------------------------------------------------//
exploration.elementIds = {
    result: '#userInput #result', // Label up top
    selectedSkybox: '#exploration #explorationSkyBox',
}

function exploration () { }

/** Swaps the camera between design and explore mode */
function explorationToggle() {
    if (cameraType === CAM_TYPES.DESIGN) {
        cameraType = CAM_TYPES.EXPLORE;
    } else {
        cameraType = CAM_TYPES.DESIGN;
    }
}

/** When not in Design view, swaps the camera between explore and roam */
function explorationFreeToggle () {
    if (cameraType === CAM_TYPES.DESING)
        return;

    if (cameraType === CAM_TYPES.EXPLORE) {
        cameraType = CAM_TYPES.ROAM;
    } else {
        cameraType = CAM_TYPES.EXPLORE;
    }
}

/** Selects the new input */
function explorationChangeSkybox () {
    const skyBoxSelection = document.querySelector(exploration.elementIds.selectedSkybox);

    skyBoxName = skyBoxSelection.value;
}

//--------------------------------------------------------------------------------------------------------//
// HELPER FUNCTIONS
//--------------------------------------------------------------------------------------------------------//
function emptySelectionElement(selectElement) {
    // Delete all children
    while (selectElement.lastChild) {
        selectElement.removeChild(selectElement.lastChild);
    }
}

roomObjects.utils = {
    coordinatesRegex: /(^[-]?(\d+\.)?\d,[-]?(\d+\.)?\d+,[-]?(\d+\.)?\d+$)/g    // Expected "12,32,55"
}

/** Given a text string in the form of x,y,z verifies it's an acceptable
 * decimal and returns an array of values.
 * @returns {boolean} False if it was unable to parse.
 * @returns {Int32Array} If successfully parsed, containing values.
 */
function verifyAndSplitPositionText(commaDelimitedText) {
    // Make sure input is numeric and acceptable
    if (!commaDelimitedText.match(roomObjects.utils.coordinatesRegex)) {
        return false;
    }
    // Split and convert to number
    return commaDelimitedText.split(',').map(Number);
}

/** Sets a select element with a default value to given message as child option. */
function defaultSelectDisabledHiddenOption(selectElement, message) {
    const defaultMessage = document.createElement('option');
    defaultMessage.disabled = true;
    defaultMessage.selected = true;
    defaultMessage.hidden = true;
    defaultMessage.value = "undefined";
    defaultMessage.textContent = message;
    selectElement.appendChild(defaultMessage);
}
