import * as THREE from 'three';
import './style.css';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a,b,t) => a + (b-a)*t;
const rand = (a,b) => a + Math.random()*(b-a);

const state = {
  started:false, over:false, winner:false, name:'Warrior',
  playerGold:0, enemyGold:100,
  enemyAlive:true, stealing:false,
  toastTimer:0, lastTime:performance.now()
};

const ui = {
  login: document.getElementById('login-screen'),
  start: document.getElementById('start-btn'),
  name: document.getElementById('player-name'),
  hud: document.getElementById('hud'),
  result: document.getElementById('result-screen'),
  resultTitle: document.getElementById('result-title'),
  resultCopy: document.getElementById('result-copy'),
  resultIcon: document.getElementById('result-icon'),
  restart: document.getElementById('restart-btn'),
  loading: document.getElementById('loading'),
  health: document.getElementById('health-bar'),
  stamina: document.getElementById('stamina-bar'),
  enemyHealth: document.getElementById('enemy-health-bar'),
  healthText: document.getElementById('health-text'),
  staminaText: document.getElementById('stamina-text'),
  enemyHealthText: document.getElementById('enemy-health-text'),
  playerLabel: document.getElementById('player-label'),
  playerScore: document.getElementById('player-score'),
  enemyGold: document.getElementById('enemy-gold'),
  objective: document.getElementById('objective-count'),
  enemyState: document.getElementById('enemy-state'),
  toast: document.getElementById('toast'),
  flash: document.getElementById('flash')
};

let scene, camera, renderer, clock;
let player, enemy, world, chestPlayer, chestEnemy, particles = [];
let audio = null;
const keys = {};
const mouse = {x:0,y:0};
const cameraState = { yaw:0, pitch:.34, distance:7.5 };
const tmp = new THREE.Vector3();

init();

function init() {
  setupScene();
  createWorld();
  player = createWarrior(0x315f8d, false);
  enemy = createWarrior(0x8f3029, true);
  player.group.position.set(-34,0,0);
  enemy.group.position.set(34,0,0);
  scene.add(player.group, enemy.group);

  chestPlayer = createChest(0x2870c0);
  chestEnemy = createChest(0xb33d2e);
  chestPlayer.position.set(-40,0,0);
  chestEnemy.position.set(40,0,0);
  scene.add(chestPlayer, chestEnemy);

  bindInput();
  animate();
}

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x6d8b73);
  scene.fog = new THREE.FogExp2(0x718b75, .010);

  camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, .1, 500);
  camera.position.set(0,4,9);

  renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  document.body.prepend(renderer.domElement);

  clock = new THREE.Clock();

  const hemi = new THREE.HemisphereLight(0xcfe1ff, 0x27351f, 2.1);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe0a3, 3.2);
  sun.position.set(-50,80,35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  scene.add(sun);

  window.addEventListener('resize', resize);
}

function createWorld() {
  world = new THREE.Group();
  scene.add(world);

  const groundGeo = new THREE.PlaneGeometry(180,180,70,70);
  const pos = groundGeo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i), z=pos.getY(i);
    const h = Math.sin(x*.075)*.75 + Math.cos(z*.09)*.65 + Math.sin((x+z)*.025)*1.1;
    pos.setZ(i, h);
  }
  groundGeo.computeVertexNormals();

  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({color:0x3f6239, roughness:.98, metalness:0})
  );
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow=true;
  world.add(ground);

  // Ancient stone path
  const pathMat = new THREE.MeshStandardMaterial({color:0x776b59, roughness:1});
  for(let i=-8;i<=8;i++){
    const stone = new THREE.Mesh(new THREE.BoxGeometry(4.5,.15,3.0),pathMat);
    stone.position.set(i*5.2,.08, rand(-1.2,1.2));
    stone.rotation.y=rand(-.08,.08);
    stone.castShadow=true; stone.receiveShadow=true;
    world.add(stone);
  }

  for(let i=0;i<95;i++) addTree(rand(-82,82),rand(-82,82));
  for(let i=0;i<55;i++) addRock(rand(-82,82),rand(-82,82));
  addRuins();
  addTorch(-48,0); addTorch(48,0);
}

