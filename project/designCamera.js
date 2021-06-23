function DesignCamera(canvas) {
    console.log('Loading Design Camera');
    this.Vec3 = matrixHelper.vector3;
    this.position = matrixHelper.vector3.from(0, 30, 0); // Camera location
    this.target = matrixHelper.vector3.from(0, 0, 0);  // Camera pointing at location
    this.up = matrixHelper.vector3.from(0,0,1);
    this.controls = { // Camera movement
        left: false,
        right: false,
        up: false,
        down: false,
        magnify: false,
        minify: false
    };
    this.topdown = {  // Movement vectors -- TODO REVISE
        /** WebGL uses right handed coordinate system (x grows left).
         * Left will be positive, right will be negative.
         * Up will be positive, down will be negative.
         **/

        left: [1, 0, 0],
        right: [-1, 0, 0],
        up: [0, 0, 1],
        down: [0, 0, -1],
        in: [0, 1, 0],
        out: [0, -1, 0]
    }
    this.speed = 0.3; // Camera pan speed
    this.zoomStep = 0.2; // Zoom speed
    this.boundaries = {
        minZoom: 40,
        maxZoom: 3,
    }
    this.viewPort = { // Orthographic Canonical Camera size
        size: this.boundaries.minZoom
    };

    console.log('Binding key listeners');
    canvas.onkeydown = DesignCamera.keyDownHandler.bind(this);
    canvas.onkeyup = DesignCamera.keyUpHandler.bind(this);

    console.log('Setting Canonical View Volume');

    this.updateCanonical();
}

// Reference must be made to instanced object (from script.js) as `camera`
DesignCamera.keyDownHandler = function (e) {
    e.preventDefault();
    switch (e.key.toLowerCase()) {
        case 'a': // left
            this.controls.left = true;
            break;
        case 'w': // up
            this.controls.up = true;
            break;
        case 'd': // right
            this.controls.right = true;
            break;
        case 's': // down
            this.controls.down = true;
            break;
        case '+': // magnify
            this.controls.magnify = true;
            break;
        case '-':
            this.controls.minify = true;
            break;
    }
}

// Reference must be made to instanced object (from script.js) as `camera`
DesignCamera.keyUpHandler = function (e) {
    e.preventDefault();
    switch (e.key.toLowerCase()) {
        case 'a': // left
            this.controls.left = false;
            break;
        case 'w': // up
            this.controls.up = false;
            break;
        case 'd': // right
            this.controls.right = false;
            break;
        case 's': // down
            this.controls.down = false;
            break;
        case '+': // magnify
            this.controls.magnify = false;
            break;
        case '-':
            this.controls.minify = false;
            break;
    }
}

/* Updates position of camera based on speed and delta time */
DesignCamera.prototype.update = function () {
    const pos_adjustment = this.Vec3.from(0, 0, 0);

    if (this.controls.left)
        this.Vec3.add(pos_adjustment, pos_adjustment, this.topdown.left);
    if (this.controls.right)
        this.Vec3.add(pos_adjustment, pos_adjustment, this.topdown.right);
    if (this.controls.up)
        this.Vec3.add(pos_adjustment, pos_adjustment, this.topdown.up);
    if (this.controls.down)
        this.Vec3.add(pos_adjustment, pos_adjustment, this.topdown.down);
    if (this.controls.minify) {
        // Make the camera larger
        this.viewPort.size += this.zoomStep;
        // this.Vec3.add(pos_adjustment, pos_adjustment, this.topdown.in);
    }
    if (this.controls.magnify) {
        // Make the camera smaller
        this.viewPort.size -= this.zoomStep;
        // this.Vec3.add(pos_adjustment, pos_adjustment, this.topdown.out);
    }

    // Clamp between min and max zoom
    this.viewPort.size = Math.min(this.boundaries.minZoom, Math.max(this.boundaries.maxZoom, this.viewPort.size));

    if (this.controls.magnify || this.controls.minify) {
        this.updateCanonical();
    }

    // Normalise adjustment to maintain static speed
    if (this.Vec3.length(pos_adjustment) > Number.EPSILON) {
        this.Vec3.normalise(pos_adjustment, pos_adjustment);
        // Apply speed effect for noticeable changes
        this.Vec3.mult(pos_adjustment, pos_adjustment, this.speed);
        // Modify camer'as position by adjustment
        this.Vec3.add(this.position, this.position, pos_adjustment);
        // Set our camera's target to be 1 unit below the camera.
        this.Vec3.to(this.target, this.position);
        // Have the target 1 unit below the camera's position, until 0.
        this.target[1] = Math.max(0, this.target[1] - 1);
    }

    scene.lookAt(this.position, this.target, this.up); // Camera
}

DesignCamera.prototype.updateCanonical = function () {
    var size = this.viewPort.size / 2;
    scene.setViewOrthographic(
        -size, size,
        -size, size,
        -50, 50
    );
}