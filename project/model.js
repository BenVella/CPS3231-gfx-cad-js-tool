function Model(geometry = { vertex: [], index: [] }, material = null, scene = null) 
{
	this.name = "untitled";
	
	this.vertex = geometry.vertex;
	this.vertexBuffer = null;

	this.index = geometry.index;
	this.indexBuffer = null;
	
    this.material = material;
    
    if (scene) {
        this.compile (scene);
    }
}

Model.VERTEX_OFFSET = {
	positions: 0, // 0, 1, 2
	normals: 3, // 3, 4, 5
	colors: 6, // 6, 7, 8
	uvs: 9 // 9, 10
}

/** Returns an array of vertices */
Model.prototype.getChunkFromVertices = function (vertexOffset) {
	const result = [];

	// Chunks of 11 - 3 pos, 3 norms, 3 colors, 2 uv
	for (let i = 0; i < this.vertex.length / 11; i++) {
		result.push(this.vertex[i*11 + vertexOffset]);
		result.push(this.vertex[i*11 + vertexOffset + 1]);
		result.push(this.vertex[i*11 + vertexOffset + 2]);
	}

	return result;
}

/** Returns an array of vertices */
Model.prototype.getPositionVertices = function () {
	return this.getChunkFromVertices(Model.VERTEX_OFFSET.positions);
}

/** Returns an array of vertices */
Model.prototype.getNormalVertices = function () {
	return this.getChunkFromVertices(Model.VERTEX_OFFSET.normals);
}

/** Returns an array of vertices */
Model.prototype.getColorVertices = function () {
	return this.getChunkFromVertices(Model.VERTEX_OFFSET.colors);
}

/** Returns an array of vertices */
Model.prototype.getUvVertices = function () {
	return this.getChunkFromVertices(Model.VERTEX_OFFSET.uvs);
}

Model.prototype.compile = function(scene)
{
	this.vertexBuffer = scene.gl.createBuffer();
  	scene.gl.bindBuffer(scene.gl.ARRAY_BUFFER, this.vertexBuffer);
  	scene.gl.bufferData(scene.gl.ARRAY_BUFFER, new Float32Array(this.vertex), scene.gl.STATIC_DRAW);

  	this.indexBuffer = scene.gl.createBuffer();
  	scene.gl.bindBuffer(scene.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  	scene.gl.bufferData(scene.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.index), scene.gl.STATIC_DRAW);
}

Model.prototype.draw = function(scene, transform) 
{
	if (this.indexBuffer == null || this.vertexBuffer == null) 
	{
		throw ("Cannot bind index or vertex buffer for model " + this.name + "!");
		return;
	}

	if (this.material == null) 
	{
		throw (this.name + " has no material assigned!");
		return;
	}

	scene.setModel(transform);
	scene.updateModel();
	scene.bindModelData(this.vertexBuffer, this.indexBuffer);

	this.material.use(scene.gl);
    
    scene.gl.drawElements(scene.gl.TRIANGLES, this.index.length, scene.gl.UNSIGNED_SHORT, 0);
}