/*
 * Scene
 * by kmturley
 */

/*globals THREE, CANNON */

(function () {
    'use strict';
    var module = {
        init: function () {
            var me = this,
                light = new THREE.HemisphereLight(0x777777, 0x000000, 0.6),
                texture = THREE.ImageUtils.loadTexture('img/checker.png'),
                geometry = new THREE.PlaneGeometry(1000, 1000);
            this.cannon();
            this.clock = new THREE.Clock();
            this.renderer = new THREE.WebGLRenderer();
            this.renderer.shadowMapEnabled = true;
            this.renderer.shadowMapSoft = true;
            this.element = this.renderer.domElement;
            this.container = document.getElementById('scene');
            this.container.appendChild(this.element);
            this.effect = new THREE.StereoEffect(this.renderer);
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(90, 1, 0.001, 700);
            this.camera.position.set(0, 1, 0);
            this.scene.add(this.camera);
            this.controls = new THREE.OrbitControls(this.camera, this.element);
            this.controls.rotateUp(Math.PI / 4);
            this.controls.target.set(this.camera.position.x + 0.1, this.camera.position.y, this.camera.position.z);
            this.controls.noZoom = true;
            this.controls.noPan = true;
            this.setControls = this.setOrientationControls.bind(this);
            window.addEventListener('deviceorientation', this.setControls, true);
            this.scene.add(light);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat = new THREE.Vector2(50, 50);
            texture.anisotropy = this.renderer.getMaxAnisotropy();
            this.material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                specular: 0xffffff,
                shininess: 20,
                shading: THREE.FlatShading,
                map: texture
            });
            var mesh = new THREE.Mesh(geometry, this.material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.rotation.x = -Math.PI / 2;
            this.scene.add(mesh);
            window.addEventListener('resize', function () {
                me.resize();
            }, false);
            window.setTimeout(function () {
                me.resize();
            }, 1);
            this.container.addEventListener("click", function (e) {
                me.fire();
            });
            this.addContent();
            this.animate();
        },
        cannon: function () {
            var me = this,
                solver = new CANNON.GSSolver(),
                split = true,
                mass = 5,
                radius = 1.3,
                groundShape = new CANNON.Plane(),
                groundBody = new CANNON.Body({ mass: 0 });
            this.sphereShape = null;
            this.sphereBody = null;
            this.world = null;
            this.physicsMaterial = null;
            this.material = null;
            this.walls = [];
            this.balls = [];
            this.ballMeshes = [];
            this.boxes = [];
            this.boxMeshes = [];
            this.time = Date.now();

            this.ballShape = new CANNON.Sphere(0.2);
            this.ballGeometry = new THREE.SphereGeometry(this.ballShape.radius, 32, 32);
            this.shootDirection = new THREE.Vector3();
            this.shootVelo = 15;
            this.projector = new THREE.Projector();

            // Setup our world
            this.world = new CANNON.World();
            this.world.quatNormalizeSkip = 0;
            this.world.quatNormalizeFast = false;
            this.world.defaultContactMaterial.contactEquationStiffness = 1e9;
            this.world.defaultContactMaterial.contactEquationRelaxation = 4;

            solver.iterations = 7;
            solver.tolerance = 0.1;
            if (split) {
                this.world.solver = new CANNON.SplitSolver(solver);
            } else {
                this.world.solver = solver;
            }

            this.world.gravity.set(0, -20, 0);
            this.world.broadphase = new CANNON.NaiveBroadphase();

            // Create a slippery material (friction coefficient = 0.0)
            this.physicsMaterial = new CANNON.Material("slipperyMaterial");
            var physicsContactMaterial = new CANNON.ContactMaterial(this.physicsMaterial,
                                                                    this.physicsMaterial,
                                                                    0.0, // friction coefficient
                                                                    0.3  // restitution
                                                                   );
            // We must add the contact materials to the world
            this.world.addContactMaterial(physicsContactMaterial);

            // Create a sphere
            this.sphereShape = new CANNON.Sphere(radius);
            this.sphereBody = new CANNON.Body({ mass: mass });
            this.sphereBody.addShape(this.sphereShape);
            this.sphereBody.position.set(0, 5, 0);
            this.sphereBody.linearDamping = 0.9;
            this.world.add(this.sphereBody);

            // Create a plane
            groundBody.addShape(groundShape);
            groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            this.world.add(groundBody);
        },
        setOrientationControls: function (e) {
            var me = this;
            if (!e.alpha) {
                return;
            }
            this.controls = new THREE.DeviceOrientationControls(this.camera, true);
            this.controls.enabled = true;
            this.controls.connect();
            this.controls.update();
            this.firstTap = false;
            window.removeEventListener('deviceorientation', this.setControls, true);
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
            var i = 0,
                me = this;
            window.requestAnimationFrame(function () {
                me.animate();
            });
            if (this.controls.enabled !== false) {
                this.world.step(1 / 60);
                // Update ball positions
                for (i = 0; i < this.balls.length; i += 1) {
                    this.ballMeshes[i].position.copy(this.balls[i].position);
                    this.ballMeshes[i].quaternion.copy(this.balls[i].quaternion);
                }
                // Update box positions
                for (i = 0; i < this.boxes.length; i += 1) {
                    this.boxMeshes[i].position.copy(this.boxes[i].position);
                    this.boxMeshes[i].quaternion.copy(this.boxes[i].quaternion);
                }
            }
            this.update(Date.now() - this.time);
            this.render(Date.now() - this.time);
            this.time = Date.now();
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
        },
        addContent: function () {
            // Add boxes
            var i = 0,
                halfExtents = new CANNON.Vec3(1, 1, 1),
                boxShape = new CANNON.Box(halfExtents),
                boxGeometry = new THREE.BoxGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2),
                size = 0.5,
                he = new CANNON.Vec3(size, size, size * 0.1),
                mass = 0,
                space = 0.1 * size,
                N = 5,
                last = null;
            for (i = 0; i < 7; i += 1) {
                var x = (Math.random() - 0.5) * 20,
                    y = 1 + (Math.random() - 0.5),
                    z = (Math.random() - 0.5) * 20,
                    boxBody = new CANNON.Body({ mass: 5 }),
                    boxMesh = new THREE.Mesh(boxGeometry, this.material);
                boxBody.addShape(boxShape);
                this.world.add(boxBody);
                this.scene.add(boxMesh);
                boxBody.position.set(x, y, z);
                boxMesh.position.set(x, y, z);
                boxMesh.castShadow = true;
                boxMesh.receiveShadow = true;
                this.boxes.push(boxBody);
                this.boxMeshes.push(boxMesh);
            }

            // Add linked boxes
            boxShape = new CANNON.Box(he);
            boxGeometry = new THREE.BoxGeometry(he.x * 2, he.y * 2, he.z * 2);
            for (i = 0; i < N; i += 1) {
                var boxbody = new CANNON.Body({mass: mass}),
                    boxMesh2 = new THREE.Mesh(boxGeometry, this.material);
                boxbody.addShape(boxShape);
                boxbody.position.set(5, (N - i) * (size * 2 + 2 * space) + size * 2 + space, 0);
                boxbody.linearDamping = 0.01;
                boxbody.angularDamping = 0.01;
                // boxMesh.castShadow = true;
                boxMesh2.receiveShadow = true;
                this.world.add(boxbody);
                this.scene.add(boxMesh2);
                this.boxes.push(boxbody);
                this.boxMeshes.push(boxMesh2);

                if (i !== 0) {
                    // Connect this body to the last one
                    var c1 = new CANNON.PointToPointConstraint(boxbody, new CANNON.Vec3(-size, size + space, 0), last, new CANNON.Vec3(-size, -size - space, 0)),
                        c2 = new CANNON.PointToPointConstraint(boxbody, new CANNON.Vec3(size, size + space, 0), last, new CANNON.Vec3(size, -size - space, 0));
                    this.world.addConstraint(c1);
                    this.world.addConstraint(c2);
                } else {
                    mass = 0.3;
                }
                last = boxbody;
            }
        },
        fire: function () {
            if (this.firstTap === false) {
                this.fullscreen();
                this.firstTap = true;
            }
            if (this.controls.enabled !== false) {
                var x = this.sphereBody.position.x,
                    y = this.sphereBody.position.y,
                    z = this.sphereBody.position.z,
                    ballBody = new CANNON.Body({mass: 1}),
                    ballMesh = new THREE.Mesh(this.ballGeometry, this.material);
                ballBody.addShape(this.ballShape);
                this.world.add(ballBody);
                this.scene.add(ballMesh);
                ballMesh.castShadow = true;
                ballMesh.receiveShadow = true;
                this.balls.push(ballBody);
                this.ballMeshes.push(ballMesh);
                this.getShootDir(this.shootDirection);
                ballBody.velocity.set(this.shootDirection.x * this.shootVelo, this.shootDirection.y * this.shootVelo, this.shootDirection.z * this.shootVelo);
                // Move the ball outside the player sphere
                x += this.shootDirection.x * (this.sphereShape.radius * 1.02 + this.ballShape.radius);
                y += this.shootDirection.y * (this.sphereShape.radius * 1.02 + this.ballShape.radius);
                z += this.shootDirection.z * (this.sphereShape.radius * 1.02 + this.ballShape.radius);
                ballBody.position.set(x, y, z);
                ballMesh.position.set(x, y, z);
            }
        },
        getShootDir: function (targetVec) {
            var vector = targetVec;
            targetVec.set(0, 0, 1);
            this.projector.unprojectVector(vector, this.camera);
            var ray = new THREE.Ray(this.sphereBody.position, vector.sub(this.sphereBody.position).normalize());
            targetVec.copy(ray.direction);
        }
    };
    module.init();
}());