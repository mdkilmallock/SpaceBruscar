uniform sampler2D globeTexture;

varying vec2 vertexUV; // vec2[0, 0.3]
varying vec3 vertexNormal;

void main() { 
    // atmospheric vibes
    // normal: direction associated with it, a grouping of x y z data [x,y,z]
    
    float intensity = 1.05 - dot(vertexNormal, vec3(0.0,0.0,1.0));
    vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 1.5);

    // UV are X and Y coordinate for something 2D
    // Map 2D texture on 3D space
    //     Fragment shader, we set UV in here
    //     https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram

    // add tint to the fragment with vec3
    gl_FragColor = vec4(atmosphere + texture2D(globeTexture, vertexUV).xyz, 1.0); 
}