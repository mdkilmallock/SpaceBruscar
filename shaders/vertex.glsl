varying vec2 vertexUV; // UV passed into fragment shader
varying vec3 vertexNormal;

void main() {
    //set it as vertex shader runs
    //https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram
    vertexUV = uv;
    vertexNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
