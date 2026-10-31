(()=>{
const W=360,H=600,GOAL=40,GAP=95,G=.55;
const cv=document.getElementById('c'),c=cv.getContext('2d');
cv.width=W;cv.height=H;
const CATS={
  brown:{n:'Brown',c:'#8a5a3c',d:'#6a4229',e:'#161616'},
  orange:{n:'Orange',c:'#f39a3a',d:'#d97a1c',e:'#161616'},
  white:{n:'White',c:'#f7f7f7',d:'#d9dee5',e:'#161616'},
  black:{n:'Black',c:'#2b2b35',d:'#1c1c24',e:'#ffd23f'}
};
let cat='orange',state='menu',P,plats,cam,floorR,best=0,t=0,last=0;
const TH={
 dark:{bg0:'#1d110a',bg1:'#4a2b17',wall:'#3b2314',wallHi:'#6b4426',wood:'#a9683a',foam:'rgba(255,238,210,.85)',drip:'#e9b36a',ground:'#7a4a2a',label:'#fff1dc',ink:'#f6e6d2',bar:'rgba(255,255,255,.18)',acc:'#e9a54a',snow:'rgba(255,255,255,.75)',bat:'#0c0705'},
 light:{bg0:'#f7e8d0',bg1:'#d8b183',wall:'#b98456',wallHi:'#d7a574',wood:'#8a5532',foam:'rgba(255,248,235,.95)',drip:'#c98c3f',ground:'#6a4126',label:'#fff1dc',ink:'#3a2314',bar:'rgba(58,35,20,.2)',acc:'#b8571c',snow:'rgba(255,255,255,.95)',bat:'#3a2314'}
};
let mode,T;
function setMode(m,save){mode=m;T=TH[m];document.documentElement.dataset.theme=m;document.getElementById('mode').textContent=m==='dark'?'☀':'🌙';if(save)try{localStorage.setItem('cattower-mode',m)}catch(e){}}
const keys={l:0,r:0,j:0};
try{best=+localStorage.getItem('cattower-best')||0}catch(e){}

function drawCat(g,x,y,k,dir,sq,run){
  const s=CATS[k];
  g.save();g.translate(x,y);g.scale(1-sq*.1,1+sq*.18);
  g.lineWidth=1.6;g.strokeStyle='rgba(0,0,0,.45)';g.fillStyle=s.c;
  // tail
  g.beginPath();g.moveTo(-dir*12,-10);
  g.bezierCurveTo(-dir*26,-12,-dir*28,-34,-dir*16,-34);
  g.lineWidth=5;g.strokeStyle=s.d;g.lineCap='round';g.stroke();
  g.lineWidth=1.6;g.strokeStyle='rgba(0,0,0,.45)';
  // body
  g.beginPath();g.ellipse(0,-12,14,12,0,0,7);g.fill();g.stroke();
  // feet
  g.fillStyle=s.d;
  const o=run?Math.sin(t*.02)*3:0;
  g.beginPath();g.ellipse(-7+o,-1,5,3,0,0,7);g.fill();
  g.beginPath();g.ellipse(7-o,-1,5,3,0,0,7);g.fill();
  // ears
  g.fillStyle=s.c;
  for(const sx of[-1,1]){
    g.beginPath();g.moveTo(sx*12+dir*2,-32);g.lineTo(sx*9+dir*2,-48);g.lineTo(sx*2+dir*2,-37);g.closePath();g.fill();g.stroke();
    g.fillStyle='#f4a6b8';g.beginPath();g.moveTo(sx*10+dir*2,-36);g.lineTo(sx*9+dir*2,-44);g.lineTo(sx*5+dir*2,-38);g.closePath();g.fill();g.fillStyle=s.c;
  }
  // head
  g.beginPath();g.arc(dir*2,-28,13,0,7);g.fill();g.stroke();
  // stripes for brown/orange
  if(k==='brown'||k==='orange'){g.strokeStyle=s.d;g.lineWidth=2;for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(dir*2+i*5,-41);g.lineTo(dir*2+i*5,-36);g.stroke()}}
  // eyes
  g.fillStyle=s.e;
  for(const sx of[-1,1]){g.beginPath();g.ellipse(dir*3+sx*5+dir*2,-29,2.4,3.2,0,0,7);g.fill()}
  if(k==='black'){g.fillStyle='#000';for(const sx of[-1,1]){g.beginPath();g.ellipse(dir*3+sx*5+dir*2,-29,.9,2.6,0,0,7);g.fill()}}
  // nose + whiskers
  g.fillStyle='#f06a8a';g.beginPath();g.arc(dir*5,-24,1.6,0,7);g.fill();
  g.strokeStyle=k==='black'?'#cfd3e0':'rgba(0,0,0,.5)';g.lineWidth=1;
  for(const sx of[-1,1])for(const dy of[-1,2]){g.beginPath();g.moveTo(dir*5+sx*5,-23+dy);g.lineTo(dir*5+sx*15,-24+dy*2);g.stroke()}
  g.restore();
}

// build picker
const picker=document.getElementById('picker');
Object.keys(CATS).forEach(k=>{
  const b=document.createElement('button');b.className='cat';b.type='button';b.setAttribute('aria-pressed',k===cat);
  const cc=document.createElement('canvas');cc.width=64;cc.height=64;
  drawCat(cc.getContext('2d'),32,58,k,1,0,0);
  const sp=document.createElement('div');sp.textContent=CATS[k].n;
  b.append(cc,sp);
  b.onclick=()=>{cat=k;[...picker.children].forEach(x=>x.setAttribute('aria-pressed',x===b))};
  picker.append(b);
});

function reset(){
  plats=[{x:0,y:0,w:W,i:0}];
  let px=W/2;
  for(let i=1;i<=GOAL;i++){
    const goal=i===GOAL;
    const w=goal?200:(i%10===0?190:Math.max(68,135-i*1.3+Math.random()*30));
    let x=px+(Math.random()*2-1)*150-w/2;
    if(goal)x=W/2-w/2;
    x=Math.max(14,Math.min(W-14-w,x));
    plats.push({x,y:-i*GAP,w,i});
    px=x+w/2;
  }
  P={x:W/2,y:0,vx:0,vy:0,dir:1,g:true,sq:0};
  cam=-(H-80);floorR=0;
}
const flakes=Array.from({length:50},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.8+.6,v:Math.random()*.4+.2}));