function addTree(x,z){
  if(Math.abs(x)<10 && Math.abs(z)<10) return;
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.35,2.4,7),new THREE.MeshStandardMaterial({color:0x5a3922,roughness:1}));
  trunk.position.y=1.2;
  const crown=new THREE.Mesh(new THREE.DodecahedronGeometry(rand(1.1,1.8),1),new THREE.MeshStandardMaterial({color:0x294c2c,roughness:1}));
  crown.position.y=2.9;
  g.add(trunk,crown); g.position.set(x,0,z);
  g.traverse(o=>{o.castShadow=true;o.receiveShadow=true});
  world.add(g);
}
function addRock(x,z){
  const r=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.35,1.25),1),new THREE.MeshStandardMaterial({color:0x5b5b51,roughness:1}));
  r.position.set(x,.4,z); r.scale.y=rand(.5,1.1); r.rotation.set(rand(0,1),rand(0,3),rand(0,1));
  r.castShadow=true; r.receiveShadow=true; world.add(r);
}
function addRuins(){
  const mat=new THREE.MeshStandardMaterial({color:0x756854,roughness:.95});
  for(const x of [-18,18]){
    for(let i=0;i<4;i++){
      const p=new THREE.Mesh(new THREE.BoxGeometry(.9,rand(2,4),.9),mat);
      p.position.set(x+rand(-4,4),p.geometry.parameters.height/2,rand(-8,8));
      p.rotation.y=rand(0,Math.PI); p.castShadow=true; world.add(p);
    }
  }
}
function addTorch(x,z){
  const g=new THREE.Group();
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,2,7),new THREE.MeshStandardMaterial({color:0x4a2d18}));
  post.position.y=1; g.add(post);
  const flame=new THREE.Mesh(new THREE.SphereGeometry(.25,10,10),new THREE.MeshBasicMaterial({color:0xffb52e}));
  flame.position.y=2.1; g.add(flame);
  const light=new THREE.PointLight(0xff9b36,7,9); light.position.y=2.1; g.add(light);
  g.position.set(x,0,z); world.add(g);
}

function createWarrior(color, isEnemy){
  const g=new THREE.Group();

  const mat=new THREE.MeshStandardMaterial({color,roughness:.75,metalness:.05});
  const skin=new THREE.MeshStandardMaterial({color:0xb97850,roughness:.9});
  const metal=new THREE.MeshStandardMaterial({color:0xbbb7a9,metalness:.8,roughness:.3});

  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.55,1.15,6,10),mat);
  body.position.y=1.55;
  const head=new THREE.Mesh(new THREE.SphereGeometry(.4,16,12),skin);
  head.position.y=2.65;
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.47,16,8,0,Math.PI*2,0,Math.PI*.55),metal);
  helmet.position.y=2.76;

  const armL=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.85,5,8),mat);
  const armR=armL.clone();
  armL.position.set(-.72,1.65,0); armR.position.set(.72,1.65,0);
  armL.rotation.z=.18; armR.rotation.z=-.18;

  const legL=new THREE.Mesh(new THREE.CapsuleGeometry(.19,.9,5,8),mat);
  const legR=legL.clone();
  legL.position.set(-.3,.65,0); legR.position.set(.3,.65,0);

  const sword=new THREE.Group();
  const grip=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.55,8),new THREE.MeshStandardMaterial({color:0x3b2517}));
  grip.rotation.z=Math.PI/2; grip.position.x=.35;
  const blade=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,1.65),metal);
  blade.position.set(1.2,0,0); blade.rotation.z=.12;
  sword.add(grip,blade); sword.position.set(.65,1.55,.1);
  sword.rotation.z=-.5;

  const cape=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.6),new THREE.MeshStandardMaterial({color:isEnemy?0x4c1514:0x172f50,side:THREE.DoubleSide,roughness:1}));
  cape.position.set(0,1.65,.38); cape.rotation.x=.08;

  g.add(body,head,helmet,armL,armR,legL,legR,sword,cape);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});

  return {
    group:g, health:100, stamina:100, speed:isEnemy?3.0:4.2,
    cooldown:0, attackTimer:0, hitFlash:0,
    parts:{body,head,armL,armR,legL,legR,sword,cape},
    isEnemy
  };
}

