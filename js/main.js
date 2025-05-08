// Main game file for Rabbit Escape 3D game

// Game variables
let scene, camera, renderer, rabbit, room;
let obstacles = [];
let exit;
let gameStarted = false;
let gameOver = false;
let startTime, currentTime;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false, isJumping = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let raycaster = new THREE.Raycaster();

// DOM elements
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const instructionsElement = document.getElementById('instructions');
const winScreenElement = document.getElementById('win-screen');
const timerElement = document.getElementById('timer');
const finalTimeElement = document.getElementById('final-time');

// Constants
const RABBIT_SPEED = 10.0;
const GRAVITY = 30.0;
const JUMP_FORCE = 10.0;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);
    
    // Add lights
    addLights();
    
    // Create room
    createRoom();
    
    // Create rabbit character
    createRabbit();
    
    // Create obstacles
    createObstacles();
    
    // Create exit
    createExit();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Button event listeners
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    
    // Start animation loop
    animate();
}

// Add lights to the scene
function addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Point light (room light)
    const pointLight = new THREE.PointLight(0xffffff, 0.8, 30);
    pointLight.position.set(0, 8, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);
}

// Create the room
function createRoom() {
    room = new THREE.Group();
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData = { type: 'floor' };
    room.add(floor);
    
    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xA0522D,
        roughness: 0.7,
        metalness: 0.1
    });
    
    // Back wall
    const backWallGeometry = new THREE.PlaneGeometry(20, 10);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.z = -10;
    backWall.position.y = 5;
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    backWall.userData = { type: 'wall' };
    room.add(backWall);
    
    // Front wall (with hole for exit)
    const frontWallGeometry = new THREE.PlaneGeometry(20, 10);
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.position.z = 10;
    frontWall.position.y = 5;
    frontWall.rotation.y = Math.PI;
    frontWall.receiveShadow = true;
    frontWall.castShadow = true;
    frontWall.userData = { type: 'wall' };
    room.add(frontWall);
    
    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(20, 10);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.x = -10;
    leftWall.position.y = 5;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    leftWall.userData = { type: 'wall' };
    room.add(leftWall);
    
    // Right wall
    const rightWallGeometry = new THREE.PlaneGeometry(20, 10);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.x = 10;
    rightWall.position.y = 5;
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    rightWall.userData = { type: 'wall' };
    room.add(rightWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(20, 20);
    const ceilingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xD3D3D3,
        roughness: 0.8,
        metalness: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 10;
    ceiling.rotation.x = Math.PI / 2;
    ceiling.receiveShadow = true;
    ceiling.userData = { type: 'ceiling' };
    room.add(ceiling);
    
    scene.add(room);
}

// Create the rabbit character
function createRabbit() {
    // Create a simple rabbit using primitives
    rabbit = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    rabbit.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.0, 0.3);
    head.castShadow = true;
    rabbit.add(head);
    
    // Ears
    const earGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0xFFCCCC });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.15, 1.4, 0.2);
    leftEar.rotation.x = -Math.PI / 8;
    leftEar.rotation.z = -Math.PI / 16;
    leftEar.castShadow = true;
    rabbit.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.15, 1.4, 0.2);
    rightEar.rotation.x = -Math.PI / 8;
    rightEar.rotation.z = Math.PI / 16;
    rightEar.castShadow = true;
    rabbit.add(rightEar);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.05, 0.55);
    rabbit.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.05, 0.55);
    rabbit.add(rightEye);
    
    // Nose
    const noseGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xFF9999 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0.95, 0.6);
    rabbit.add(nose);
    
    // Tail
    const tailGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.5, -0.5);
    tail.castShadow = true;
    rabbit.add(tail);
    
    // Add collision box for the rabbit
    rabbit.userData = { 
        type: 'player',
        width: 1.0,
        height: 1.5,
        depth: 1.0
    };
    
    // Set initial position
    rabbit.position.set(0, 0, 0);
    
    scene.add(rabbit);
}

