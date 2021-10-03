uniform sampler2D globeTexture;

varying vec2 vertexUV; // vec2[0, 0.3]
varying vec3 vertexNormal;

void main() { 
    float intensity = pow(0.9-dot(vertexNormal, vec3(0.0,0.0,1.0)),2.0);

    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
}