function createChest(color){
  const g=new THREE.Group();
  const wood=new THREE.MeshStandardMaterial({color:0x6d3d1e,roughness:.9});
  const gold=new THREE.MeshStandardMaterial({color:0xf0bd43,metalness:.8,roughness:.2});
  const base=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.25,1.5),wood);
  base.position.y=.65;
  const lid=new THREE.Mesh(new THREE.BoxGeometry(2.25,.45,1.55),wood);
  lid.position.y=1.43;
  const band=new THREE.Mesh(new THREE.BoxGeometry(2.3,.13,1.58),gold);
  band.position.y=1.15;
  const lock=new THREE.Mesh(new THREE.BoxGeometry(.32,.4,.08),gold);
  lock.position.set(0,.95,-.79);
  g.add(base,lid,band,lock);
  g.traverse(o=>{o.castShadow=true;o.receiveShadow=true});
  g.userData.color=color;
  return g;
}

function bindInput(){
  addEventListener('keydown',e=>{
    keys[e.key.toLowerCase()]=true;
    if(e.code==='Space'){e.preventDefault(); attack();}
    if(e.key.toLowerCase()==='f') steal();
    if(e.key.toLowerCase()==='r' && state.over) resetGame();
  });
  addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

  addEventListener('mousemove',e=>{
    if(!state.started || state.over) return;
    cameraState.yaw -= e.movementX * .0022;
    cameraState.pitch = clamp(cameraState.pitch - e.movementY*.0014, .12, .7);
  });

  renderer.domElement.addEventListener('click',()=>{
    if(document.pointerLockElement!==renderer.domElement && state.started && !state.over)
      renderer.domElement.requestPointerLock?.();
  });

  ui.start.onclick=()=>{
    state.name=(ui.name.value.trim()||'Warrior').slice(0,16);
    state.started=true;
    ui.login.classList.add('hidden');
    ui.hud.classList.remove('hidden');
    ui.playerLabel.textContent=state.name.toUpperCase();
    ensureAudio();
    showToast('Find the rival and steal the enemy treasure.');
  };
  ui.restart.onclick=resetGame;
}

