CAM_TYPES = {
    DESIGN: 0,
    EXPLORE: 1,
    ROAM: 2,
};


//--------------------------------------------------------------------------------------------------------//
// Program main entry point
//--------------------------------------------------------------------------------------------------------//
function main () {
    // Initialise context (canvas, gl)

    // Get reference to canvas
    var canvas = document.getElementById("canvas-cg-lab");
    var uiWidth= document.getElementById('userInput').offsetWidth;
    canvas.width = window.innerWidth - uiWidth - 20;
    canvas.height = window.innerHeight;
    canvas.aspect = canvas.width / canvas.height;

    // Assign context to gl
    var gl = null;
    try { gl = canvas.getContext("experimental-webgl", { antialias: true }); }
    catch (e) { alert("No webGL compatibility detected!"); return false; }

    //--------------------------------------------------------------------------------------------------------//
    // Set up scene
    //--------------------------------------------------------------------------------------------------------//
    scene = new Scene();
    scene.initialise(gl, canvas);

    //--------------------------------------------------------------------------------------------------------//
    // Load Textures
    //--------------------------------------------------------------------------------------------------------//
    loadTextures(textures); // Var is defined in textures.js

    //--------------------------------------------------------------------------------------------------------//
    // Set up lights
    //--------------------------------------------------------------------------------------------------------//
    var light = new Light();
    // light.type = Light.LIGHT_TYPE.SPOT;
    // light.type = Light.LIGHT_TYPE.POINT;
    light.type = Light.LIGHT_TYPE.DIRECTIONAL;
    light.setDiffuse([2, 2, 2]);
    light.setSpecular([1, 1, 1]);
    light.setAmbient([1, 1, 1]);
    light.setPosition([0, 0, 2.5]);
    light.setDirection([0.1, -0.25, 1]);
    light.setCone(0.7, 0.6);
    light.attenuation = Light.ATTENUATION_TYPE.NONE;
    light.bind(gl, scene.shaderProgram, 0);

    // var spotLight = new Light();
    // spotLight.type = Light.LIGHT_TYPE.SPOT;
    // // spotLight.type = Light.LIGHT_TYPE.POINT;
    // // spotLight.type = Light.LIGHT_TYPE.DIRECTIONAL;
    // spotLight.setDiffuse([2, 2, 2]);
    // spotLight.setSpecular([1, 1, 1]);
    // spotLight.setAmbient([1, 1, 1]);
    // spotLight.setPosition([0, 0, 0]);
    // spotLight.setDirection([0, 0, 1]);
    // spotLight.setCone(0.7, 0.6);
    // spotLight.attenuation = Light.ATTENUATION_TYPE.NONE;
    // spotLight.bind(gl, scene.shaderProgram, 0);

    //--------------------------------------------------------------------------------------------------------//
    // Set up scene graph
    //--------------------------------------------------------------------------------------------------------//
    skyBoxName = 'sky_noon'; // Set externally from user input
    const lights_dictionary = buildSkyBoxLights(gl);

    buildingNode = scene.addNode(scene.root, null, "rootBuilding", Node.NODE_TYPE.GROUP_ROOT);
    lightNode = scene.addNode(buildingNode, lights_dictionary[skyBoxName], "lightNode", Node.NODE_TYPE.LIGHT);
    // lightNode = scene.addNode(buildingNode, spotLight, "lightNode", Node.NODE_TYPE.LIGHT);

    map = new Map();
    objectManager = new ObjectManager();

    // Create skybox
    let skyboxModel = new Model(geobuilder.buildSkyBoxCube(), buildBasicMaterial(skyBoxName), scene);
    let skyboxNode = scene.addNode(lightNode, skyboxModel, null, Node.NODE_TYPE.MODEL);
    //--------------------------------------------------------------------------------------------------------//
    // Set up animation
    //--------------------------------------------------------------------------------------------------------//
    var ang = 0;

    // var Vec3 = matrixHelper.vector3;
    var Mat4x4 = matrixHelper.matrix4;

    var lightTransform = Mat4x4.create();
    var modelTransform = Mat4x4.create();
    var viewTransform = Mat4x4.create();
    // var observer = Vec3.zero; // Set during animation, original value ignored

    Mat4x4.makeIdentity(viewTransform);
    Mat4x4.makeIdentity(modelTransform);
    Mat4x4.makeIdentity(lightTransform);

    //--------------------------------------------------------------------------------------------------------//
    // Set up render loop
    //--------------------------------------------------------------------------------------------------------//
    // Create Camera, no params should use default
    // camera = new DesignCamera(canvas);
    camera = new DesignCamera(canvas);
    // Remove skybox
    const skyNodeObject = skyboxNode.nodeObject;
    skyboxNode.nodeObject = false;

    cameraType = 0; 
    var theta = 0; // Represents an angle we might choose to transform
    let currentSky = skyBoxName;
    var animate = function () {
        // theta += 0.01; // Increment rotation angle - not needed currently
        // From user input - update camera
        if (cameraType === CAM_TYPES.DESIGN && !(camera instanceof DesignCamera)) {
            camera = new DesignCamera(canvas);
            skyboxNode.nodeObject = false;
        } else if ((cameraType === CAM_TYPES.EXPLORE || cameraType === CAM_TYPES.ROAM) &&
            !(camera instanceof ExplorationCamera)) {
            camera = new ExplorationCamera(canvas);
            skyboxNode.nodeObject = skyNodeObject;
        }

        if ( camera instanceof ExplorationCamera && currentSky != skyBoxName) {
            changeSkyBox(skyboxNode, lights_dictionary[skyBoxName], skyBoxName);
            currentSky = skyBoxName;
        }

        camera.update()

        scene.beginFrame();
        scene.animate();
        scene.draw();
        scene.endFrame();

        window.requestAnimationFrame(animate);
    };

    // Go!
    animate();
};

