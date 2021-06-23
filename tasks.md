## Task 1
- Create a camera class [done]
- Introduce positional and target arguments [done]
- create orthographic projection matrix [done]
- make orthographic vs perspective mode swappable [done]

## Task 2
- Include Materials [done]
- Calculate room positions when set and from neighbours [done]
- Build walls based on existing wall - clone nodes and rotate Y [replaced]
 - Every geometry is built with cuboids, no rotations necessary.  everything is placed with correct sizing.
- Scene nodes go under room node for appropriate transformations [done]
- Translate room scene node to its correct position [done]
- Translate wall components to position [done]
- Update user inputs to include materials for floor, walls and ceiling.

## Task 3
- Primary doorway to root room.  South of it may be occupied by a special grass area. [InProg]
 - Create southern entrance to room [done]
 - Create doorway functionality [done]
- MakeNeighbours must also share walls [done]
- rotation needs to be carried out correctly [done-manually]
- Shared walls will pass through create doorway function [done]
- Create a doorway and window will be new functions leveraging cuboid abilities. [doorway-done] [window-pending]
 - An 'opened wall' will be placed under a group node to fit under appropriate scene node.[cancelled]
 - 3 cuboids for doorway, 4 cuboids for window [doorway-done] [window-pending]
 - cuboids are constructed centered along correct orientation, translated to be next to each other, above and below as necessary.[done]
 - Likely require perspective exploration to confirm result OR orient it upwards on Z axis to test at first, translated way out of position.[confirmed]
- Door should not be created automatically for all neighbours, only the first neighbor.[done]

- User must be able to add additional doors [complete]
 - Selecting Which Room and Wall to Door [done]
    - Get a list of rooms which have more than 1 neighbour (just 1 will have a door automatically created)
    - For each selected room list directions which have neighbours, and wall type is SOLID
 - Creating door [done]
    - Given a room and direction, we grab that directions' nieghbour as secondary.
    - Geobuilder.create 

- User must be able to add windows [complete]
 - Selecting Which Room and Wall to Window [done]
    - Get a list of rooms which are not full (have open spaces for windows)
    - For each selected room list the directions with wall types that are SOLID wall type
 - Creating a window [done]
    - Given a room and direction, we grab that direction's neighbour as secondary.
    - Geobuilder.create window (depending on orientation)
    - Similar logic to doorway creation when combining both together
    - Update correct wall types for both rooms

## Task 4
- Selection of Rooms
   - Introduce a new HTML component called `Room Editing`. [done]
   - Allow selection of all rooms from roomlist.
   - When a room is selected the options made available:
      - Change Dimensions (Check for clamping by neighbours) [done]
      - Change Materials for all geometry [walls-partial] [roof/ceiling-pending]
      - Change Door and Window Sizes [annoying-given-current-setup]
      - Move Room (**to be deferred**) [to locate new anchor, check dimensions, check collisions and check neighbours to root]
      - Remove Door [done]
      - Remove Window [done]

- Resizing by clamping dimensions and collision checking
   - Collision.js storing dictionary of rooms and their colliderbounds [done]
   - Basic collision detection when overlapping [done]
   - neighbouring logic to only apply when room dimensions are the same and proximity touches.


# Ideas
- Room walls initially created as idN or idS_wall or idE_wall
 - Neighbours become origIdN_secIdS_door
- 