function ensureAudio(){
  if(audio) return;
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx) return;
  const ctx=new Ctx();
  audio={ctx, master:ctx.createGain()};
  audio.master.gain.value=.045;
  audio.master.connect(ctx.destination);
}
function beep(freq,duration=.08,type='sine'){
  if(!audio) return;
  const o=audio.ctx.createOscillator(), g=audio.ctx.createGain();
  o.type=type; o.frequency.value=freq;
  g.gain.setValueAtTime(.0001,audio.ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(.35,audio.ctx.currentTime+.01);
  g.gain.exponentialRampToValueAtTime(.0001,audio.ctx.currentTime+duration);
  o.connect(g); g.connect(audio.master); o.start(); o.stop(audio.ctx.currentTime+duration+.02);
}

function attack(){
  if(!state.started||state.over||player.cooldown>0) return;
  player.cooldown=.55; player.attackTimer=.28; beep(150,.11,'sawtooth');

  if(state.enemyAlive && distanceXZ(player.group.position,enemy.group.position)<3.0){
    enemy.health-=22;
    enemy.hitFlash=.16;
    beep(90,.13,'square');
    flash(.12);
    if(enemy.health<=0) defeatEnemy();
  }
}
function defeatEnemy(){
  state.enemyAlive=false;
  enemy.group.visible=false;
  state.enemyGold=100;
  spawnEssence(enemy.group.position.clone());
  showToast('RIVAL DEFEATED — absorb the Life Essence and raid the chest.');
  beep(55,.5,'sawtooth');
}
function spawnEssence(pos){
  const gem=new THREE.Mesh(new THREE.IcosahedronGeometry(.35,1),new THREE.MeshStandardMaterial({color:0xffc94f,emissive:0x7a4d00,emissiveIntensity:2,metalness:.4}));
  gem.position.copy(pos); gem.position.y=1.2; scene.add(gem);
  particles.push({mesh:gem,type:'essence',life:999});
}
function steal(){
  if(!state.enemyAlive && distanceXZ(player.group.position,chestEnemy.position)<4.2){
    state.enemyGold=Math.max(0,state.enemyGold-25);
    state.playerGold+=25;
    chestEnemy.rotation.y+=.3;
    beep(420,.14,'triangle');
    flash(.08);
    if(state.playerGold>=100) win();
    else showToast(`Treasure stolen: ${state.playerGold}/100 GOLD`);
  } else if(distanceXZ(player.group.position,chestEnemy.position)<4.2){
    showToast('Defeat the rival before raiding the chest.');
  }
}
function absorbEssence(){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    if(p.type!=='essence') continue;
    p.mesh.rotation.y+=.03;
    p.mesh.position.y=1.2+Math.sin(performance.now()*.005+i)*.18;
    if(distanceXZ(player.group.position,p.mesh.position)<2.3){
      player.health=clamp(player.health+18,0,100);
      player.stamina=clamp(player.stamina+35,0,100);
      scene.remove(p.mesh); particles.splice(i,1);
      showToast('Life Essence absorbed — health and energy restored.');
      beep(640,.18,'sine');
    }
  }
}
function enemyAI(dt){
  if(!state.enemyAlive||state.over) return;
  const d=distanceXZ(enemy.group.position,player.group.position);
  let target=player.group.position;
  if(d>22) target=chestEnemy.position;
  else if(d<16) target=player.group.position;
  else {
    enemy.group.rotation.y += Math.sin(performance.now()*.0007)*.004;
    return;
  }
  const dir=new THREE.Vector3(target.x-enemy.group.position.x,0,target.z-enemy.group.position.z).normalize();
  enemy.group.position.addScaledVector(dir,enemy.speed*dt);
  enemy.group.position.x=clamp(enemy.group.position.x,-82,82);
  enemy.group.position.z=clamp(enemy.group.position.z,-82,82);
  enemy.group.rotation.y=Math.atan2(dir.x,dir.z);
  if(d<3.0 && target===player.group.position){
    if(enemy.cooldown<=0){
      enemy.cooldown=.85;
      enemy.attackTimer=.28;
      player.health-=14;
      flash(.06); beep(75,.1,'square');
      if(player.health<=0) lose();
    }
  }
}
function updatePlayer(dt){
  if(state.over) return;
  let x=(keys.d?1:0)-(keys.a?1:0);
  let z=(keys.s?1:0)-(keys.w?1:0);
  const moving=x!==0||z!==0;
  if(moving){
    const v=new THREE.Vector3(x,0,z).normalize();
    const sprint=keys.shift && player.stamina>1;
    const speed=player.speed*(sprint?1.55:1);
    if(sprint) player.stamina=clamp(player.stamina-24*dt,0,100);
    else player.stamina=clamp(player.stamina+10*dt,0,100);

    // movement relative to camera yaw
    v.applyAxisAngle(new THREE.Vector3(0,1,0),cameraState.yaw);
    player.group.position.addScaledVector(v,speed*dt);
    player.group.rotation.y=lerpAngle(player.group.rotation.y,Math.atan2(v.x,v.z),.2);
  } else player.stamina=clamp(player.stamina+17*dt,0,100);

  player.group.position.x=clamp(player.group.position.x,-82,82);
  player.group.position.z=clamp(player.group.position.z,-82,82);
  player.cooldown=Math.max(0,player.cooldown-dt);
  player.attackTimer=Math.max(0,player.attackTimer-dt);
  enemy.cooldown=Math.max(0,enemy.cooldown-dt);
  enemy.attackTimer=Math.max(0,enemy.attackTimer-dt);

  animateWarrior(player,moving,dt);
  if(state.enemyAlive) animateWarrior(enemy,true,dt);
}
function animateWarrior(w,moving,dt){
  const t=performance.now()*.008;
  const walk=moving?Math.sin(t)*.45:0;
  w.parts.legL.rotation.x=walk; w.parts.legR.rotation.x=-walk;
  w.parts.armL.rotation.x=-walk*.7; w.parts.armR.rotation.x=walk*.7;
  if(w.attackTimer>0){
    w.parts.sword.rotation.z=-.5-Math.sin((w.attackTimer/.28)*Math.PI)*1.7;
  } else w.parts.sword.rotation.z=lerp(w.parts.sword.rotation.z,-.5,.25);
  if(w.hitFlash>0) w.hitFlash-=dt;
  w.parts.body.material.emissive?.setHex(w.hitFlash>0?0x661100:0x000000);
}

