precision mediump float;

uniform sampler2D uImage;
uniform float uTime;
uniform float uRandom;
uniform float uSpeed;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float time = uTime;
  vec4 image = texture2D(uImage, uv);
  gl_FragColor = image;
}