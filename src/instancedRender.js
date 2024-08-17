import { InstancedPolygons } from "./instancedPolygons.js";
import { InstancedCircles } from "./instancedCircles.js";

export class InstancedRender {
  constructor() {
    this.rendererMap = new Map();
    this.circleRenderer = null;
    this.resetDepthIndex();
  }

  setCircleRenderer(gl, shader) {
    this.setShaderUniforms(shader);
    this.circleRenderer = new InstancedCircles(gl, shader);
  }

  removeCircleRenderer() {
    this.circleRenderer = null;
  }

  resetDepthIndex() {
    this.depthIndex = 0;
  }

  defineShaderUniforms(winres, outlineColor, outlineSize, transitionSmoothness, blendFactor) {
    this.winres = winres;
    this.outlineColor = outlineColor;
    this.outlineSize = outlineSize;
    this.transitionSmoothness = transitionSmoothness;
    this.blendFactor = blendFactor;
  }

  setShaderUniforms(shader) {
    shader.use();
    shader.setVec2("u_winres", this.winres);
    shader.setVec4("u_outline_color", this.outlineColor.rgba(true));
    shader.setFloat("u_outline_size", this.outlineSize);
    shader.setFloat("u_transition_smoothness", this.transitionSmoothness);
    shader.setFloat("u_blend_factor", this.blendFactor);
  }

  setWinres(winres) {
    this.winres = winres;
    for (let renderer of this.rendererMap.values()) {
      renderer.shader.use();
      renderer.shader.setVec2("u_winres", winres);
    }
    if (this.circleRenderer) {
      this.circleRenderer.shader.use();
      this.circleRenderer.shader.setVec2("u_winres", winres);
    }
  }

  setOutlineColor(outlineColor) {
    this.outlineColor = outlineColor;
    for (let renderer of this.rendererMap.values()) {
      renderer.shader.use();
      renderer.shader.setVec4("u_outline_color", outlineColor.rgba(true));
    }
    if (this.circleRenderer) {
      this.circleRenderer.shader.use();
      this.circleRenderer.shader.setVec4("u_outline_color", outlineColor.rgba(true));
    }
  }

  setOutlineSize(outlineSize) {
    this.outlineSize = outlineSize;
    for (let renderer of this.rendererMap.values()) {
      renderer.shader.use();
      renderer.shader.setFloat("u_outline_size", outlineSize);
    }
    if (this.circleRenderer) {
      this.circleRenderer.shader.use();
      this.circleRenderer.shader.setFloat("u_outline_size", outlineSize);
    }
  }

  setTransitionSmoothness(transitionSmoothness) {
    this.transitionSmoothness = transitionSmoothness;
    for (let renderer of this.rendererMap.values()) {
      renderer.shader.use();
      renderer.shader.setFloat("u_transition_smoothness", transitionSmoothness);
    }
    if (this.circleRenderer) {
      this.circleRenderer.shader.use();
      this.circleRenderer.shader.setFloat("u_transition_smoothness", transitionSmoothness);
    }
  }

  setBlendFactor(blendFactor) {
    this.blendFactor = blendFactor;
    for (let renderer of this.rendererMap.values()) {
      renderer.shader.use();
      renderer.shader.setFloat("u_blend_factor", blendFactor);
    }
    if (this.circleRenderer) {
      this.circleRenderer.shader.use();
      this.circleRenderer.shader.setFloat("u_blend_factor", blendFactor);
    }
  }

  addRenderer(name, vertices, gl, shader) {
    this.setShaderUniforms(shader);
    this.rendererMap.set(name, new InstancedPolygons(vertices, gl, shader));
  }

  removeRenderer(name) {
    this.rendererMap.delete(name);
  }

  getRenderer(name) {
    return this.rendererMap.get(name);
  }

  getCircleRenderer() {
    return this.circleRenderer;
  }

  clearRenderer(name) {
    this.rendererMap.get(name).clearBuffers();
  }

  clearCircleRenderer() {
    if (this.circleRenderer) {
      this.circleRenderer.clearBuffers();
    }
  }

  addInstance({name, rotation, size, offset, color}) {
    this.getRenderer(name).addInstance(this.depthIndex, rotation, size, offset, color);
    this.depthIndex--; // we decrease so objects are drawn back to front
  }

  addCircleInstance({size, offset, color}) {
    if (this.circleRenderer) {
      this.circleRenderer.addInstance(this.depthIndex, size, offset, color);
      this.depthIndex--; // we decrease so objects are drawn back to front
    }
  }

  drawRenderer(name) {
    this.rendererMap.get(name).draw(this.depthIndex);
  }

  drawAll() {
    // draw all opaque objects first
    this.rendererMap.forEach((renderer) => {
      renderer.draw(this.depthIndex);
    });
    // then finally the transparent objects (circles - edges are smoothstepped)
    if (this.circleRenderer) {
      this.circleRenderer.draw(this.depthIndex);
    }
  }
  
  clearAll() {
    this.rendererMap.forEach((renderer) => {
      renderer.clearBuffers();
    });

    if (this.circleRenderer) {
      this.circleRenderer.clearBuffers();
    }
  }

  deleteAll() {
  }

  updateBuffers(name) {
    this.rendererMap.get(name).updateAllBuffers();
  }

  updateAllBuffers() {
    this.rendererMap.forEach((renderer) => {
      renderer.updateAllBuffers();
    });

    if (this.circleRenderer) {
      this.circleRenderer.updateAllBuffers();
    }
  }
}