function show(id){['menu','over','win'].forEach(k=>document.getElementById(k).classList.toggle('on',k===id));
  document.getElementById('pads').classList.toggle('on',id===null&&matchMedia('(pointer:coarse)').matches)}
function start(){reset();state='play';show(null)}
function die(){
  state='over';
  if(floorR>best){best=floorR;try{localStorage.setItem('cattower-best',best)}catch(e){}}
  document.getElementById('overTxt').textContent='You fell from floor '+floorR+'. Best: floor '+best+'.';
  show('over');
}
function win(){
  state='win';best=GOAL;try{localStorage.setItem('cattower-best',best)}catch(e){}
  show('win');
}

function update(s){
  if(keys.l)P.vx-=.9*s;
  if(keys.r)P.vx+=.9*s;
  P.vx*=Math.pow(.88,s);
  if(Math.abs(P.vx)>.3)P.dir=P.vx>0?1:-1;
  if(keys.j&&P.g){P.vy=-13.5-Math.abs(P.vx)*.85;P.g=false;P.sq=-1}
  const prev=P.y;
  P.vy+=G*s;P.y+=P.vy*s;P.x+=P.vx*s;
  if(P.x<16){P.x=16;P.vx=Math.abs(P.vx)*.6}
  if(P.x>W-16){P.x=W-16;P.vx=-Math.abs(P.vx)*.6}
  P.g=false;
  if(P.vy>=0)for(const p of plats){
    if(prev<=p.y+.5&&P.y>=p.y&&P.x>p.x-8&&P.x<p.x+p.w+8){
      P.y=p.y;P.vy=0;P.g=true;P.sq=1;
      if(p.i>floorR)floorR=p.i;
      break;
    }
  }
  P.sq*=Math.pow(.85,s);
  const auto=floorR>=2?Math.min(.35+floorR*.03,1.6):0;
  cam-=auto*s;
  cam=Math.min(cam,P.y-H*.45);
  const g=plats[GOAL],tx=g.x+g.w/2;
  if(Math.abs(P.x-tx)<28&&P.y>g.y-50&&P.y<=g.y+4)return win();
  if(P.y>cam+H+30)die();
}

