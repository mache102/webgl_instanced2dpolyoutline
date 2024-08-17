import { vec2 } from './vec2.js';

export class polar_vec2 {
  static INPUT_TYPE = {
    POLAR: 'POLAR',
    CARTESIAN: 'CARTESIAN'
  };
  
  constructor(a, b, inputType = polar_vec2.INPUT_TYPE.POLAR) {
    if (inputType === polar_vec2.INPUT_TYPE.POLAR) {
      this.r = a;
      this.theta = b;
    } else {
      this.r = Math.sqrt(a * a + b * b);
      this.theta = Math.atan2(b, a);
    }
  }

  xy() {
    return new vec2(this.r * Math.cos(this.theta), this.r * Math.sin(this.theta));
  }

  scale(factor) {
    this.r *= factor;
    return this;
  }

  scaled(factor) {
    return new polar_vec2(this.r * factor, this.theta);
  }

  rotate(angle) {
    this.theta += angle;
    return this;
  }

  rotated(angle) {
    return new polar_vec2(this.r, this.theta + angle);
  }

  print(precision = 4) {
    return `polar_vec2(${this.r.toFixed(precision)}, ${this.theta.toFixed(precision)})`;
  }

  static create_polar_vec2s(vecs, i_type) {
    let polar = [];
    for (let vec of vecs) {
      polar.push(new polar_vec2(vec, i_type));
    }
    return polar;
  }

  static polar_vec2s_to_cartesian(polar) {
    let cartesian = [];
    // console.log(`typeof polar: ${typeof polar}`);
    for (let vec of polar) {
      cartesian.push(vec.xy());
    }
    return cartesian;
  }
}

