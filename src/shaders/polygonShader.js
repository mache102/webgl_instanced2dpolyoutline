/*

lowp: 8-bit fixed-point
mediump: 16-bit fixed-point
highp: 24-bit fixed-point

order: rotate, scale (size), translate (offset)
xy: pixel space: (-winres/2 to +winres/2); origin at center
xy + half_winres: to gl_FragCoord space: (0,0) to (winres.x, winres.y)
xy / half_winres: to NDC [-1, 1] space
*/

export const polygonShader_vert = `#version 300 es
precision mediump float;

in float a_index;
in vec2 a_coord;
in float a_outline_direction;
in float a_rotation;
in vec2 a_size;
in vec2 a_offset;
in vec4 a_color;

out vec4 v_color;
out vec2 v_offset;

uniform vec2 u_winres;
uniform float u_polygon_count;
uniform float u_outline_size;
uniform float u_draw_outline;

const float DRAW_REGULAR = 0.;
const float DRAW_OUTLINE = 1.;
const float DRAW_OUTLINE_CORNER = 2.;
const float SQRT2 = 1.41421356237;

vec2 rotateVec2(vec2 v, float angle) {
  return vec2(
    v.x * cos(angle) - v.y * sin(angle),
    v.x * sin(angle) + v.y * cos(angle)
  );
}

void main(void) {
  v_color = a_color;
  vec2 half_winres = u_winres / 2.0;
  v_offset = vec2(0.);

  vec2 coord = rotateVec2(a_coord * a_size, a_rotation) + a_offset;
  float z = a_index;
  if (u_draw_outline == DRAW_REGULAR) {
    z /= u_polygon_count;  

  } else if (u_draw_outline == DRAW_OUTLINE) {
    coord += vec2(
      cos(a_outline_direction + a_rotation), 
      sin(a_outline_direction + a_rotation)
    ) * u_outline_size;
    z = (z - 0.5) / u_polygon_count;

  } else { // DRAW_OUTLINE_CORNER
    v_offset = coord + half_winres;

    coord += vec2(
      cos(a_outline_direction), 
      sin(a_outline_direction)
    ) * u_outline_size * SQRT2;
    z = (z - 0.5) / float(u_polygon_count); 
    
  }

  gl_Position = vec4(coord / half_winres, z, 1.0);
}
`;


export const polygonShader_frag = `#version 300 es
precision mediump float;

in vec4 v_color;
in vec2 v_offset;
out vec4 fragColor;


uniform vec4 u_outline_color;
uniform float u_outline_size;
uniform float u_transition_smoothness;
uniform float u_blend_factor;
uniform float u_draw_outline;

vec4 lerpVec4(vec4 a, vec4 b, float t) {
  return a * (1.0 - t) + b * t;
}

const float DRAW_REGULAR = 0.;
const float DRAW_OUTLINE = 1.;
const float DRAW_OUTLINE_CORNER = 2.;

void main(void) {
  // fragColor = v_color;
  // return;
  if (u_draw_outline == DRAW_REGULAR) {
    fragColor = v_color; 
  } else if (u_draw_outline == DRAW_OUTLINE) { 
    fragColor = lerpVec4(v_color, u_outline_color, u_blend_factor);
  } else { // DRAW_OUTLINE_CORNER
    float d = distance(v_offset, gl_FragCoord.xy);
    if (d > u_outline_size) { 
      discard;
    }
    fragColor = lerpVec4(v_color, u_outline_color, u_blend_factor);

    // realistically who tf cares about unsmoothed corners when it's this small
    // float r1 = u_outline_size - u_transition_smoothness;
    // if (d < r1) {
    //   fragColor = outline_color;
    //   return;
    // }

    // float r2 = u_outline_size;
    // float s = smoothstep(r1, r2, d);
    // fragColor = mix(outline_color, vec4(0.0), s);
  }
  
}
`;

