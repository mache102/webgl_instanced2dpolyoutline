import { vec2 } from "./vec2.js";
import { polar_vec2 } from "./polar_vec2.js";
import { lineImplAttributes, outlineRoundedCorners, flattenVertices, getEarcutVertices } from "./polygon_utils.js";

export class InstancedPolygons  {
  constructor(vertices, gl, mainShader) {
    this.shader = mainShader;
    this.gl = gl;

    // cached attr locations
    this.indexLoc = this.shader.getAttribLocation("a_index");
    this.coordLoc = this.shader.getAttribLocation("a_coord");
    this.outlineDirectionLoc = this.shader.getAttribLocation("a_outline_direction");
    this.rotationLoc = this.shader.getAttribLocation("a_rotation");
    this.sizeLoc = this.shader.getAttribLocation("a_size");
    this.offsetLoc = this.shader.getAttribLocation("a_offset");
    this.colorLoc = this.shader.getAttribLocation("a_color");
    
    this.clearBuffers();
    this.createGlBuffers();
    this.bindSharedVAs();
    this.updatePolygonBuffer();

    this.setCoords(getEarcutVertices(vertices));
    this.setOutlineCoords(lineImplAttributes(vertices));
    this.setCornerCoords(outlineRoundedCorners(vertices));
  }

  setCoords(vertices) {
    this.coords = vertices;
    console.log(`coords.length: ${this.coords.length}`);
    this.updateCoordBuffer();
  }

  setOutlineCoords({lineVertices, lineDirections}) {
    this.outlineCoords = lineVertices;
    this.outlineDirections = lineDirections;
    console.log(`outlineCoords.length, outlineDirections.length: ${this.outlineCoords.length}, ${this.outlineDirections.length}`);
    this.updateOutlineBuffers();
  }

  setCornerCoords({cornerVertices, cornerDirections}) {
    this.cornerCoords = cornerVertices;
    this.cornerDirections = cornerDirections;
    console.log(`cornerCoords.length, cornerDirections.length: ${this.cornerCoords.length}, ${this.cornerDirections.length}`);
    this.updateCornerBuffers();
  }

  createGlBuffers() {
    this.vao = this.gl.createVertexArray();

    this.indexBuffer = this.gl.createBuffer();

    this.coordBuffer = this.gl.createBuffer();
    this.outlineDirectionBuffer = this.gl.createBuffer();  

    // shared
    this.rotationBuffer = this.gl.createBuffer();
    this.sizeBuffer = this.gl.createBuffer();
    this.offsetBuffer = this.gl.createBuffer();
    this.colorBuffer = this.gl.createBuffer();
  }

  updatePolygonBuffer() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.coordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.coords), this.gl.STATIC_DRAW);
  }

  updateOutlineBuffers() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.coordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.outlineCoords), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.outlineDirectionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.outlineDirections), this.gl.STATIC_DRAW);
  }
  
  updateCornerBuffers() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.coordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cornerCoords), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.outlineDirectionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cornerDirections), this.gl.STATIC_DRAW);
  }

  bindSharedVAs() {
    this.gl.bindVertexArray(this.vao);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.indexBuffer);
    this.gl.vertexAttribPointer(this.indexLoc, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.indexLoc);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.coordBuffer);
    this.gl.vertexAttribPointer(this.coordLoc, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.coordLoc);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.outlineDirectionBuffer);
    this.gl.vertexAttribPointer(this.outlineDirectionLoc, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.outlineDirectionLoc);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rotationBuffer);
    this.gl.vertexAttribPointer(this.rotationLoc, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.rotationLoc);
  
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer);
    this.gl.vertexAttribPointer(this.sizeLoc, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.sizeLoc);
  
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.offsetBuffer);
    this.gl.vertexAttribPointer(this.offsetLoc, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.offsetLoc);
  
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.vertexAttribPointer(this.colorLoc, 4, this.gl.UNSIGNED_BYTE, true, 0, 0);
    this.gl.enableVertexAttribArray(this.colorLoc);
  
    this.gl.vertexAttribDivisor(this.indexLoc, 1);
    this.gl.vertexAttribDivisor(this.rotationLoc, 1);
    this.gl.vertexAttribDivisor(this.sizeLoc, 1);
    this.gl.vertexAttribDivisor(this.offsetLoc, 1);
    this.gl.vertexAttribDivisor(this.colorLoc, 1);
  }

  clearBuffers() {
    this.indexs = [];
    this.rotations = [];
    this.sizes = [];
    this.offsets = [];
    this.colors = [];
  }
  // adds an instance of the polygon to the buffer and returns the updated index
  addInstance(index, rotation, size, offset, color) {
    this.indexs.push(index);
    this.rotations.push(rotation);
    if (size instanceof vec2) {
      this.sizes.push(size.x, size.y);
    } else {
      this.sizes.push(size, size);
    }
    this.offsets.push(offset.x, offset.y);
    this.colors.push(color.r, color.g, color.b, color.a);
  }

  updateIndexBuffer() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.indexs), this.gl.STATIC_DRAW);
  }

  updateCoordBuffer() {
    this.shader.use();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.coordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.coords), this.gl.STATIC_DRAW);
  }

  updateRotationBuffer() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rotationBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.rotations), this.gl.STATIC_DRAW);
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
    this.updateRotationBuffer();
    this.updateSizeBuffer();
    this.updateOffsetBuffer();
    this.updateColorBuffer();
  }

  draw(maxDepthIndex) {
    let instanceCount = this.indexs.length;
    if (instanceCount === 0) {
      return;
    }
    this.shader.use();
    this.shader.setFloat("u_polygon_count", Math.abs(maxDepthIndex));

    this.gl.bindVertexArray(this.vao);

    // 1. main polygon
    this.shader.setFloat("u_draw_outline", 0.0);
    this.updatePolygonBuffer();
    this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, this.coords.length / 2, instanceCount);

    // 2. outline
    this.shader.setFloat("u_draw_outline", 1.0);
    this.updateOutlineBuffers();
    this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, this.outlineCoords.length / 2, instanceCount);

    // 3. corners
    this.shader.setFloat("u_draw_outline", 2.0);
    this.updateCornerBuffers();
    this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, this.cornerCoords.length / 2, instanceCount);
  }

  getPolygonCount() {
    return this.indexs.length;
  }
}