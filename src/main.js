import './base.css';
import './taste-overrides.css';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createShop, P, planOutline, machinePoly, staffPoly, stairPolys } from './scene.js';

const host=document.querySelector('#scene');
const scene=new THREE.Scene();scene.background=new THREE.Color('#b7b2a0');
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});}catch(error){document.querySelector('#loading').innerHTML='<p>当前浏览器未能启动三维渲染，请使用开启硬件加速的 Chrome 或 Edge 打开。</p>';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;host.appendChild(renderer.domElement);
const pmrem=new THREE.PMREMGenerator(renderer),environment=new RoomEnvironment();scene.environment=pmrem.fromScene(environment,.04).texture;scene.environmentIntensity=.22;environment.dispose();pmrem.dispose();
const camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.05,70);camera.rotation.order='YXZ';
const shop=createShop(scene);
const zones={
 entry:{pos:[395,422],look:[601,664],name:'入口 · 空间初见',index:'01',label:'入口初见'},
 order:{pos:[386,633],look:[534,690],name:'点单区域 · 一杯的开始',index:'02',label:'点单区域'},
 display:{pos:[562,416],look:[769,360],name:'草本展示 · 看见自然',index:'03',label:'草本展示'},
 lounge:{pos:[318,804],look:[154,662],name:'顾客休息 · 自在一刻',index:'04',label:'自在休息'}
};
let currentZone='entry',yaw=0,pitch=0,transition=null,overview=false,drag=null,moved=false,lightMode='warm',mapOpen=true;
let orbitYaw=-.20,orbitPitch=1.13,orbitRadius=12.9;const orbitTarget=new THREE.Vector3(0,.3,.25);
const keys=new Set();const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function pose(zone){const pos=P(...zone.pos);pos.y=1.6;const target=P(...zone.look);target.y=1.42;const d=target.sub(pos);return{pos,yaw:Math.atan2(-d.x,-d.z),pitch:Math.atan2(d.y,Math.hypot(d.x,d.z))};}
function wrap(a){return Math.atan2(Math.sin(a),Math.cos(a));}
function goZone(key,instant=false){if(!zones[key])return;const zone=zones[key],next=pose(zone),wasOverview=overview;overview=false;document.body.classList.remove('overview');shop.ceiling.visible=true;document.querySelector('#overview-btn').textContent='俯瞰全店 ↗';currentZone=key;
 document.querySelectorAll('.zone').forEach(b=>b.classList.toggle('active',b.dataset.zone===key));document.querySelector('#area-name').textContent=zone.name;document.querySelector('#area-index').textContent=zone.index+' / 04';
 if(instant||reduceMotion||wasOverview){camera.position.copy(next.pos);yaw=next.yaw;pitch=next.pitch;transition=null;}else{transition={start:performance.now(),from:camera.position.clone(),to:next.pos,fromYaw:yaw,toYaw:yaw+wrap(next.yaw-yaw),fromPitch:pitch,toPitch:next.pitch};}
 camera.rotation.set(pitch,yaw,0);}
