let scene, camera, renderer;
let player;
let obstacles = [];
let clock = new THREE.Clock();

let speed = 20;     // velocidade do jogador
let lane = 0;       // -1 = esquerda | 0 = centro | 1 = direita
let lanesX = [-3, 0, 3];

let canJump = true;
let running = false;
let score = 0;

let spawnTimer = 0;
let spawnInterval = 1.2;

function init() {

  const container = document.getElementById("game-container");

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b1220, 10, 80);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 6, 12);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  // PLAYER
  const geo = new THREE.BoxGeometry(1.5, 2, 1.5);
  const mat = new THREE.MeshStandardMaterial({ color: 0x22c1c3 });
  player = new THREE.Mesh(geo, mat);
  player.position.set(0, 1, 0);
  scene.add(player);

  // CHÃO INFINITO
  const floorGeo = new THREE.BoxGeometry(20, 1, 1000);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x20252b });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -0.5, -500);
  scene.add(floor);

  window.addEventListener("resize", onResize);
  document.addEventListener("keydown", keyPress);
}

function spawnObstacle() {
  const size = Math.random() * 1.5 + 1;

  const geo = new THREE.BoxGeometry(size, size, size);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
  const obs = new THREE.Mesh(geo, mat);

  const laneIndex = Math.floor(Math.random() * 3);
  obs.position.set(lanesX[laneIndex], size / 2, player.position.z - 80);

  obstacles.push(obs);
  scene.add(obs);
}

function keyPress(e) {
  if (!running) return;

  if (e.code === "ArrowLeft" && lane > -1) {
    lane--;
    player.position.x = lanesX[lane + 1] ?? lanesX[0];
  }

  if (e.code === "ArrowRight" && lane < 1) {
    lane++;
    player.position.x = lanesX[lane + 1] ?? lanesX[2];
  }

  if (e.code === "Space") jump();
}

function jump() {
  if (!canJump) return;
  canJump = false;

  let startY = player.position.y;
  let peak = startY + 4;
  let t = 0;

  function animateJump() {
    t += 0.05;

    if (t < 1) {
      player.position.y = startY + (peak - startY) * Math.sin(Math.PI * t);
      requestAnimationFrame(animateJump);
    } else {
      player.position.y = startY;
      canJump = true;
    }
  }

  animateJump();
}

function update(dt) {
  if (!running) return;

  player.position.z -= speed * dt;

  spawnTimer += dt;
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnObstacle();
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];

    if (o.position.z > player.position.z + 10) {
      scene.remove(o);
      obstacles.splice(i, 1);
      score += 10;
      document.getElementById("scoreValue").innerText = score;
      continue;
    }

    let dx = Math.abs(o.position.x - player.position.x);
    let dz = Math.abs(o.position.z - player.position.z);

    if (dx < 1.5 && dz < 1.5 && player.position.y < o.geometry.parameters.height + 1) {
      running = false;
      document.getElementById("restartBtn").style.display = "inline-block";
    }
  }

  camera.position.z = player.position.z + 12;
  camera.lookAt(player.position.x, player.position.y + 1, player.position.z - 10);
}

function animate() {
  const dt = clock.getDelta();
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.onload = () => {
  init();
  animate();

  document.getElementById("startBtn").onclick = () => {
    running = true;
    document.getElementById("startBtn").style.display = "none";
  };

  document.getElementById("restartBtn").onclick = () => {
    location.reload();
  };
};