// Create obstacles in the room
function createObstacles() {
    // Create various obstacles
    const obstacleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.8,
        metalness: 0.2
    });
    
    // Obstacle 1: Box
    const box1Geometry = new THREE.BoxGeometry(2, 2, 2);
    const box1 = new THREE.Mesh(box1Geometry, obstacleMaterial);
    box1.position.set(-5, 1, -5);
    box1.castShadow = true;
    box1.receiveShadow = true;
    box1.userData = { type: 'obstacle', width: 2, height: 2, depth: 2 };
    obstacles.push(box1);
    scene.add(box1);
    
    // Obstacle 2: Tall pillar
    const pillarGeometry = new THREE.BoxGeometry(1.5, 6, 1.5);
    const pillar = new THREE.Mesh(pillarGeometry, obstacleMaterial);
    pillar.position.set(5, 3, -5);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    pillar.userData = { type: 'obstacle', width: 1.5, height: 6, depth: 1.5 };
    obstacles.push(pillar);
    scene.add(pillar);
    
    // Obstacle 3: Long barrier
    const barrierGeometry = new THREE.BoxGeometry(10, 1.5, 1);
    const barrier = new THREE.Mesh(barrierGeometry, obstacleMaterial);
    barrier.position.set(0, 0.75, 2);
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    barrier.userData = { type: 'obstacle', width: 10, height: 1.5, depth: 1 };
    obstacles.push(barrier);
    scene.add(barrier);
    
    // Obstacle 4: Small boxes
    for (let i = 0; i < 5; i++) {
        const smallBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const smallBox = new THREE.Mesh(smallBoxGeometry, obstacleMaterial);
        smallBox.position.set(-7 + i * 3.5, 0.5, -2);
        smallBox.castShadow = true;
        smallBox.receiveShadow = true;
        smallBox.userData = { type: 'obstacle', width: 1, height: 1, depth: 1 };
        obstacles.push(smallBox);
        scene.add(smallBox);
    }
    
    // Obstacle 5: Moving platform
    const platformGeometry = new THREE.BoxGeometry(3, 0.5, 3);
    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x4682B4 });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 0.25, -7);
    platform.castShadow = true;
    platform.receiveShadow = true;
    platform.userData = { 
        type: 'obstacle', 
        width: 3, 
        height: 0.5, 
        depth: 3,
        isMoving: true,
        direction: 1,
        speed: 0.03,
        minX: -5,
        maxX: 5
    };
    obstacles.push(platform);
    scene.add(platform);
}

// Create the exit
function createExit() {
    const exitGeometry = new THREE.BoxGeometry(3, 3, 0.5);
    const exitMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00FF00,
        emissive: 0x00FF00,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7
    });
    exit = new THREE.Mesh(exitGeometry, exitMaterial);
    exit.position.set(8, 1.5, 9.7);
    exit.userData = { type: 'exit', width: 3, height: 3, depth: 0.5 };
    scene.add(exit);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle keydown events
function onKeyDown(event) {
    if (!gameStarted || gameOver) return;
    
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump) {
                velocity.y = JUMP_FORCE;
                canJump = false;
                isJumping = true;
            }
            break;
    }
}

