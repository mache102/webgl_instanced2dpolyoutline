/*

lowp: 8-bit fixed-point
mediump: 16-bit fixed-point
highp: 24-bit fixed-point

*/

export const circleShader_vert = `#version 300 es
precision mediump float;

in float a_index;
in vec2 a_coord;
in float a_size;
in vec2 a_offset;
in vec4 a_color;

out vec4 v_color;
out vec2 v_offset;
out float v_size;

uniform vec2 u_winres;
uniform float u_outline_size;
uniform uint u_polygon_count;

void main(void) {
  // order: rotate, scale (size), translate (offset)
  // xy: pixel space: (-winres/2 to +winres/2); origin at center
  // xy + half_winres: to gl_FragCoord space: (0,0) to (winres.x, winres.y)
  // xy / half_winres: to NDC [-1, 1] space

  v_color = a_color;
  v_size = a_size;
  vec2 half_winres = u_winres / 2.0;
  vec2 coord = a_coord * (a_size + u_outline_size) + a_offset;
  v_offset = a_offset + half_winres;

  float z = a_index / float(u_polygon_count);  

  gl_Position = vec4(coord / half_winres, z, 1.0);
}

`;


export const circleShader_frag = `#version 300 es
precision mediump float;

in vec4 v_color;
in vec2 v_offset;
in float v_size;

out vec4 fragColor;

uniform vec4 u_outline_color;
uniform float u_outline_size;
uniform float u_transition_smoothness;
uniform float u_blend_factor;
uniform bool u_draw_outline;

// circles are smoothstepped on both sides of the outline, whereas outline quads are only applied msaa 
// this slight correct slightly thickens circle outlines inwards to make them look consistent with outline quads
float outline_correction = -1.0;

vec4 lerpVec4(vec4 a, vec4 b, float t) {
  return a * (1.0 - t) + b * t;
}

void main(void) {
  float d = distance(v_offset, gl_FragCoord.xy);

  float r1 = v_size - u_outline_size + outline_correction;

  // circle inner
  if (d < r1) {
    fragColor = v_color;
    return;
  }

  vec4 outline_color = lerpVec4(v_color, u_outline_color, u_blend_factor);

  // smoothstep from inner to outline
  if (d < v_size) {
    float r2 = v_size - u_outline_size + u_transition_smoothness + outline_correction;
    float s = smoothstep(r1, r2, d);
    fragColor = mix(v_color, outline_color, s);
    return;
  }

  // circle outline
  float r3 = v_size + u_outline_size - u_transition_smoothness;
  if (d < r3) {
    fragColor = outline_color;
    return;
  }

  // smoothstep from outline to outer (alpha=0)
  float r4 = v_size + u_outline_size;
  float s = smoothstep(r3, r4, d);
  // if (s == 1.0) {
  //   discard;
  // }
  // fragColor = mix(outline_color, vec4(outline_color.xyz + vec3(0.1), 1.0), s);
  fragColor = mix(outline_color, vec4(0.0), s);

}
`;
