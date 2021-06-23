var textures = new Textures();
function Textures() {
    this.planks = 'assets/imgs/planks.png';
    this.planks2 = 'assets/imgs/planks2.png';
    this.grass = 'assets/imgs/grass.png';
    this.wood = 'assets/imgs/wood.png';
    this.stone = 'assets/imgs/stone.png';
    this.orange = 'assets/imgs/orange.jpg';
    this.redCloth = 'assets/imgs/redCloth.jpg';
    this.sky_morn = 'assets/skyboxes/skybox_morning.jpg';
    this.sky_noon = 'assets/skyboxes/skybox_noon.jpg';
    this.sky_dusk = 'assets/skyboxes/skybox_dusk.png';
    this.sky_night = 'assets/skyboxes/skybox_night.jpg';
}

/** Converts file names from Texture Constructor into images stored on page. */
function loadTextures(textureList) {
    for (var e in textureList) {
        var img = document.createElement("img");
        var imgContainer = document.getElementById("imageCollection");
        img.src = textureList[`${e}`];
        imgContainer.appendChild(img);

        textureList[`${e}`] = img;
    };
}

/** Builds a material from image file available */
function buildBasicMaterial(texName) {
    const newMaterial = new Material();
    newMaterial.setAlbedo(scene.gl, textures[texName]);
    newMaterial.setShininess(96.0);
    newMaterial.setSpecular([1, 1, 1]);
    newMaterial.setAmbient([1, 1, 1]);
    newMaterial.setDiffuse([1, 1, 1]);
    newMaterial.bind(scene.gl, scene.shaderProgram);
    return newMaterial;
};