// Handle keyup events
function onKeyUp(event) {
    if (!gameStarted || gameOver) return;
    
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

// Start the game
function startGame() {
    gameStarted = true;
    gameOver = false;
    instructionsElement.classList.add('hidden');
    startTime = Date.now();
    
    // Reset rabbit position
    rabbit.position.set(0, 0, 0);
    velocity.set(0, 0, 0);
    
    // Update camera position
    updateCameraPosition();
}

// Restart the game
function restartGame() {
    winScreenElement.classList.add('hidden');
    startGame();
}

// Check for collisions
function checkCollisions() {
    // Get rabbit dimensions and position
    const rabbitWidth = rabbit.userData.width;
    const rabbitHeight = rabbit.userData.height;
    const rabbitDepth = rabbit.userData.depth;
    const rabbitX = rabbit.position.x;
    const rabbitY = rabbit.position.y;
    const rabbitZ = rabbit.position.z;
    
    // Check collision with obstacles
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        const obstacleWidth = obstacle.userData.width;
        const obstacleHeight = obstacle.userData.height;
        const obstacleDepth = obstacle.userData.depth;
        const obstacleX = obstacle.position.x;
        const obstacleY = obstacle.position.y;
        const obstacleZ = obstacle.position.z;
        
        // Simple box collision detection
        if (rabbitX + rabbitWidth/2 > obstacleX - obstacleWidth/2 &&
            rabbitX - rabbitWidth/2 < obstacleX + obstacleWidth/2 &&
            rabbitY < obstacleY + obstacleHeight &&
            rabbitY > obstacleY - 0.1 &&
            rabbitZ + rabbitDepth/2 > obstacleZ - obstacleDepth/2 &&
            rabbitZ - rabbitDepth/2 < obstacleZ + obstacleDepth/2) {
            // Collision with top of obstacle - can stand on it
            velocity.y = 0;
            rabbit.position.y = obstacleY + obstacleHeight;
            canJump = true;
            isJumping = false;
            return true;
        }
        
        if (rabbitX + rabbitWidth/2 > obstacleX - obstacleWidth/2 &&
            rabbitX - rabbitWidth/2 < obstacleX + obstacleWidth/2 &&
            rabbitY + rabbitHeight > obstacleY &&
            rabbitY < obstacleY + obstacleHeight &&
            rabbitZ + rabbitDepth/2 > obstacleZ - obstacleDepth/2 &&
            rabbitZ - rabbitDepth/2 < obstacleZ + obstacleDepth/2) {
            // Collision with obstacle - push back
            return true;
        }
    }
    
    // Check collision with walls
    if (rabbitX < -9.5 || rabbitX > 9.5 || rabbitZ < -9.5 || rabbitZ > 9.5) {
        return true;
    }
    
    // Check collision with floor
    if (rabbitY <= 0) {
        rabbit.position.y = 0;
        velocity.y = 0;
        canJump = true;
        isJumping = false;
        return true;
    }
    
    // Check collision with exit
    const exitWidth = exit.userData.width;
    const exitHeight = exit.userData.height;
    const exitDepth = exit.userData.depth;
    const exitX = exit.position.x;
    const exitY = exit.position.y;
    const exitZ = exit.position.z;
    
    if (rabbitX + rabbitWidth/2 > exitX - exitWidth/2 &&
        rabbitX - rabbitWidth/2 < exitX + exitWidth/2 &&
        rabbitY + rabbitHeight > exitY - exitHeight/2 &&
        rabbitY < exitY + exitHeight/2 &&
        rabbitZ + rabbitDepth/2 > exitZ - exitDepth/2 &&
        rabbitZ - rabbitDepth/2 < exitZ + exitDepth/2) {
        // Win condition
        gameOver = true;
        winScreenElement.classList.remove('hidden');
        finalTimeElement.textContent = Math.floor((Date.now() - startTime) / 1000);
    }
    
    return false;
}

// Update moving obstacles
function updateObstacles(delta) {
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        
        if (obstacle.userData.isMoving) {
            // Update position based on direction and speed
            obstacle.position.x += obstacle.userData.direction * obstacle.userData.speed;
            
            // Change direction if reached min/max position
            if (obstacle.position.x <= obstacle.userData.minX || 
                obstacle.position.x >= obstacle.userData.maxX) {
                obstacle.userData.direction *= -1;
            }
        }
    }
}

// Update camera position to follow the rabbit
function updateCameraPosition() {
    camera.position.x = rabbit.position.x;
    camera.position.y = rabbit.position.y + 3;
    camera.position.z = rabbit.position.z + 5;
    camera.lookAt(rabbit.position);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = 1 / 60; // Assume 60fps for physics calculations
    
    if (gameStarted && !gameOver) {
        // Update timer
        currentTime = Date.now();
        timerElement.textContent = Math.floor((currentTime - startTime) / 1000);
        
        // Apply gravity
        velocity.y -= GRAVITY * delta;
        
        // Calculate movement direction
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        
        // Move rabbit
        const oldPosition = rabbit.position.clone();
        
        if (moveForward || moveBackward) rabbit.position.z -= direction.z * RABBIT_SPEED * delta;
        if (moveLeft || moveRight) rabbit.position.x += direction.x * RABBIT_SPEED * delta;
        
        // Apply velocity
        rabbit.position.y += velocity.y * delta;
        
        // Check collisions and revert position if needed
        if (checkCollisions()) {
            // If collision with obstacle, revert to old position
            if (rabbit.position.y > 0 && !canJump) {
                rabbit.position.x = oldPosition.x;
                rabbit.position.z = oldPosition.z;
            }
        }
        
        // Update obstacles
        updateObstacles(delta);
        
        // Update camera position
        updateCameraPosition();
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// Initialize the game when the page loads
window.onload = init;