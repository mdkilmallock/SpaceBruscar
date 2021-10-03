import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as satellite from 'satellite.js';

import atmosphereVertexShader from './shaders/atmosphereVertex.glsl'
import atmosphereFragmentShader from './shaders/atmosphereFragment.glsl'
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

const scene = new THREE.Scene()
const camera = new THREE.
PerspectiveCamera(
    75,
    innerWidth / innerHeight,
    0.1,
    1000
)


const renderer = new THREE.WebGLRenderer({
    antialias: true
})
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const radius = 10
const radiusKm = 6371

const texture = new THREE.TextureLoader().load('../img/earth.jpg');
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 50, 50),
    new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            globeTexture: {
                value: texture
            }
        }
    })
)

scene.add(sphere)

const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 50, 50),
    new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    })
)

atmosphere.scale.set(1.1, 1.1, 1.1)

scene.add(atmosphere)
camera.position.z = 20

function calcPosFromLatLonRad(lat, lon, height) {
    var phi = (90 - lat) * (Math.PI / 180)
    var theta = (lon + 180) * (Math.PI / 180)
    height = radius + ((radius / radiusKm) * height)

    //(10/6371) * height
    let x = -(height) * (Math.sin(phi) * Math.cos(theta))
    let z = (height) * (Math.sin(phi) * Math.sin(theta))
    let y = (height) * (Math.cos(phi))

    // var x = -(radius + heigth) * Math.cos(phi) * Math.cos(theta);
    // var y = (radius + heigth) * Math.sin(phi);
    // var z = (radius + heigth) * Math.cos(phi) * Math.sin(theta);

    return { x, y, z }
}

//red markers
let mesh = new THREE.Mesh(
    new THREE.SphereBufferGeometry(6371 / 50, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
)

// let point1 = {
//     lat: 50.4501,
//     lng: 30.5234
// }

// let mexico = {
//     lat: 32.1656,
//     lng: -82.9001
// }

// //let pos = convertLatLngToCartesian(point1)
// let pos = calcPosFromLatLonRad(mexico.lat, mexico.lng)

const loader = new THREE.FileLoader();

//load a text file and output the result to the console
var tle = []
var satrecs = []

var particlesGeometry = new THREE.BufferGeometry()
var particlePositions

function loadTleFile(fileName) {
    loader.load(
        // resource URL
        fileName,

        // onLoad callback
        function(data) {
            // output the text to the console
            //console.log(data)
            var lines = data.split('\n')
            console.log(lines)
            var count = 0
            var lineCount = 0

            var vertices = []
            lines.forEach(line => {

                if (line[0] == "1") {
                    tle[count] = {}
                    tle[count][0] = line
                } else if (line[0] == "2") {
                    try {
                        tle[count][1] = line


                        const satrec = satellite.twoline2satrec(
                            tle[count][0], tle[count][1]
                        )

                        const date = new Date()
                        const positionAndVelocity = satellite.propagate(satrec, date)
                        const gmst = satellite.gstime(date)
                        const tlePos = satellite.eciToGeodetic(positionAndVelocity.position, gmst)

                        var longitudeDeg = satellite.degreesLong(tlePos.longitude),
                            latitudeDeg = satellite.degreesLat(tlePos.latitude);

                        let pos = calcPosFromLatLonRad(latitudeDeg, longitudeDeg, tlePos.height)

                        // let mesh = new THREE.Mesh(
                        //     new THREE.SphereBufferGeometry(0.025, 10, 10),
                        //     new THREE.MeshBasicMaterial({ color: 0xff0000 })
                        // )

                        //mesh.position.set(pos.x, pos.y, pos.z)

                        //scene.add(mesh)

                        vertices.push(pos.x)
                        vertices.push(pos.y)
                        vertices.push(pos.z)


                        satrecs.push({
                            "satrec": satrec,
                            "mesh": mesh
                        })

                        count++
                    } catch (error) {
                        console.log(error)
                    }


                }
            })

            //particles
            var posArray = new Float32Array(vertices.length * 3)
            for (let i = 0; i < vertices.length * 3; i++) {
                posArray[i] = vertices[i]
            }


            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
            particlePositions = particlesGeometry.attributes.position

            const material = new THREE.PointsMaterial({
                size: 0.1,
                color: 0xff0000
            })

            var particlesMesh = new THREE.Points(particlesGeometry, material)
            scene.add(particlesMesh)
        },

        // onProgress callback
        function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },

        // onError callback
        function(err) {
            console.error('An error happened');
        }
    );
}

loadTleFile("full.tle")


function updateSatRecs() {
    try {
        var posArray = particlesGeometry.attributes.position.array
        particlesGeometry.attributes.position.needsUpdate = true
        let count = 0;
        for (var i = 0; i < satrecs.length; i++) {
            let satrec = satrecs[i]["satrec"];
            let mesh = satrecs[i]["mesh"]

            const date = new Date()
            const positionAndVelocity = satellite.propagate(satrec, date)
            const gmst = satellite.gstime(date)
            const tlePos = satellite.eciToGeodetic(positionAndVelocity.position, gmst)

            var longitudeDeg = satellite.degreesLong(tlePos.longitude),
                latitudeDeg = satellite.degreesLat(tlePos.latitude);
            let pos = calcPosFromLatLonRad(latitudeDeg, longitudeDeg, tlePos.height)


            posArray[count] = pos.x
            posArray[count + 1] = pos.y
            posArray[count + 2] = pos.z
            count += 3

            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
                // mesh.position.set(pos.x, pos.y, pos.z)
        }
    } catch (error) {
        console.log(error)
    }

}


// mesh.position.set(pos.x, pos.y, pos.z)

//mesh.position.set(1, 0, 0)

// scene.add(mesh)

function animate() {
    controls.update()
    updateSatRecs()
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
}

animate()