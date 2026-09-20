import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const planOutline=[[300,180],[460,250],[540,315],[650,315],[650,232],[780,232],[790,315],[1000,330],[1000,580],[883,549],[865,705],[820,940],[370,875],[40,760],[100,525],[345,520],[345,390],[180,400]];
export const P=(x,z)=>new THREE.Vector3((x-520)/90,0,(z-560)/90);
export const machinePoly=[[790,315],[1000,330],[1000,580],[793,530]];
export const staffPoly=[[535,535],[746,569],[722,673],[865,710],[820,940],[460,888]];
export const stairPolys=[[[75,400],[343,391],[343,510],[62,510]],[[753,552],[884,580],[865,704],[727,674]]];
export function createShop(scene){
  const solids=[], ceiling=new THREE.Group(), lights=[];scene.add(ceiling);
  let seed=981;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function texture(kind,base){const c=document.createElement('canvas');c.width=c.height=512;const a=c.getContext('2d');a.fillStyle=base;a.fillRect(0,0,512,512);
    for(let i=0;i<30000;i++){const x=rand()*512,y=rand()*512;a.fillStyle=`rgba(${rand()>.5?'255,244,220':'15,12,9'},${rand()*(kind==='wood'?.008:.022)})`;a.fillRect(x,y,kind==='wood'?.4+rand()*1.3:1,kind==='wood'?10+rand()*120:1+rand()*3);}
    if(kind==='stone'){for(let i=0;i<18;i++){a.strokeStyle='rgba(238,227,207,.05)';a.lineWidth=rand()*2;a.beginPath();a.moveTo(rand()*512,0);a.bezierCurveTo(rand()*512,150,rand()*512,320,rand()*512,512);a.stroke();}a.strokeStyle='#615e55';a.lineWidth=2;a.strokeRect(0,0,512,512);a.strokeStyle='#d3c8b022';a.lineWidth=2;a.strokeRect(3,3,506,506);}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
  const stoneTex=texture('stone','#777873');stoneTex.repeat.set(1.15,1.15);
  const woodTex=texture('wood','#34291f');woodTex.repeat.set(2,1);
  const plasterTex=texture('plaster','#a89e8c');plasterTex.repeat.set(3,2);
  const darkTex=texture('grain','#25231f');
  const mat=(color,roughness=.75,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const wood=new THREE.MeshPhysicalMaterial({map:woodTex,roughness:.52,clearcoat:.18,clearcoatRoughness:.28}),plaster=new THREE.MeshStandardMaterial({map:plasterTex,roughness:.92});
  const black=new THREE.MeshPhysicalMaterial({map:darkTex,roughness:.42,metalness:.04,clearcoat:.32,clearcoatRoughness:.24}),top=mat('#262924',.26,.22),brass=mat('#9b8457',.34,.72),green=mat('#5c6340'),leather=new THREE.MeshPhysicalMaterial({color:'#272a24',roughness:.62,clearcoat:.16,clearcoatRoughness:.38}),cream=mat('#ded3b8'),metal=mat('#898c82',.26,.8),pillow=mat('#697050',.78),paperMat=mat('#ddd2b8',.96),copper=mat('#6b4d33',.44,.48);
  const glow=new THREE.MeshStandardMaterial({color:'#ffdf9c',emissive:'#ffca78',emissiveIntensity:2.3,roughness:.8});
  const paper=new THREE.MeshStandardMaterial({color:'#efe0bc',emissive:'#ffda9a',emissiveIntensity:.42,roughness:.9});
  const glass=new THREE.MeshPhysicalMaterial({color:'#d6e4dc',transparent:true,opacity:.13,roughness:.1,metalness:.05,depthWrite:false,side:THREE.DoubleSide});
  function box(w,h,d,m,x,y,z,parent=scene,rounded=false){const geo=rounded?new RoundedBoxGeometry(w,h,d,2,.025):new THREE.BoxGeometry(w,h,d);const ob=new THREE.Mesh(geo,m);ob.position.set(x,y,z);ob.castShadow=true;ob.receiveShadow=true;parent.add(ob);return ob;}
  function cyl(rt,rb,h,m,x,y,z,parent=scene){const ob=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,32),m);ob.position.set(x,y,z);ob.castShadow=true;ob.receiveShadow=true;parent.add(ob);return ob;}
  function groupAt(px,pz,angle=0){const g=new THREE.Group();g.position.copy(P(px,pz));g.rotation.y=angle;scene.add(g);return g;}
  function segment(a,b,width,height,y,m,parent=scene){const u=P(...a),v=P(...b),d=u.distanceTo(v);const ob=box(d,height,width,m,(u.x+v.x)/2,y,(u.z+v.z)/2,parent);ob.rotation.y=-Math.atan2(v.z-u.z,v.x-u.x);return ob;}
  function solid(a,b,depth){solids.push({a:P(...a),b:P(...b),r:depth/2});}
  function wall(a,b){segment(a,b,.14,3.08,1.54,plaster);segment(a,b,.17,.1,.05,wood);solid(a,b,.14);}
  const shape=new THREE.Shape();planOutline.forEach(([x,z],i)=>{const p=P(x,z);i?shape.lineTo(p.x,-p.z):shape.moveTo(p.x,-p.z);});shape.closePath();
  const floor=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({map:stoneTex,roughness:.53,metalness:.06}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const roof=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat('#bdb09a'));roof.rotation.x=Math.PI/2;roof.scale.y=-1;roof.position.y=3.09;roof.material.side=THREE.DoubleSide;ceiling.add(roof);
  for(let i=0;i<planOutline.length-1;i++)wall(planOutline[i],planOutline[i+1]);
  // Dark timber envelops the seating nook, following the supplied lounge reference.
  segment([100,525],[40,760],.18,3.07,1.535,wood);
  segment([40,760],[370,875],.18,3.07,1.535,wood);
  segment([100,525],[345,520],.18,3.07,1.535,wood);
  // An open double door occupies the break in the traced perimeter.
  const ea=P(180,400),eb=P(300,180),eg=groupAt(240,290,-Math.atan2(eb.z-ea.z,eb.x-ea.x));
  const ew=ea.distanceTo(eb);box(ew,.10,.10,black,0,2.7,0,eg);
  for(const x of [-ew/2,ew/2])box(.07,2.7,.1,black,x,1.35,0,eg);
  for(const side of [-1,1]){const door=new THREE.Group();door.position.x=side*ew/2;door.rotation.y=side*.75;eg.add(door);box(ew/2-.08,2.5,.025,glass,-side*ew/4,1.32,0,door);box(.035,2.5,.04,black,-side*ew/2,1.32,0,door);box(.025,.46,.045,brass,-side*(ew/2-.12),1.2,.05,door);}
  // Machine room; no public access. Showcase rests against its west side.
  wall([790,315],[790,470]);wall([790,470],[790,530]);wall([790,530],[1000,580]);
  segment([790,315],[790,472],.17,3.0,1.5,wood);
  const doorG=groupAt(891,554,-Math.atan2(50,210));box(.9,2.22,.045,wood,0,1.11,-.09,doorG);box(.05,.15,.04,brass,.32,1.12,-.12,doorG);
  for(const poly of stairPolys){const a=poly[0],b=poly[1],c=poly[2],d=poly[3];for(let i=0;i<8;i++){const t=(i+.5)/8;const left=[a[0]+(d[0]-a[0])*t,a[1]+(d[1]-a[1])*t],right=[b[0]+(c[0]-b[0])*t,b[1]+(c[1]-b[1])*t];segment(left,right,.18,.09+i*.085,.045+i*.0425,plaster);}}
  // Wall-mounted signs are actual textures, so text remains part of the space.
  function canvasSign(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:t});}
  function signPlane(w,h,material,x,y,z,parent){const ob=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);ob.position.set(x,y,z);parent.add(ob);return ob;}
  function words(text,sub='',bg='#292b23',fg='#e0c997'){return canvasSign(1024,256,(a,w,h)=>{a.fillStyle=bg;a.fillRect(0,0,w,h);a.fillStyle=fg;a.textAlign='center';a.font='58px "Microsoft YaHei"';a.fillText(text,w/2,116);a.font='18px Arial';a.fillText(sub,w/2,178);});}
  // Counter runs along the exact slanted line on the supplied plan.
  const cg=groupAt(509,684,-Math.atan2(272,-52)),cw=3.08;
  box(cw,.94,.66,black,0,.53,0,cg,true);box(cw+.05,.07,.74,top,0,1.035,0,cg,true);box(cw,.04,.04,glow,0,.10,.345,cg);box(cw,.075,.055,brass,0,.045,.31,cg);
  for(let i=0;i<=5;i++)box(.012,.83,.009,brass,-cw/2+i*cw/5,.53,.338,cg);
  signPlane(.66,.165,words('点 单','ORDER HERE'),-.15,.64,.342,cg);
  for(let i=0;i<2;i++){const x=-cw/2+i*cw;box(.12,2.72,.76,black,x,1.4,0,cg);box(.012,2.70,.01,brass,x+.053,1.4,.387,cg);}
  box(cw+.15,.54,.79,black,0,2.62,0,cg);box(cw-.12,.39,.014,paper,0,2.62,.407,cg);
  for(let i=0;i<=9;i++)box(.015,.4,.025,brass,-cw/2+i*cw/9,2.62,.425,cg);
  for(const y of [2.54,2.7])box(cw,.009,.018,black,0,y,.43,cg);
  box(.13,.20,.12,black,-.40,1.17,-.02,cg);const pos=box(.41,.26,.04,black,-.4,1.31,.02,cg,true);pos.rotation.x=-.35;signPlane(.35,.18,words('本 色','','#373f30'),-.4,1.32,.065,cg);
  const pickup=groupAt(621,568,-Math.atan2(30,180));box(1.9,.94,.65,black,0,.53,0,pickup,true);box(1.95,.055,.72,top,0,1.035,0,pickup);box(1.92,.025,.03,glow,0,.11,-.337,pickup);
  const ps=signPlane(.83,.21,words('外卖取餐','PICKUP'),0,.62,-.337,pickup);ps.rotation.y=Math.PI;
  const pickupEnd=groupAt(480,832,-Math.atan2(272,-52));box(.58,.94,.66,black,0,.53,0,pickupEnd);box(.64,.055,.74,top,0,1.035,0,pickupEnd);signPlane(.44,.22,words('取 餐','COLLECTION'),0,.65,.338,pickupEnd);
  solid([535,548],[480,843],.73);solid([545,555],[714,582],.70);
  function cup(x,y,z,parent,color=cream){cyl(.043,.033,.13,color,x,y+.065,z,parent);cyl(.048,.048,.012,black,x,y+.133,z,parent);cyl(.046,.046,.013,cream,x,y+.144,z,parent);}
  cup(.2,1.08,.14,cg);cup(.35,1.08,.14,cg);box(.40,.025,.25,wood,.27,1.09,.16,cg);
  for(const x of [-.48,0]){box(.23,.32,.15,mat('#ac8956'),x,1.22,0,pickup);const handle=new THREE.Mesh(new THREE.TorusGeometry(.065,.006,6,20,Math.PI),brass);handle.position.set(x,1.4,0);pickup.add(handle);}
  // Back-of-house fixtures: sink, undercounter refrigerator and preparation shelf.
  const kg=groupAt(797,802,-Math.atan2(225,-45));box(2.45,.83,.65,black,0,.45,0,kg);box(2.5,.055,.7,metal,0,.895,0,kg);
  for(let i=0;i<3;i++){box(.73,.69,.025,metal,-.82+i*.82,.45,.335,kg);box(.23,.025,.04,black,-.82+i*.82,.71,.36,kg);}
  box(.47,.012,.43,black,-.68,.931,0,kg);box(.41,.015,.37,metal,-.68,.94,0,kg);const faucet=new THREE.Mesh(new THREE.TorusGeometry(.115,.014,8,24,Math.PI),metal);faucet.position.set(-.7,1.12,-.22);kg.add(faucet);cyl(.014,.014,.18,metal,-.815,1.025,-.22,kg);
  for(const x of [.10,.60]){cyl(.14,.14,.26,metal,x,1.05,0,kg);cyl(.15,.15,.025,black,x,1.19,0,kg);}
  box(2.4,.05,.28,wood,0,1.66,-.16,kg);for(let i=0;i<9;i++){cyl(.067,.067,.23,mat(i%2?'#726342':'#5b6443',.4),-.99+i*.24,1.8,-.16,kg);cyl(.073,.073,.025,brass,-.99+i*.24,1.93,-.16,kg);}
  // Showcase is on the machine-room side wall, facing the customer space.
  const dg=groupAt(766,365,-Math.PI/2),dw=1.92;
  box(dw,.85,.56,black,0,.46,0,dg,true);box(dw+.04,.045,.62,wood,0,.9,0,dg);box(dw,.03,.03,glow,0,.06,.29,dg);
  for(const x of [-dw/2,0,dw/2])box(.013,.78,.02,brass,x,.46,.29,dg);
  for(const x of [-dw/2,dw/2]){box(.018,.58,.018,brass,x,1.20,.28,dg);box(.012,.58,.53,glass,x,1.20,0,dg);}
  box(dw,.012,.57,glass,0,1.49,0,dg);box(dw,.58,.012,glass,0,1.2,.28,dg);box(dw,.026,.045,glow,0,1.44,-.22,dg);
  const packColors=['#7f8c55','#ac6f52','#c7a162','#dad1b3','#9baba7'];
  for(let i=0;i<5;i++){const x=-.74+i*.31;box(.22,.36,.105,mat(packColors[i]),x,1.10,0,dg);const pm=words('本草','HERBAL TEA',packColors[i],'#353b2a');signPlane(.18,.12,pm,x,1.13,.057,dg);box(.2,.009,.11,brass,x,1.28,0,dg);}
  const menuMat=canvasSign(1536,768,(a,w,h)=>{a.fillStyle='#252720';a.fillRect(0,0,w,h);a.strokeStyle='#a69063';a.lineWidth=2;a.strokeRect(30,30,w-60,h-60);a.fillStyle='#e6d1a5';a.textAlign='center';a.font='66px "SimSun"';a.fillText('本 草 茶 饮',w/2,135);a.font='23px "Microsoft YaHei"';a.fillText('一 杯 自 然   回 归 本 真',w/2,200);const names=['绿茶','红茶','乌龙','花茶','纯茶'];for(let i=0;i<5;i++){const x=220+i*275;const gr=a.createLinearGradient(x-60,0,x+60,0);gr.addColorStop(0,packColors[i]);gr.addColorStop(.5,'#d5b477');gr.addColorStop(1,packColors[i]);a.fillStyle=gr;a.beginPath();a.moveTo(x-65,300);a.lineTo(x+65,300);a.lineTo(x+50,520);a.lineTo(x-50,520);a.closePath();a.fill();a.strokeStyle='#f0e9cf88';a.lineWidth=4;a.stroke();a.fillStyle='#fff0ca88';a.beginPath();a.ellipse(x,302,64,13,0,0,Math.PI*2);a.fill();a.fillStyle='#fff4d075';for(let j=0;j<3;j++){a.save();a.translate(x+(j-1)*25,380+j*29);a.rotate(j*.9);a.beginPath();a.ellipse(0,0,10,25,.6,0,7);a.fill();a.restore();}a.fillStyle='#e6d1a5';a.font='30px "SimSun"';a.fillText(names[i],x,606);a.font='17px Arial';a.fillText(['GREEN','BLACK','OOLONG','FLORAL','PURE'][i],x,650);}});
  box(2.07,1.08,.07,black,0,2.23,-.19,dg);signPlane(1.98,.99,menuMat,0,2.23,-.148,dg);
  box(2.00,.018,.025,brass,0,2.77,-.205,dg);box(2.00,.018,.025,brass,0,1.69,-.205,dg);box(.018,1.08,.025,brass,-1.00,2.23,-.205,dg);box(.018,1.08,.025,brass,1.00,2.23,-.205,dg);
  solid([761,263],[761,457],.65);
  // Rest area: a continuous wall bench with equally spaced matching round tables.
  const ba=[142,553],bb=[87,746],bp=P(...ba),bq=P(...bb),benchLen=bp.distanceTo(bq),bg=groupAt(114.5,649.5,-Math.atan2(bq.z-bp.z,bq.x-bp.x)+Math.PI);
  box(benchLen,.4,.66,wood,0,.23,0,bg);box(benchLen,.14,.66,leather,0,.48,0,bg,true);box(benchLen,.62,.15,leather,0,.80,-.26,bg,true);box(benchLen,.025,.035,glow,0,.16,.33,bg);
  for(let i=0;i<4;i++)box(.008,.54,.025,black,-benchLen/2+(i+.5)*benchLen/4,.81,-.176,bg);
  box(benchLen+.12,1.09,.075,wood,0,1.94,-.33,bg);box(benchLen-.04,.93,.025,paper,0,1.94,-.28,bg);
  const bambooMat=canvasSign(1536,640,(a,w,h)=>{a.fillStyle='#e7d7b3';a.fillRect(0,0,w,h);a.strokeStyle='#737351';a.lineWidth=7;a.beginPath();a.moveTo(30,650);a.bezierCurveTo(210,400,210,140,480,-30);a.stroke();for(let i=0;i<15;i++){const x=120+i*19,y=550-i*40;a.fillStyle=i%3?'#737453':'#a39b71';a.save();a.translate(x,y);a.rotate(i%2?-1.1:.6);a.beginPath();a.ellipse(i%2?60:-60,0,82,12,0,0,Math.PI*2);a.fill();a.restore();}a.fillStyle='#514f38';a.font='64px "SimSun"';a.textAlign='center';a.fillText('各有本色，自在一杯',980,335);a.font='20px Arial';a.fillText('FIND YOUR OWN MOMENT',1000,414);});signPlane(benchLen-.10,.86,bambooMat,0,1.94,-.259,bg);
  solid(ba,bb,.72);
  // Three loose cushions keep the long banquette comfortable without breaking the sightline.
  for(const x of [-benchLen*.33,0,benchLen*.33]){const cushion=box(.44,.12,.23,pillow,x,.64,-.13,bg,true);cushion.rotation.y=(x/benchLen)*.13;}
  function roundTable(px,pz){const g=groupAt(px,pz);cyl(.13,.24,.62,black,0,.32,0,g);cyl(.29,.29,.045,wood,0,.65,0,g);cyl(.298,.298,.012,brass,0,.669,0,g);cyl(.11,.11,.012,brass,0,.679,0,g);cup(.04,.675,0,g,green);solids.push({a:P(px,pz),b:P(px,pz),r:.30});return g;}
  for(let i=0;i<3;i++){const t=(i+.5)/3;const x=108+(53-108)*t+110,z=553+(746-553)*t+22;roundTable(x,z);const sg=groupAt(x+46,z+20);cyl(.17,.16,.35,wood,0,.19,0,sg);cyl(.19,.19,.08,green,0,.41,0,sg);solids.push({a:P(x+46,z+20),b:P(x+46,z+20),r:.19});}
  const tg=groupAt(249,552);box(.50,.055,.53,wood,0,.71,0,tg,true);box(.10,.7,.10,black,0,.35,0,tg);box(.36,.025,.36,black,0,.025,0,tg);
  function chair(px,pz,rot){const g=groupAt(px,pz,rot);box(.44,.105,.43,green,0,.45,0,g,true);box(.44,.45,.09,green,0,.70,-.2,g,true);for(const x of [-.24,.24]){for(const z of [-.20,.20])box(.04,.5,.04,wood,x,.25,z,g);box(.04,.06,.52,wood,x,.62,0,g);}solids.push({a:P(px,pz),b:P(px,pz),r:.3});}
  chair(206,552,Math.PI/2);chair(292,552,-Math.PI/2);
  // Botanical corner remains outside the machine room and clear of the circulation path.
  function plant(px,pz,height=1.4){const g=groupAt(px,pz);cyl(.19,.13,.34,black,0,.17,0,g);cyl(.14,.14,.02,mat('#37372a'),0,.345,0,g);const stemMat=mat('#514d2e'),leafMat=mat('#5c7039');for(let k=0;k<5;k++){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.3,0),new THREE.Vector3((rand()-.5)*.2,height*.58,(rand()-.5)*.2),new THREE.Vector3((rand()-.5)*.5,height,(rand()-.5)*.5)]);const stem=new THREE.Mesh(new THREE.TubeGeometry(curve,12,.012,6,false),stemMat);g.add(stem);for(let j=2;j<9;j++){const point=curve.getPoint(j/9);for(let side=0;side<2;side++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),leafMat);leaf.scale.set(.13,.012,.035);leaf.position.copy(point).add(new THREE.Vector3((side?1:-1)*.095,.01,0));leaf.rotation.z=(side?1:-1)*.4;leaf.rotation.y=rand()*3;leaf.castShadow=true;g.add(leaf);}}}return g;}
  plant(682,293,1.65);plant(302,800,1.0);
  const artg=groupAt(714,321);box(.63,1.65,.05,wood,0,1.4,0,artg);const art=canvasSign(400,900,(a,w,h)=>{a.fillStyle='#e4ddc9';a.fillRect(0,0,w,h);for(let i=0;i<6;i++){a.fillStyle=['#b5bba5','#9fae94','#81997e','#617d67','#445f4b','#324d3c'][i];a.beginPath();a.moveTo(0,h);for(let x=0;x<=w;x+=20)a.lineTo(x,400+i*65+Math.sin(x*.017+i*5)*90+Math.sin(x*.04+i)*20);a.lineTo(w,h);a.fill();}a.fillStyle='#705d3c';a.font='28px serif';a.fillText('山',300,100);a.fillText('野',300,145);a.fillText('本',300,190);a.fillText('色',300,235);});signPlane(.56,1.56,art,0,1.4,.032,artg);
  // Warm architectural lighting: luminous panels, recessed spots and task lighting.
  function point(px,pz,y,power=13){const p=P(px,pz);const l=new THREE.PointLight('#ffdfac',power,6,2);l.position.set(p.x,y,p.z);scene.add(l);lights.push(l);return l;}
  function spot(px,pz,tx,tz,power=42){const p=P(px,pz),t=P(tx,tz);const l=new THREE.SpotLight('#ffe1b3',power,9,Math.PI/3,.7,1.5);l.position.set(p.x,2.96,p.z);l.target.position.set(t.x,.3,t.z);l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.bias=-.0005;l.shadow.normalBias=.04;scene.add(l,l.target);lights.push(l);return l;}
  spot(440,510,590,670,33);spot(250,680,150,690,28);spot(680,430,764,355,28);
  for(const [x,z] of [[370,350],[560,410],[630,700],[410,790],[200,580],[670,860]]){const p=P(x,z);cyl(.072,.072,.025,black,p.x,3.045,p.z,ceiling);cyl(.051,.051,.028,glow,p.x,3.027,p.z,ceiling);point(x,z,2.8,8);}
  point(580,640,2.25,13);point(700,340,2.1,10);point(150,650,1.7,6);
  const sky=new THREE.HemisphereLight('#e7e2cc','#51473b',.78);scene.add(sky);const daylight=new THREE.DirectionalLight('#e4ebd5',1.0);daylight.position.set(-6,5,-3);scene.add(daylight);
  // Display track, small spot housings and bench kick-light glows.
  segment([700,270],[704,450],.045,.04,2.98,black,ceiling);
  for(const z of [290,365,437]){const p=P(702,z);const lamp=cyl(.055,.055,.15,black,p.x,2.86,p.z,ceiling);lamp.rotation.z=-.45;}
  const columnP=P(345,380);cyl(.19,.19,3.07,black,columnP.x,1.535,columnP.z);solids.push({a:columnP,b:columnP,r:.22});
  return {solids,ceiling,lights,sky,daylight,glow};
}
