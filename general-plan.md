# BiniTool
A CAD tool to be built with HTML and Javascript

## Lecturer Suggestion
Until the 15th, it's best to go over the assignment and start work on it.
Work on Assignment until stuck, and review notes and code to make sense of the structure given.


## Tasks
- UI mode
 - Camara moves like an RTS, starts (0,5,0) pointing down (0,-1,0)
 - WASD to move on Y plane (x,5,z)
 - + and - to zoom in and out
- World space
 - Must be a grid, everything snaps to them
 - Objects placed must consider children attached to them, such that a translation on the parent will also effect the children
 
 
# Data Structures
The following sections will be broken down into DS:

- World space
 - This is a collection of objects contained within, and is able to organize everything within its own **grid**
 - Grids should be adaptable, square dimensions of 10cm to 10m
 - Grids snap items to them.  Snapping rounds to grid resolution
 - Snap can be disblaed allowing placement anywhere.
 - Snap on means everything rotates every 90 degrees.
 - Dimensions should also be made present indicating sizes on the x and z axis
  - This can be done using an elongated quad with a texture describing the dimension
- Room
 - A room is special since it connects to other rooms.  The first room in the world is created with just *width and breadth* dimensions and centered on (0,0,0)
 - A room is made up of 4 walls, a floor and no ceiling
 - Rooms will contain within them children objects (furniture)
 - Rooms might also need to separately contain lights
- Furniture
 - Furniture placed has a boolean of grounded or not
 - Grounded furniture that overlap must push each other aside and fit within the room
  - An algorithm must determine how this movement happens, simple would be best
  - If simple placement is not possible, prompt the user that such an action is not allowed due to space constraints
 - Items that are not grounded can stack on top of each other
- Groups
 - Group structures will be able to contain a set of objects within them.
 - Changing materials of one group will affect the other as well
 
# Walls, Windows and Doors
It's required to allow walls to be modified with walls and windows.  Therefore a cuboid that represents a wall when a window is added or present, that cuboid needs to be subtracted by the window, and the remaining walls are separated into their own cuboids.