goZone('entry',true);
document.querySelectorAll('.zone').forEach(b=>b.addEventListener('click',()=>goZone(b.dataset.zone)));
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();goZone('entry');});
let toastTimer;function toast(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2800);}
function toggleOverview(){if(overview){goZone(currentZone);return;}overview=true;transition=null;shop.ceiling.visible=false;document.body.classList.add('overview');document.querySelector('#overview-btn').textContent='返回店内 ↙';document.querySelector('#area-name').textContent='全店俯瞰 · 分区与动线';toast('拖动旋转 · 滚轮缩放 · 点击区域返回店内');}
document.querySelector('#overview-btn').addEventListener('click',toggleOverview);
document.querySelector('#map-toggle').addEventListener('click',()=>{mapOpen=!mapOpen;document.querySelector('#map-body').hidden=!mapOpen;document.querySelector('#map-toggle').textContent=mapOpen?'−':'+';document.querySelector('#map-toggle').setAttribute('aria-label',mapOpen?'收起平面图':'展开平面图');});
for(const [button,dialog] of [['reference-btn','reference-dialog'],['help-btn','help-dialog']])document.getElementById(button).addEventListener('click',()=>{keys.clear();document.getElementById(dialog).showModal();});
document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
document.querySelector('#fullscreen-btn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前窗口不支持全屏，可在独立浏览器中打开。');}});
document.querySelector('#light-btn').addEventListener('click',()=>{lightMode=lightMode==='warm'?'day':'warm';const day=lightMode==='day';shop.sky.intensity=day?1.7:.85;shop.daylight.intensity=day?2.7:1.1;shop.lights.forEach(l=>l.color.set(day?'#fff0d5':'#ffdfac'));renderer.toneMappingExposure=day?1.10:.92;document.querySelector('#light-label').textContent=day?'日间自然光':'暖光氛围';});
document.querySelector('#capture-btn').addEventListener('click',()=>{renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(!blob){toast('当前浏览器无法保存画面');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`本色茶饮-${overview?'全店俯瞰':zones[currentZone].label}-${Date.now()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('当前三维视角已保存');});});
host.addEventListener('pointerdown',e=>{if(e.button!==0)return;transition=null;drag={x:e.clientX,y:e.clientY,id:e.pointerId};moved=false;host.setPointerCapture(e.pointerId);host.style.cursor='grabbing';});
host.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;moved=true;if(overview){orbitYaw-=dx*.005;orbitPitch=THREE.MathUtils.clamp(orbitPitch+dy*.004,.4,1.5);}else{yaw-=dx*.003;pitch=THREE.MathUtils.clamp(pitch-dy*.003,-1.15,1.1);}});
function release(){drag=null;host.style.cursor='grab';}host.addEventListener('pointerup',release);host.addEventListener('pointercancel',release);host.style.cursor='grab';
host.addEventListener('wheel',e=>{if(overview){e.preventDefault();orbitRadius=THREE.MathUtils.clamp(orbitRadius+e.deltaY*.008,7,22);}}, {passive:false});
const keyMap={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if(keyMap[e.code]){e.preventDefault();keys.add(keyMap[e.code]);transition=null;}if(e.code==='Escape')keys.clear();});window.addEventListener('keyup',e=>keys.delete(keyMap[e.code]));window.addEventListener('blur',()=>{keys.clear();release();});document.addEventListener('visibilitychange',()=>keys.clear());
document.querySelectorAll('[data-move]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();transition=null;keys.add(b.dataset.move);b.setPointerCapture(e.pointerId);});['pointerup','pointercancel','lostpointercapture'].forEach(type=>b.addEventListener(type,()=>keys.delete(b.dataset.move)));});
function inPoly(x,z,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,zi]=poly[i],[xj,zj]=poly[j];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))inside=!inside;}return inside;}
function distanceToSegment(p,a,b){const vx=b.x-a.x,vz=b.z-a.z;const t=THREE.MathUtils.clamp(((p.x-a.x)*vx+(p.z-a.z)*vz)/(vx*vx+vz*vz||1),0,1);return Math.hypot(p.x-a.x-t*vx,p.z-a.z-t*vz);}
function walkable(p){const px=p.x*90+520,pz=p.z*90+560;if(!inPoly(px,pz,planOutline)||inPoly(px,pz,machinePoly)||inPoly(px,pz,staffPoly)||stairPolys.some(poly=>inPoly(px,pz,poly)))return false;for(const s of shop.solids)if(distanceToSegment(p,s.a,s.b)<s.r+.19)return false;return true;}
function move(dt){if(!keys.size||overview)return;const f=(keys.has('forward')?1:0)-(keys.has('back')?1:0),r=(keys.has('right')?1:0)-(keys.has('left')?1:0);if(!f&&!r)return;const norm=Math.hypot(f,r),speed=dt*1.55;const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)/norm*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)/norm*speed;const next=camera.position.clone();next.x+=dx;if(walkable(next))camera.position.x=next.x;next.copy(camera.position);next.z+=dz;if(walkable(next))camera.position.z=next.z;}
// Small plan is drawn from the same source coordinates as the 3D shell.
const map=document.querySelector('#minimap'),ctx=map.getContext('2d');const ms=.345,ox=28,oz=-60;
function mapPoint(x,z){return [x*ms+ox,z*ms+oz];}
function mapPoly(poly,fill,stroke){ctx.beginPath();poly.forEach(([x,z],i)=>{const [mx,my]=mapPoint(x,z);i?ctx.lineTo(mx,my):ctx.moveTo(mx,my);});ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();}}
function mapLabel(text,x,z,color='#b3bba0',size=16){const p=mapPoint(x,z);ctx.fillStyle=color;ctx.font=`${size}px "Microsoft YaHei"`;ctx.textAlign='center';ctx.fillText(text,...p);}
function drawMap(){if(!mapOpen)return;ctx.clearRect(0,0,440,360);mapPoly(planOutline,'#36412e','#7c866a');mapPoly(machinePoly,'#293323','#5b6650');mapPoly(staffPoly,'#3b4431',null);mapPoly([[100,532],[345,532],[370,865],[48,757]],'#4b563b',null);stairPolys.forEach(poly=>mapPoly(poly,'#566047','#737d60'));
 mapPoly([[527,543],[558,550],[501,842],[470,835]],'#b3a580',null);mapPoly([[548,545],[718,570],[714,594],[544,570]],'#9c8e6c',null);mapPoly([[738,245],[778,245],[778,452],[738,452]],'#a49b75',null);mapPoly([[110,548],[132,553],[77,750],[54,742]],'#8d9476',null);
 for(let i=0;i<3;i++){const p=mapPoint(173-i*18,604+i*65);ctx.beginPath();ctx.arc(...p,7,0,Math.PI*2);ctx.fillStyle='#a8af89';ctx.fill();}mapLabel('休息',234,713);mapLabel('点单',535,748,'#d6caa3',13);mapLabel('制作',660,800,'#869373',13);mapLabel('机房',894,433,'#83916e',14);mapLabel('展示',678,361,'#d6caa3',13);mapLabel('入口',321,324,'#b9c79d',13);
 const pos=mapPoint(camera.position.x*90+520,camera.position.z*90+560);if(!overview){ctx.save();ctx.translate(...pos);ctx.rotate(-yaw);const gr=ctx.createRadialGradient(0,0,0,0,0,42);gr.addColorStop(0,'#e1c99355');gr.addColorStop(1,'#e1c99300');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,42,-Math.PI*.73,-Math.PI*.27);ctx.closePath();ctx.fill();ctx.restore();ctx.beginPath();ctx.arc(...pos,6,0,Math.PI*2);ctx.fillStyle='#efd9a2';ctx.fill();ctx.strokeStyle='#252d20';ctx.lineWidth=2;ctx.stroke();}}
map.addEventListener('click',e=>{const rect=map.getBoundingClientRect();const x=((e.clientX-rect.left)*440/rect.width-ox)/ms,z=((e.clientY-rect.top)*360/rect.height-oz)/ms;const key=x<365&&z>520?'lounge':x>620&&z<490?'display':z>540?'order':'entry';goZone(key);});
const hotspotConfig=[['order',480,655,1.22],['display',736,368,1.58],['lounge',179,663,.85]];const hotspots=hotspotConfig.map(([key,x,z,y])=>{const b=document.createElement('button');b.className='hotspot';b.innerHTML=`<i></i><span>${zones[key].label} ↗</span>`;b.setAttribute('aria-label','前往'+zones[key].label);b.onclick=()=>goZone(key);document.querySelector('#hotspots').appendChild(b);const pos=P(x,z);pos.y=y;return{key,el:b,pos};});
function drawHotspots(){for(const h of hotspots){const p=h.pos.clone().project(camera),distance=camera.position.distanceTo(h.pos),inFront=p.z<1&&p.z>-1;const x=(p.x*.5+.5)*innerWidth,y=(-p.y*.5+.5)*innerHeight;const show=!overview&&h.key!==currentZone&&inFront&&distance<8&&x>35&&x<innerWidth-35&&y>110&&y<innerHeight-170;h.el.style.display=show?'flex':'none';if(show){h.el.style.left=x+'px';h.el.style.top=y+'px';}}}
function resize(){camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<700?75:66;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}window.addEventListener('resize',resize);resize();
let last=performance.now(),frames=0;function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(overview){camera.position.set(orbitTarget.x+Math.sin(orbitYaw)*Math.cos(orbitPitch)*orbitRadius,Math.sin(orbitPitch)*orbitRadius,orbitTarget.z+Math.cos(orbitYaw)*Math.cos(orbitPitch)*orbitRadius);camera.lookAt(orbitTarget);}else{if(transition){let t=THREE.MathUtils.clamp((now-transition.start)/1050,0,1);const smooth=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,smooth);yaw=THREE.MathUtils.lerp(transition.fromYaw,transition.toYaw,smooth);pitch=THREE.MathUtils.lerp(transition.fromPitch,transition.toPitch,smooth);if(t===1)transition=null;}else move(dt);camera.rotation.set(pitch,yaw,0);}renderer.render(scene,camera);if(++frames%2===0){drawMap();drawHotspots();}if(frames===3)document.querySelector('#loading').classList.add('done');}
requestAnimationFrame(animate);
// Read-only diagnostics for preview validation and WebGL troubleshooting.
window.__teaShop={getState:()=>({zone:currentZone,overview,lightMode,position:camera.position.toArray(),yaw,pitch,walkable:walkable(camera.position),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),ready:true};
