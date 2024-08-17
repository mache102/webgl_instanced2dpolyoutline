export class InstancedCircles  {
  constructor(gl, shader) {
    this.shader = shader;
    this.gl = gl;

    this.clearBuffers();
    this.createGlBuffers();
    this.bindSharedVAs();

    this.coords = [
      -1, -1, 
      -1, 1,
      1, 1,
      -1, -1, 
      1, 1,
      1, -1
    ];
    this.updateCoordBuffer();
  }

  createGlBuffers() {
    this.vao = this.gl.createVertexArray();

    this.indexBuffer = this.gl.createBuffer();
    this.coordBuffer = this.gl.createBuffer();
    this.sizeBuffer = this.gl.createBuffer();
    this.offsetBuffer = this.gl.createBuffer();
    this.colorBuffer = this.gl.createBuffer();
  }

  bindSharedVAs() {
    this.gl.bindVertexArray(this.vao);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.indexBuffer);
    const indexLoc = this.shader.getAttribLocation("a_index");
    this.gl.vertexAttribPointer(indexLoc, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(indexLoc);
  
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.coordBuffer);
    const coordLoc = this.shader.getAttribLocation("a_coord");
    this.gl.vertexAttribPointer(coordLoc, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(coordLoc);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer);
    const sizeLoc = this.shader.getAttribLocation("a_size");
    this.gl.vertexAttribPointer(sizeLoc, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(sizeLoc);
  
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.offsetBuffer);
    const offsetLoc = this.shader.getAttribLocation("a_offset");
    this.gl.vertexAttribPointer(offsetLoc, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(offsetLoc);
  
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    const colorLoc = this.shader.getAttribLocation("a_color");
    this.gl.vertexAttribPointer(colorLoc, 4, this.gl.UNSIGNED_BYTE, true, 0, 0);
    this.gl.enableVertexAttribArray(colorLoc);
  
    this.gl.vertexAttribDivisor(indexLoc, 1);
    this.gl.vertexAttribDivisor(sizeLoc, 1);
    this.gl.vertexAttribDivisor(offsetLoc, 1);
    this.gl.vertexAttribDivisor(colorLoc, 1);
  }

  clearBuffers() {
    this.indexs = [];
    this.sizes = [];
    this.offsets = [];
    this.colors = [];
  }

  addInstance(index, size, offset, color) {
    this.indexs.push(index);
    this.sizes.push(size);
    this.offsets.push(offset.x, offset.y);
    this.colors.push(color.r, color.g, color.b, color.a);
  }

  updateIndexBuffer() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.indexs), this.gl.STATIC_DRAW);
  }

  updateCoordBuffer() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.coordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.coords), this.gl.STATIC_DRAW);
  }

  updateSizeBuffer() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.sizes), this.gl.STATIC_DRAW);
  }

  updateOffsetBuffer() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.offsetBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.offsets), this.gl.STATIC_DRAW);
  }

  updateColorBuffer() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Uint8Array(this.colors), this.gl.STATIC_DRAW);
  }
  
  updateAllBuffers() {
    this.shader.use();
    this.updateIndexBuffer();
    this.updateSizeBuffer();
    this.updateOffsetBuffer();
    this.updateColorBuffer();
  }

  draw(maxDepthIndex) {
    this.gl.bindVertexArray(this.vao);
    
    this.shader.use();
    this.shader.setUint("u_polygon_count", Math.abs(maxDepthIndex));
    this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, this.coords.length / 2, this.indexs.length);

  }

}