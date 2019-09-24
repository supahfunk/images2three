precision mediump float;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
uniform sampler2D uNoise;
uniform float uRandom;
uniform float uSpeed;
uniform float uTime;

void main() {
  vUv = uv;
  vec3 position2 = position;
  float time = uTime;
  float speed = uSpeed;

  float xValue = 0.001;
  float yValue = 0.003;

  position2.x += sin(((time + uRandom) * 0.005) - (position.x * 3.) + (position.y * 4.)) * xValue * speed;
  position2.y += sin(((time + uRandom) * 0.005) - (position.y * 3.) - (position.x * 4.)) * yValue * speed;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position2,1.0);
}