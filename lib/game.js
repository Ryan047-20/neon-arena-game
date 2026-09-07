import * as THREE from 'three';
import {obstacles,moveBody,pulseHits} from './physics.js';
export function createGame(container,onHud) {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#050a15');scene.fog=new THREE.FogExp2('#050a15',.025);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;container.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(60,1,.1,150);
  scene.add(new THREE.HemisphereLight(0xadcfff,0x182322,2.4));
  const sun=new THREE.DirectionalLight(0xbadfff,3);sun.position.set(5,18,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22});scene.add(sun);
  const materials=[];
  function mat(color,emissive=0){const m=new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:1.6,roughness:.5,metalness:.45});materials.push(m);return m;}
  const floorMat=mat(0x10232e),wallMat=mat(0x1a3041),mint=mat(0x9affd6,0x35c98a),pink=mat(0xff688b,0xf51c53),dark=mat(0x263c50),white=mat(0xc2e4f0);
  function box(w,h,d,m,x=0,y=0,z=0,parent=scene){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  box(35,.5,35,floorMat,0,-.25,0);
  const grid=new THREE.GridHelper(34,34,0x23626b,0x193b49);grid.position.y=.012;scene.add(grid);
  for(const o of obstacles){box(o.w,o.h,o.d,wallMat,o.x,o.h/2,o.z);box(o.w+.03,.035,o.d+.03,mint,o.x,o.h+.02,o.z);box(o.w-.12,.03,o.d-.12,dark,o.x,o.h+.043,o.z);}
  for(let i=0;i<4;i++) {const g=new THREE.Group();g.rotation.y=i*Math.PI/2;scene.add(g);box(35,1,0.5,wallMat,0,.5,-17.5,g);box(35,.08,.12,mint,0,1.03,-17.5,g);for(let x=-16;x<=16;x+=4){box(.3,3,.3,wallMat,x,1.5,-17.5,g);box(.08,1.8,.08,mint,x,2,-17.3,g);}}
  const ring=new THREE.Mesh(new THREE.RingGeometry(4.5,4.56,96),mint);ring.rotation.x=-Math.PI/2;ring.position.y=.018;scene.add(ring);
  for(let i=0;i<36;i++){const a=i*Math.PI*2/36,r=25+(i%4)*4;box(2,3+(i%7)*2,2,wallMat,Math.cos(a)*r,(3+(i%7)*2)/2-2,Math.sin(a)*r);}
  function robot(enemy=false){const g=new THREE.Group();scene.add(g);const glow=enemy?pink:mint;box(.78,.8,.52,enemy?dark:white,0,1.03,0,g);box(.64,.48,.57,dark,0,1.7,0,g);box(.5,.13,.06,glow,0,1.73,-.3,g);box(.32,.23,.07,glow,0,1.05,-.28,g);const legs=[box(.26,.6,.3,dark,-.23,.35,0,g),box(.26,.6,.3,dark,.23,.35,0,g)];box(.23,.7,.28,glow,-.57,1,0,g);box(.23,.7,.28,glow,.57,1,0,g);return {g,legs};}
  const pilot=robot();let player={x:0,y:0,z:4,vy:0,r:.48,grounded:true};
  let mode='start',health=100,score=0,time=0,cooldown=0,hurt=0,spawnTimer=0,yaw=0,pitch=.38,drag=false,frame=0,last=performance.now(),hudTimer=0,audio;
  const enemies=[],effects=[],keys=new Set(),listeners=[];
  function listen(target,event,fn){target.addEventListener(event,fn);listeners.push(()=>target.removeEventListener(event,fn));}
  function beep(freq,duration=.1){try{audio??=new AudioContext();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='triangle';osc.frequency.setValueAtTime(freq,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*.35,audio.currentTime+duration);gain.gain.setValueAtTime(.045,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);}catch{}}
  function emit(){onHud({mode,health,score,time,enemies:enemies.length,cooldown});}
  function removeObject(g){scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
  function burst(x,y,z,color,size=1){const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,wireframe:true});const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(size,1),m);mesh.position.set(x,y,z);scene.add(mesh);effects.push({mesh,life:.4,max:.4});}
  function spawn(){if(enemies.length>=24)return;const a=Math.random()*Math.PI*2;let x=Math.cos(a)*15,z=Math.sin(a)*15;if(Math.hypot(x-player.x,z-player.z)<7){x=-x;z=-z;}const model=robot(true);const bar=box(.85,.07,.04,mint,0,2.2,0,model.g);enemies.push({...model,x,z,y:0,vy:0,r:.5,grounded:true,hp:2,hit:0,attack:1,bar});burst(x,.5,z,0xff4779,.7);}
  function attack(){if(mode!=='playing'||cooldown>0)return;cooldown=.65;beep(180,.2);burst(player.x,player.y+1,player.z,0x8effcb,2.2);for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(!pulseHits(player,e))continue;e.hp--;e.hit=.2;e.bar.scale.x=e.hp/2;const dx=e.x-player.x,dz=e.z-player.z,n=Math.hypot(dx,dz)||1;moveBody(e,dx/n*1.2,dz/n*1.2,0);burst(e.x,e.y+1,e.z,0xff668c,.6);if(e.hp<=0){removeObject(e.g);enemies.splice(i,1);score+=100;health=Math.min(100,health+3);beep(550,.1);}}emit();}
  function pause(){if(mode==='playing'){mode='paused';keys.clear();drag=false;if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();emit();}}
  function start(){if(mode!=='paused'){for(const e of enemies)removeObject(e.g);enemies.length=0;for(const e of effects){removeObject(e.mesh);e.mesh.material.dispose();}effects.length=0;player={x:0,y:0,z:4,vy:0,r:.48,grounded:true};health=100;score=0;time=0;cooldown=0;hurt=0;yaw=0;pitch=.38;spawnTimer=2;for(let i=0;i<3;i++)spawn();}mode='playing';keys.clear();last=performance.now();beep(350);try{const p=renderer.domElement.requestPointerLock();p?.catch(()=>{});}catch{}emit();}
  listen(window,'keydown',e=>{if(['Space','KeyW','KeyA','KeyS','KeyD','KeyF','Escape'].includes(e.code))e.preventDefault();if(e.code==='Escape')pause();if(mode!=='playing')return;keys.add(e.code);if(e.code==='KeyF')attack();if(e.code==='Space'&&!e.repeat&&player.grounded){player.vy=9;player.grounded=false;beep(280,.08);}});
  listen(window,'keyup',e=>keys.delete(e.code));
  listen(renderer.domElement,'mousedown',e=>{if(e.button===0){drag=true;attack();}});listen(window,'mouseup',()=>drag=false);
  listen(window,'mousemove',e=>{if(mode==='playing'&&(document.pointerLockElement===renderer.domElement||drag)){yaw-=e.movementX*.003;pitch=THREE.MathUtils.clamp(pitch+e.movementY*.002,.12,1.1);}});
  listen(document,'pointerlockchange',()=>{if(!document.pointerLockElement)pause();});listen(window,'blur',pause);listen(document,'visibilitychange',()=>{if(document.hidden)pause();});
  function resize(){renderer.setSize(container.clientWidth,container.clientHeight);camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();}listen(window,'resize',resize);resize();
  const ray=new THREE.Raycaster(),target=new THREE.Vector3(),desired=new THREE.Vector3();
  const blockers=scene.children.filter(o=>o.isMesh&&o.geometry.type==='BoxGeometry');
  function update(dt){
    time+=dt;cooldown=Math.max(0,cooldown-dt);hurt=Math.max(0,hurt-dt);spawnTimer-=dt;if(spawnTimer<=0){spawn();spawnTimer=Math.max(.65,3.1-time*.018);}
    let mx=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),mz=(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0);const n=Math.hypot(mx,mz)||1;mx/=n;mz/=n;const dx=(mx*Math.cos(yaw)+mz*Math.sin(yaw))*7*dt,dz=(-mx*Math.sin(yaw)+mz*Math.cos(yaw))*7*dt;moveBody(player,dx,dz,dt);if(mx||mz)pilot.g.rotation.y=Math.atan2(-dx,-dz);
    pilot.legs.forEach((leg,i)=>leg.rotation.x=(mx||mz)?Math.sin(time*14+i*Math.PI)*.55:0);pilot.g.visible=hurt<=0||Math.floor(hurt*15)%2===0;
    for(const e of enemies){e.attack-=dt;e.hit=Math.max(0,e.hit-dt);const ex=player.x-e.x,ez=player.z-e.z,dist=Math.hypot(ex,ez);if(dist<30&&dist>1){const speed=(2.5+Math.min(time*.015,1.6))*(e.hit>0?.15:1);let vx=ex/dist,vz=ez/dist;for(const other of enemies){if(other===e)continue;const sx=e.x-other.x,sz=e.z-other.z,d=Math.hypot(sx,sz);if(d<1.3&&d>.01){vx+=sx/d*.65;vz+=sz/d*.65;}}const beforeX=e.x,beforeZ=e.z;moveBody(e,vx*speed*dt,vz*speed*dt,dt);if(e.grounded&&Math.hypot(e.x-beforeX,e.z-beforeZ)<speed*dt*.4){e.vy=9;e.grounded=false;}}else moveBody(e,0,0,dt);
      if(dist<1.5&&Math.abs(player.y-e.y)<1.8&&e.attack<=0&&hurt<=0){health=Math.max(0,health-12);hurt=.65;e.attack=1;beep(80,.2);burst(player.x,player.y+1,player.z,0xff3355,.8);if(health<=0){mode='over';keys.clear();document.exitPointerLock?.();emit();break;}}
      e.g.position.set(e.x,e.y,e.z);e.g.rotation.y=Math.atan2(-ex,-ez);e.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(time*10+i*Math.PI)*.5);e.bar.lookAt(camera.position);
    }
  }
  function tick(now){frame=requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;if(mode==='playing')update(dt);pilot.g.position.set(player.x,player.y,player.z);
    if(mode==='start'){camera.position.set(23,19,25);camera.lookAt(0,0,0);}else{target.set(player.x,player.y+1.4,player.z);desired.set(Math.sin(yaw)*8*Math.cos(pitch),3+Math.sin(pitch)*7,Math.cos(yaw)*8*Math.cos(pitch));const length=desired.length();ray.set(target,desired.clone().normalize());ray.far=length;const hit=ray.intersectObjects(blockers,false)[0];if(hit)desired.setLength(Math.max(.8,hit.distance-.3));desired.add(target);camera.position.lerp(desired,1-Math.exp(-14*dt));camera.lookAt(target);}
    for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;e.mesh.scale.multiplyScalar(1+dt*5);e.mesh.material.opacity=Math.max(0,e.life/e.max)*.7;if(e.life<=0){removeObject(e.mesh);e.mesh.material.dispose();effects.splice(i,1);}}
    hudTimer+=dt;if(hudTimer>.1){emit();hudTimer=0;}renderer.render(scene,camera);
  }frame=requestAnimationFrame(tick);emit();
  return {start,dispose(){cancelAnimationFrame(frame);listeners.forEach(fn=>fn());if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();scene.traverse(o=>{o.geometry?.dispose();});materials.forEach(m=>m.dispose());effects.forEach(e=>e.mesh.material.dispose());renderer.dispose();renderer.domElement.remove();audio?.close();}};
}

