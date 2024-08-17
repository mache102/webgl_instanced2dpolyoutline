
import { vec2 } from './vec2.js';
import { polar_vec2 } from './polar_vec2.js';

import earcut from 'https://cdn.jsdelivr.net/npm/earcut/+esm';

const roundedCornerDirections = [
  5 * Math.PI / 4,
  3 * Math.PI / 4,
  1 * Math.PI / 4,
  5 * Math.PI / 4,
  1 * Math.PI / 4,
  7 * Math.PI / 4
];

/*
outline rounded corners for a polygon (inputted as an array of vertices)

v: original vertex
1,2,3,4: corner vertices (after applying directions in vertex shader) (5, 3, 1, 7)

  2----+----3
  | \     / |
  |   \ /   |
  +    v    +
  |   / \   |
  | /     \ |
  1----+----4

*/
export function outlineRoundedCorners(vertices) {
  let cornerVertices = [];
  let cornerDirections = [];

  function addCorner(vertex) {
    if (vertex instanceof polar_vec2) {
      vertex = vertex.xy();
    }
    for (let i = 0; i < 6; i++) { 
      cornerVertices.push(vertex.x, vertex.y);
    }
  }

  function addDirections() {
    cornerDirections.push(...roundedCornerDirections);
  }

  for (let i = 0; i < vertices.length; i++) {
    addCorner(vertices[i]);
    addDirections();
  }

  return { cornerVertices, cornerDirections };
}

/*
outlines for a polygon (inputted as an array of vertices)

vertices: v1, v2, ..., vn
line impl vertices: v1,v2, v1,v2, | v2,v3, v2,v3, | ..., vn-1,vn, vn-1,vn, | vn,v1, vn,v1

1, 2: v1, v2
+, -: 1, 0 as a bit in attribute
two triangles:
  a. 1-, 1+, 2+
  b. 1-, 2+, 2-

  -====2====+
  |    |   /|
  |    |  / |
  |    | /  |
  |    |/   | 
  |    |    |
  |   /|    |
  |  / |    |
  | /  |    |
  |/   |    |
  -====1====+

*/
export function lineImplAttributes(vertices) {
  let lineVertices = [];
  let lineDirections = [];

  // 1 1 2 1 2 2
  function addLine(v1, v2) {
    lineVertices.push(v1.x, v1.y, v1.x, v1.y, v2.x, v2.y);
    lineVertices.push(v1.x, v1.y, v2.x, v2.y, v2.x, v2.y);
  }

  // - + + - + -
  function addDirections(v1, v2) {
    let direction = Math.atan2(v2.y - v1.y, v2.x - v1.x);
    let neg = direction + Math.PI / 2;
    let pos = direction - Math.PI / 2;
    lineDirections.push(neg, pos, pos, neg, pos, neg);
  }

  for (let i = 0; i < vertices.length; i++) {
    let v1 = vertices[i];
    let v2 = vertices[(i + 1) % vertices.length];
    if (v1 instanceof polar_vec2) {
      v1 = v1.xy();
    }
    if (v2 instanceof polar_vec2) {
      v2 = v2.xy();
    }
    // console.log(`i=${i}, v1=${v1.print()}, v2=${v2.print()}`);
    addLine(v1, v2);
    addDirections(v1, v2);
  }

  return { lineVertices, lineDirections };
}


/*
flatten vec2s and polarvec2s
*/
export function flattenVertices(vertices) {
  let flatVertices = [];
  for (let i = 0; i < vertices.length; i++) {
    let v = vertices[i];
    if (v instanceof polar_vec2) {
      v = v.xy();
      flatVertices.push(v.x, v.y);
    } else if (v instanceof vec2) {
      flatVertices.push(v.x, v.y);
    } else if (v instanceof Number) {
      flatVertices.push(v);
    } else {
      throw new Error(`Invalid vertex (type ${typeof v}): ${v}`);
    }
  }
  return flatVertices;
}

/*
input array of vec2s, polarvec2s, or numbers
return array of numbers [all vec2]
*/
export function getEarcutVertices(vertices) {
  let flatVertices = flattenVertices(vertices);
  const indices = earcut(flatVertices, null, 2);

  let outputVertices = [];
  for (let i = 0; i < indices.length; i++) {
    let i0 = 2 * indices[i];
    outputVertices.push(flatVertices[i0], flatVertices[i0 + 1]);
  }
  return outputVertices;
}