function render(){
  const bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,T.bg0);bg.addColorStop(1,T.bg1);
  c.fillStyle=bg;c.fillRect(0,0,W,H);
  c.fillStyle='rgba(255,255,255,.75)';
  c.fillStyle=T.snow;for(const f of flakes){f.y+=f.v;if(f.y>H)f.y=-4;c.beginPath();c.arc(f.x,(f.y+(-cam*.2))%H,f.r,0,7);c.fill()}
  // ice walls
  for(let i=0;i<4;i++){const bx=((t*.03*(1+i*.3)+i*140)%(W+60))-30,by=80+i*130+Math.sin(t*.003+i)*20;bat(bx,by,t*.02+i)}
  c.fillStyle=T.wall;c.fillRect(0,0,14,H);c.fillRect(W-14,0,14,H);
  c.fillStyle=T.wallHi;c.fillRect(12,0,3,H);c.fillRect(W-15,0,3,H);
  const LC=['#ff4d4d','#3ddc84','#ffb02e','#a66bff'];
  for(let k=Math.floor(cam/28);k<=Math.floor((cam+H)/28);k++){const sy=k*28-cam;c.globalAlpha=.65+.35*Math.sin(t*.004+k);c.fillStyle=LC[((k%4)+4)%4];for(const bx of[7,W-7]){c.beginPath();c.arc(bx,sy,3.6,0,7);c.fill()}}c.globalAlpha=1;
  for(const p of plats){
    const y=p.y-cam;
    if(y<-30||y>H+30)continue;
    const goal=p.i===GOAL;
    c.fillStyle=goal?'#ffcf4a':(p.i===0?T.ground:T.wood);
    c.beginPath();c.roundRect(p.x,y,p.w,14,5);c.fill();
    c.fillStyle=T.foam;c.fillRect(p.x+4,y+1,p.w-8,3);
    c.fillStyle=goal?'#d99a10':T.drip;
    for(let x=p.x+8;x<p.x+p.w-8;x+=16){c.beginPath();c.moveTo(x,y+14);c.lineTo(x+4,y+14);c.lineTo(x+2,y+20+((x*7)%5));c.fill()}
    if(p.i&&p.i%5===0&&!goal){c.fillStyle=T.label;c.font='bold 11px system-ui';c.textAlign='center';c.fillText(p.i,p.x+p.w/2,y+11)}
    if(!goal&&p.i)decor(p,y);
  }
  // treasure
  const g=plats[GOAL],gx=g.x+g.w/2,gy=g.y-cam;
  if(gy>-80&&gy<H+60){
    const rg=c.createRadialGradient(gx,gy-14,2,gx,gy-14,46);rg.addColorStop(0,'rgba(255,220,100,.7)');rg.addColorStop(1,'rgba(255,220,100,0)');
    c.fillStyle=rg;c.fillRect(gx-50,gy-64,100,100);
    c.fillStyle='#8a4f1d';c.beginPath();c.roundRect(gx-20,gy-26,40,26,4);c.fill();
    c.fillStyle='#a8661f';c.beginPath();c.roundRect(gx-20,gy-34,40,12,[8,8,2,2]);c.fill();
    c.fillStyle='#ffcf4a';c.fillRect(gx-3,gy-34,6,34);c.fillRect(gx-20,gy-24,40,3);
    c.fillStyle='#fff';c.beginPath();c.arc(gx,gy-22,3,0,7);c.fill();
  }
  if(P)drawCat(c,P.x,P.y-cam,cat,P.dir,P.sq,P.g&&Math.abs(P.vx)>1);
  // HUD
  c.textAlign='left';c.fillStyle=T.ink;c.font='bold 18px ui-rounded,system-ui,sans-serif';
  c.fillText('Floor '+(floorR||0)+' / '+GOAL,20,30);
  c.fillStyle=T.bar;c.fillRect(W-22,50,8,H-110);
  c.fillStyle=T.acc;const h=(H-110)*Math.min(1,floorR/GOAL);c.fillRect(W-22,50+(H-110)-h,8,h);
}