/** Builds lights for morning, noon, dusk and night */
function buildSkyBoxLights (gl) {
    // Morning Bright
    const sky_morn = new Light();
    sky_morn.type = Light.LIGHT_TYPE.DIRECTIONAL;
    sky_morn.setDiffuse([2, 2, 2]);
    sky_morn.setSpecular([0.1,0.1,0.1]);
    sky_morn.setAmbient([0.8, 0.8, 1]);
    sky_morn.setPosition([0, 0, 0]);
    sky_morn.setDirection([0.1, -0.25, 1]);
    sky_morn.setCone(0.7, 0.6);
    sky_morn.attenuation = Light.ATTENUATION_TYPE.NONE;
    sky_morn.bind(gl, scene.shaderProgram, 0);

    // Noon directly overhead
    const sky_noon = new Light();
    sky_noon.type = Light.LIGHT_TYPE.DIRECTIONAL;
    sky_noon.setDiffuse([2, 2, 2]);
    sky_noon.setSpecular([0.1,0.1,0.1]);
    sky_noon.setAmbient([1, 1, 1]);
    sky_noon.setPosition([0, 0, 0]);
    sky_noon.setDirection([0.25, -0.8, 0.25]);
    // sky_noon.setCone(0.7, 0.6);
    sky_noon.attenuation = Light.ATTENUATION_TYPE.NONE;
    sky_noon.bind(gl, scene.shaderProgram, 0);

    // Dusk, reddening
    const sky_dusk = new Light();
    sky_dusk.type = Light.LIGHT_TYPE.DIRECTIONAL;
    sky_dusk.setDiffuse([2, 2, 2]);
    sky_dusk.setSpecular([0.1,0.1,0.1]);
    sky_dusk.setAmbient([1, 0.8, 0.7]);
    sky_dusk.setPosition([0, 0, 0]);
    sky_dusk.setDirection([0, -0.25, -1]);
    // sky_dusk.setCone(0.7, 0.6);
    sky_dusk.attenuation = Light.ATTENUATION_TYPE.NONE;
    sky_dusk.bind(gl, scene.shaderProgram, 0);

    // Night, dark
    const sky_night = new Light();
    sky_night.type = Light.LIGHT_TYPE.DIRECTIONAL;
    sky_night.setDiffuse([2, 2, 2]);
    sky_night.setSpecular([0.1,0.1,0.1]);
    sky_night.setAmbient([0.1, 0.1, 0.3]);
    sky_night.setPosition([0, 0, 0]);
    sky_night.setDirection([3, 6, 3]);
    // sky_dusk.setCone(0.7, 0.6);
    sky_night.attenuation = Light.ATTENUATION_TYPE.NONE;
    sky_night.bind(gl, scene.shaderProgram, 0);

    return { sky_morn: sky_morn, sky_noon: sky_noon, sky_dusk: sky_dusk, sky_night: sky_night };
}

function changeSkyBox (skyNode, skyLight, materialName) {
    // Change light to given
    lightNode.nodeObject = skyLight;
    // Update skybox material
    skyNode.nodeObject.material = buildBasicMaterial(materialName);
}