import * as THREE from 'three';
import {VRButton} from "three/addons/webxr/VRButton";
import {BoxLineGeometry} from "three/addons/geometries/BoxLineGeometry";
import House from "../assets/Houseinball.glb"
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {XRControllerModelFactory} from "three/examples/jsm/webxr/XRControllerModelFactory";
import tree from "../assets/Tree.glb"
import axe from "../assets/axe.glb"

const axePosition = {x: 0, y: 1.6, z: -1, scale: .5}

class App {
    constructor() {
        const container = document.createElement('div');
        document.body.appendChild(container);

        this.controllers = []

        this.counter = 0;

        this.clock = new THREE.Clock();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 1.6, 0);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x505050);

        this.scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

        const light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1, 1, 1).normalize();
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = true;
        this.renderer.xr.enabled = true;

        container.appendChild(this.renderer.domElement);

        this.vec3 = new THREE.Vector3();

        this.initScene();
        this.setupXR();

        this.getInputSources = true;

        window.addEventListener('resize', this.resize.bind(this));

        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    createButtonStates(components) {
        const buttonStates = {}
        this.gamepadIndices = components
        Object.keys(components).forEach(key => {
            if (key.includes('touchpad') || key.includes('thumbstick')) {
                buttonStates[key] = {button: 0, xAxis: 0, yAxis: 0}
            } else {
                buttonStates[key] = 0
            }
        })
        this.buttonStates = buttonStates
    }

    controllerAction(dt) {
        if (!this.renderer.xr.isPresenting && this.controllers.length === 0) {
            return
        }

        if (this.rsphere && this.controllers[0].buttonStates) {
            const buttonStates = this.controllers[0].buttonStates
            if (buttonStates["xr_standard_thumbstick"].button) {
                const scale = 10
                this.rsphere.scale.set(scale, scale, scale)
            } else if (this.rsphere) {
                const scale = 5
                this.rsphere.scale.set(scale, scale, scale,)
            }
            const xAxis = buttonStates["xr_standard_thumbstick"].xAxis
            const yAxis = buttonStates["xr_standard_thumbstick"].yAxis
           // House.rotateY(0.1 * xAxis)
           // House.translateY(.02 * yAxis)
        }

    }


    initScene() {
        this.room = new THREE.LineSegments(
            new BoxLineGeometry(6, 6, 6, 10, 10, 10),
            new THREE.LineBasicMaterial({color: 0x808080})
        );

        const geo1 = new THREE.SphereBufferGeometry(0.1, 16, 8);
        const mat1 = new THREE.MeshStandardMaterial({color: 0x3333ff});
        const mat2 = new THREE.MeshStandardMaterial({color: 0x33ff33});
        this.materials = [mat1, mat2];
        this.rsphere = new THREE.Mesh(geo1, mat1);
        this.rsphere.position.set(0.5, 1.6, -1);
        this.scene.add(this.rsphere);
        this.lsphere = new THREE.Mesh(geo1, mat1);
        this.lsphere.position.set(-0.5, 1.6, -1);
        this.scene.add(this.lsphere);

        this.room.geometry.translate(0, 3, 0);
        this.scene.add(this.room);
        const self = this


        this.loadAsset(House, 0, 1.6, -1,  scene => {
            const scale = .5
            scene.scale.set(scale, scale, scale)
            self.House = scene
        })

        this.loadAsset(axe, 0, 1.6, -1,  scene => {
            const scale = .5
            scene.scale.set(scale, scale, scale)
            self.axe = scene
        })

    }
    loadAsset(glbObject, x, y, z, sceneHandler) {
        const self = this
        const loader = new GLTFLoader()
        loader.load(glbObject, (gltf) => {
                const gltfScene = gltf.scene
                self.scene.add(gltfScene)
                gltfScene.position.set(x, y, z)
                if (sceneHandler) {
                    sceneHandler(gltfScene)
                }
            },
            null,
            (error) => console.error(`An error happened: ${error}`))
    }

    setupXR() {
        this.renderer.xr.enabled = true;

        const gripRight = this.renderer.xr.getControllerGrip(0)
        gripRight.add(new XRControllerModelFactory().createControllerModel(gripRight))
        this.scene.add(gripRight)

        const gripLeft = this.renderer.xr.getControllerGrip(1)
        gripLeft.add(new XRControllerModelFactory().createControllerModel(gripLeft))
        this.scene.add(gripLeft)

        // Add events
        const self = this
        gripRight.addEventListener('squeezestart', () => {
            // Reset position
            const scale = axePosition.scale
            self.axe.scale.set(scale, scale, scale)
            self.axe.position.set(axePosition.x, axePosition.y, axePosition.z)
        })
        document.body.appendChild(VRButton.createButton(this.renderer));
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        if (this.renderer.xr.isPresenting) {
            const session = this.renderer.xr.getSession();
            const inputSources = session.inputSources;

            this.counter += this.clock.getDelta()
            if (this.counter > .2) {
                this.getInputSources = true
                this.counter = 0
            }
            if (this.getInputSources) {
                const info = [];

                inputSources.forEach(inputSource => {
                    const gp = inputSource.gamepad;
                    const axes = gp.axes;
                    const buttons = gp.buttons;
                    const mapping = gp.mapping;
                    this.useStandard = (mapping === 'xr-standard');
                    const gamepad = {axes, buttons, mapping};
                    const handedness = inputSource.handedness;
                    const profiles = inputSource.profiles;
                    this.type = "";
                    profiles.forEach(profile => {
                        if (profile.indexOf('touchpad') !== -1) this.type = 'touchpad';
                        if (profile.indexOf('thumbstick') !== -1) this.type = 'thumbstick';
                    });
                    const targetRayMode = inputSource.targetRayMode;
                    info.push({gamepad, handedness, profiles, targetRayMode});
                });

                console.log(JSON.stringify(info));

                this.getInputSources = false;
            } else if (this.useStandard && this.type !== "") {
                inputSources.forEach(inputSource => {
                    const gp = inputSource.gamepad;
                    const thumbstick = (this.type === 'thumbstick');
                    const offset = (thumbstick) ? 2 : 0;
                    const btnIndex = (thumbstick) ? 3 : 2;
                    const btnPressed = gp.buttons[btnIndex].pressed;
                    const material = (btnPressed) ? this.materials[1] : this.materials[0];
                    const deltaX = gp.axes[offset]
                    const deltaY = gp.axes[offset + 1]
                    if (inputSource.handedness === 'right') {
                        this.rsphere.position.set(0.5, 1.6, -1).add(this.vec3.set(gp.axes[offset], -gp.axes[offset + 1], 0));
                        this.rsphere.material = material;
                        this.rightStick(deltaX, deltaY, btnPressed)
                    } else if (inputSource.handedness === 'left') {
                        this.lsphere.position.set(-0.5, 1.6, -1).add(this.vec3.set(gp.axes[offset], -gp.axes[offset + 1], 0));
                        this.lsphere.material = material;
                        this.leftStick(deltaX, deltaY, btnPressed)
                    }
                })
            }
        }
        this.renderer.render(this.scene, this.camera);

    }

    rightStick(deltaX, deltaY, buttonPressed) {
        if (axe && buttonPressed) {
            // Zoom models
            const currentScale = this.axe.scale.x
            let scale
            if (currentScale >= 1) {
                scale = currentScale - .1 * deltaY
            } else {
                scale = 1 / (1 / currentScale + .1 * deltaY)
            }
            this.axe.scale.set(scale, scale, scale)

        } else if(this.axe) {
            // Rotate model
            this.axe.rotateY(Math.PI / 180 * 10 * deltaX)
            this.axe.rotateZ(Math.PI / 180 * 10 * deltaY)
        }
    }

    leftStick(deltaX, deltaY, buttonPressed) {
        if (this.axe && buttonPressed) {
           // this.axe.translateY(+.01)
            this.axe.position.add(this.vec3.set(.05 * deltaX, .05 * deltaY, 0))
        } else if(this.axe) {
            this.axe.position.add(this.vec3.set(.05 * deltaX, 0, .05 * deltaY))
        }
    }
}

export {App};