function bat(x,y,f){
  c.fillStyle=T.bat;c.beginPath();c.ellipse(x,y,4,3,0,0,7);c.fill();
  const w=Math.sin(f)*5;
  for(const s of[-1,1]){c.beginPath();c.moveTo(x+s*3,y);c.quadraticCurveTo(x+s*12,y-8-w,x+s*17,y-2+w);c.quadraticCurveTo(x+s*10,y,x+s*3,y+2);c.fill()}
}
function decor(p,y){
  const k=p.i%3,x=p.x+p.w*(.2+((p.i*37)%50)/100);
  if(k===1){ // pumpkin
    c.fillStyle='#f28c1e';c.beginPath();c.ellipse(x,y-8,10,8,0,0,7);c.fill();
    c.fillStyle='#d9700e';c.beginPath();c.ellipse(x-5,y-8,4,8,0,0,7);c.fill();c.beginPath();c.ellipse(x+5,y-8,4,8,0,0,7);c.fill();
    c.fillStyle='#3b7a2a';c.fillRect(x-1.5,y-19,3,5);
    c.fillStyle='#2a1500';c.beginPath();c.moveTo(x-6,y-9);c.lineTo(x-2,y-9);c.lineTo(x-4,y-13);c.fill();c.beginPath();c.moveTo(x+2,y-9);c.lineTo(x+6,y-9);c.lineTo(x+4,y-13);c.fill();
    c.fillRect(x-5,y-5,10,2);
  }else if(k===2){ // christmas tree
    c.fillStyle='#5a3418';c.fillRect(x-2,y-4,4,4);
    c.fillStyle='#1f8a4c';c.beginPath();c.moveTo(x,y-26);c.lineTo(x+10,y-12);c.lineTo(x-10,y-12);c.fill();
    c.beginPath();c.moveTo(x,y-18);c.lineTo(x+13,y-3);c.lineTo(x-13,y-3);c.fill();
    c.fillStyle='#ffd23f';c.beginPath();c.arc(x,y-27,3,0,7);c.fill();
    c.fillStyle='#ff4d4d';c.beginPath();c.arc(x-5,y-8,1.8,0,7);c.fill();
    c.fillStyle='#ffd23f';c.beginPath();c.arc(x+5,y-12,1.8,0,7);c.fill();
  }else{ // coffee cup
    c.fillStyle='#fff6e8';c.beginPath();c.roundRect(x-8,y-14,16,14,[2,2,6,6]);c.fill();
    c.strokeStyle='#fff6e8';c.lineWidth=2;c.beginPath();c.arc(x+9,y-8,4,-1.5,1.5);c.stroke();
    c.fillStyle='#6b3e20';c.fillRect(x-7,y-14,14,3);
    c.strokeStyle=T.snow;c.lineWidth=1.4;
    for(const o of[-3,3]){c.beginPath();c.moveTo(x+o,y-16);c.quadraticCurveTo(x+o+3*Math.sin(t*.004+o),y-21,x+o,y-26);c.stroke()}
  }
}
function loop(ts){
  const dt=Math.min(40,ts-last||16.7);last=ts;t=ts;
  if(state==='play')update(dt/16.67);
  render();
  requestAnimationFrame(loop);
}

// input
const K={ArrowLeft:'l',a:'l',A:'l',ArrowRight:'r',d:'r',D:'r',ArrowUp:'j',w:'j',W:'j',' ':'j'};
addEventListener('keydown',e=>{const k=K[e.key];if(k){keys[k]=1;if(state==='play')e.preventDefault()}});
addEventListener('keyup',e=>{const k=K[e.key];if(k)keys[k]=0});
addEventListener('blur',()=>{keys.l=keys.r=keys.j=0});
for(const [id,k] of [['bl','l'],['br','r'],['bj','j']]){
  const b=document.getElementById(id);
  b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=1});
  for(const ev of['pointerup','pointerleave','pointercancel'])b.addEventListener(ev,()=>{keys[k]=0});
}
const go=()=>start(),menu=()=>{state='menu';show('menu')};
document.getElementById('play').onclick=go;
document.getElementById('again').onclick=go;
document.getElementById('again2').onclick=go;
document.getElementById('swap').onclick=menu;
document.getElementById('swap2').onclick=menu;

let saved=null;try{saved=localStorage.getItem('cattower-mode')}catch(e){}
setMode(saved||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
document.getElementById('mode').onclick=()=>setMode(mode==='dark'?'light':'dark',1);
reset();requestAnimationFrame(loop);
})();