function updateCamera(){
  const target=player.group.position.clone().add(new THREE.Vector3(0,1.4,0));
  const offset=new THREE.Vector3(0,0,cameraState.distance);
  offset.applyEuler(new THREE.Euler(-cameraState.pitch,cameraState.yaw,0,'YXZ'));
  const desired=target.clone().add(offset);
  camera.position.lerp(desired,.11);
  camera.lookAt(target);
}
function distanceXZ(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function lerpAngle(a,b,t){
  let d=(b-a+Math.PI)%(Math.PI*2)-Math.PI;
  return a+d*t;
}
function flash(a){
  ui.flash.style.opacity=a;
  setTimeout(()=>ui.flash.style.opacity=0,80);
}
function showToast(text){
  ui.toast.textContent=text; ui.toast.classList.add('show');
  state.toastTimer=2.8;
}
function updateUI(){
  ui.health.style.width=player.health+'%';
  ui.stamina.style.width=player.stamina+'%';
  ui.enemyHealth.style.width=(state.enemyAlive?enemy.health:0)+'%';
  ui.healthText.textContent=Math.ceil(player.health);
  ui.staminaText.textContent=Math.ceil(player.stamina);
  ui.enemyHealthText.textContent=Math.ceil(state.enemyAlive?enemy.health:0);
  ui.playerScore.textContent=state.playerGold+' GOLD';
  ui.enemyGold.textContent=state.enemyGold+' GOLD';
  ui.objective.textContent=`${state.playerGold} / 100`;
  ui.enemyState.textContent=state.enemyAlive?'HUNTING':'DEFEATED';
}
function win(){
  state.over=true; state.winner=true;
  ui.resultIcon.textContent='🏆';
  ui.resultTitle.textContent='VICTORY';
  ui.resultCopy.textContent=`${state.name}, you defeated the rival and recovered 100 gold from the enemy treasure. The battlefield belongs to you.`;
  ui.result.classList.remove('hidden');
  beep(520,.18,'triangle'); setTimeout(()=>beep(780,.3,'triangle'),150);
}
function lose(){
  state.over=true; state.winner=false;
  ui.resultIcon.textContent='☠️';
  ui.resultTitle.textContent='DEFEATED';
  ui.resultCopy.textContent='Your rival conquered you before you could secure the treasure. Return to the battlefield and try again.';
  ui.result.classList.remove('hidden');
  beep(80,.5,'sawtooth');
}
function resetGame(){
  state.over=false; state.winner=false; state.playerGold=0; state.enemyGold=100; state.enemyAlive=true;
  player.health=100; player.stamina=100; player.group.position.set(-34,0,0);
  enemy.health=100; enemy.group.position.set(34,0,0); enemy.group.visible=true;
  chestEnemy.rotation.set(0,0,0);
  particles.forEach(p=>scene.remove(p.mesh)); particles=[];
  ui.result.classList.add('hidden'); showToast('Battle restarted. Find the enemy treasure.');
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  if(state.started&&!state.over){
    updatePlayer(dt);
    enemyAI(dt);
    absorbEssence();
    updateCamera();
    state.toastTimer-=dt;
    if(state.toastTimer<=0) ui.toast.classList.remove('show');
  }
  chestPlayer.rotation.y+=.001;
  chestEnemy.rotation.y+=.001;
  updateUI();
  renderer.render(scene,camera);
}
function resize(){
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
}
setTimeout(()=>ui.loading.classList.add('hidden'),450);
