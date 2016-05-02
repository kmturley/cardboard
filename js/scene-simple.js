/*
 * Scene
 * by kmturley
 */

/*globals THREE, CANNON, PointerLockControls */

(function () {
    'use strict';
    var module = {
        init: function () {
            console.log('init');
            var me = this;
            this.clock = new THREE.Clock();
            this.renderer = new THREE.WebGLRenderer();
            this.element = this.renderer.domElement;
            this.container = document.getElementById('scene');
            this.container.appendChild(this.element);
            this.effect = new THREE.StereoEffect(this.renderer);
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(90, 1, 0.001, 700);
            this.camera.position.set(0, 10, 0);
            this.scene.add(this.camera);
            this.controls = new THREE.OrbitControls(this.camera, this.element);
            this.controls.rotateUp(Math.PI / 4);
            this.controls.target.set(this.camera.position.x + 0.1, this.camera.position.y, this.camera.position.z);
            this.controls.noZoom = true;
            this.controls.noPan = true;
            this.light = new THREE.HemisphereLight(0x777777, 0x000000, 0.6);
            this.scene.add(this.light);
            this.texture = THREE.ImageUtils.loadTexture('textures/patterns/checker.png');
            this.texture.wrapS = THREE.RepeatWrapping;
            this.texture.wrapT = THREE.RepeatWrapping;
            this.texture.repeat = new THREE.Vector2(50, 50);
            this.texture.anisotropy = this.renderer.getMaxAnisotropy();
            this.material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                specular: 0xffffff,
                shininess: 20,
                shading: THREE.FlatShading,
                map: this.texture
            });
            this.geometry = new THREE.PlaneGeometry(1000, 1000);
            this.mesh = new THREE.Mesh(this.geometry, this.material);
            this.mesh.rotation.x = -Math.PI / 2;
            this.scene.add(this.mesh);
            window.addEventListener('deviceorientation', function (e) {
                me.setOrientationControls(e);
            }, true);
            window.addEventListener('resize', function () {
                me.resize();
            }, false);
            window.setTimeout(function () {
                me.resize();
            }, 1);
            me.animate();
        },
        setOrientationControls: function (e) {
            var me = this;
            if (!e.alpha) {
                return;
            }
            this.controls = new THREE.DeviceOrientationControls(this.camera, true);
            this.controls.connect();
            this.controls.update();
            this.element.addEventListener('click', function (e) {
                me.fullscreen(e);
            }, false);
            window.removeEventListener('deviceorientation', function (e) {
                me.setOrientationControls(e);
            }, true);
        },
        resize: function () {
            var width = this.container.offsetWidth,
                height = this.container.offsetHeight;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.effect.setSize(width, height);
        },
        update: function (dt) {
            this.resize();
            this.camera.updateProjectionMatrix();
            this.controls.update(dt);
        },
        render: function () {
            this.effect.render(this.scene, this.camera);
        },
        animate: function (t) {
            var me = this;
            window.requestAnimationFrame(function () {
                me.animate();
            });
            this.update(this.clock.getDelta());
            this.render(this.clock.getDelta());
        },
        fullscreen: function () {
            if (this.container.requestFullscreen) {
                this.container.requestFullscreen();
            } else if (this.container.msRequestFullscreen) {
                this.container.msRequestFullscreen();
            } else if (this.container.mozRequestFullScreen) {
                this.container.mozRequestFullScreen();
            } else if (this.container.webkitRequestFullscreen) {
                this.container.webkitRequestFullscreen();
            }
        }
    };
    module.init();
}());