'use strict';

// Original pixel artwork. These painters use whole-pixel shapes only.
function pixelPainter(canvas){
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  function box(x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
  function polygon(points,color){
    const low=Math.floor(Math.min(...points.map(v=>v[1]))),high=Math.ceil(Math.max(...points.map(v=>v[1])));
    for(let y=low;y<high;y++){
      const hits=[];
      for(let i=0,j=points.length-1;i<points.length;j=i++){
        const a=points[j],b=points[i],scan=y+.5;
        if((a[1]<=scan&&b[1]>scan)||(b[1]<=scan&&a[1]>scan))hits.push(a[0]+(scan-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      }
      hits.sort((a,b)=>a-b);for(let i=0;i<hits.length;i+=2)box(Math.round(hits[i]),y,Math.round(hits[i+1])-Math.round(hits[i]),1,color);
    }
  }
  function oval(x,y,rx,ry,color){for(let row=-ry;row<=ry;row++){const dx=Math.sqrt(Math.max(0,1-row*row/(ry*ry)))*rx;box(Math.ceil(x-dx),Math.round(y+row),Math.floor(dx*2),1,color);}}
  function line(points,color,size=1){for(let i=1;i<points.length;i++){let [x,y]=points[i-1];const [ex,ey]=points[i],dx=Math.abs(ex-x),dy=-Math.abs(ey-y),sx=x<ex?1:-1,sy=y<ey?1:-1;let err=dx+dy;for(;;){box(x,y,size,size,color);if(x===ex&&y===ey)break;const twice=2*err;if(twice>=dy){err+=dy;x+=sx;}if(twice<=dx){err+=dx;y+=sy;}}}}
  function heart(x,y,color){['0110110','1111111','1111111','0111110','0011100','0001000'].forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')box(x+i,y+j,1,1,color);}));}
  function star(x,y,color){box(x,y-2,1,5,color);box(x-2,y,5,1,color);}
  return {c,box,polygon,oval,line,heart,star};
}
const lakeBackdrop=document.getElementById('landscape');
const background=pixelPainter(lakeBackdrop);
const motionSetting=window.matchMedia('(prefers-reduced-motion:reduce)');
const rand=n=>{const v=Math.sin(n*78.233+145.137)*43758.5453;return v-Math.floor(v);};
function paintBackground(time=0){
  const {c,box,polygon,oval,line}=background;const w=lakeBackdrop.width,h=lakeBackdrop.height;
  const horizon=Math.round(h*.68),t=motionSetting.matches?0:time*.001;
  const colors=['#213e3b','#244740','#2b4b42','#305449','#3d5d4e','#4c6b55'];
  colors.forEach((color,i)=>box(0,i*horizon/6,w,horizon/6+1,color));
  for(let i=0;i<54;i++){c.globalAlpha=.25+Math.sin(t*.5+i)*.16;box(rand(i+17)*w,rand(i+83)*horizon,1,1,'#e6d5a0');}c.globalAlpha=1;
  oval(w*.86,h*.18,7,7,'#cfc59a');oval(w*.86-3,h*.18-2,6,6,'#365547');
  polygon([[0,horizon],[0,horizon-5],[w*.08,horizon-17],[w*.16,horizon-10],[w*.23,horizon-29],[w*.35,horizon-16],[w*.5,horizon-24],[w*.68,horizon-12],[w*.82,horizon-28],[w,horizon-13],[w,horizon]],'#2d4d43');
  polygon([[0,horizon+3],[0,horizon-7],[w*.15,horizon-10],[w*.3,horizon-4],[w*.48,horizon-9],[w*.66,horizon-4],[w*.87,horizon-10],[w,horizon-4],[w,horizon+5]],'#29483f');
  for(let i=0;i<4;i++)box(0,horizon+i*(h-horizon)/4,w,(h-horizon)/4+1,['#3a6254','#315a50','#294f48','#24463f'][i]);
  for(let i=0;i<65;i++)box(rand(i+200)*w+Math.sin(t*.3+i),horizon+rand(i+100)*(h-horizon),3+rand(i+330)*10,1,i%3?'#91b18d12':'#c2c88b21');
  // Willow branches frame the lake and the book.
  polygon([[0,0],[18,0],[15,h*.12],[9,h*.26],[6,h*.55],[0,h*.58]],'#16382f');
  line([[6,31],[18,12],[41,2]],'#16382f',3);line([[9,57],[21,37],[37,24],[55,17]],'#193d32',2);
  for(let i=0;i<13;i++){
    const x=9+i*4,y=8+rand(i+300)*18;
    line([[x,y],[x-1,y+15],[x-4,y+25+Math.round(rand(i)*7)]],'#385e43');
    for(let j=0;j<5;j++)box(x-(j>2?3:0),y+j*5,3,3,i%2?'#527549':'#476d46');
  }
  for(let i=0;i<15;i++){
    const x=w-4-Math.round(rand(i+400)*14),y=h-10-Math.round(rand(i+450)*24);
    line([[x,h],[x-2,y],[x-6,y-7]],'#183c32');box(x-6,y-7,1,5,'#6f8960');
  }
  for(let i=0;i<12;i++){
    c.globalAlpha=.3+.25*Math.sin(t*.8+i);const x=rand(i+700)*w,y=h*.4+rand(i+800)*h*.5+Math.sin(t*.4+i)*2;
    box(x-1,y-1,3,3,'#d4cf8b13');box(x,y,1,1,'#d6d49a');
  }c.globalAlpha=1;
}
function resizeBackground(){lakeBackdrop.width=Math.ceil(innerWidth/4);lakeBackdrop.height=Math.ceil(innerHeight/4);paintBackground();}
resizeBackground();window.addEventListener('resize',resizeBackground);

const otterCanvas=document.getElementById('otters');
const otterPainter=pixelPainter(otterCanvas);
function drawOtters(time=0){
  const {box,polygon,oval,line,heart,star}=otterPainter;const t=motionSetting.matches?0:time*.001;
  const w=256,h=176;
  ['#20433f','#244d45','#2d594c','#365f4e'].forEach((col,i)=>box(0,i*13,w,14,col));
  for(let i=0;i<20;i++)box(rand(i+50)*250,rand(i+90)*40,1,1,i%3?'#b4b88a':'#d9cc98');
  star(44,18,'#bbc593');star(178,14,'#c9c697');
  oval(214,24,9,9,'#dfd3a2');oval(211,21,8,8,'#294e44');
  polygon([[0,52],[0,25],[10,30],[16,23],[23,33],[30,25],[40,44],[52,37],[64,48],[80,42],[98,51],[120,46],[142,51],[163,40],[184,45],[197,38],[214,44],[233,33],[246,34],[256,29],[256,57]],'#193d35');
  polygon([[0,55],[0,44],[18,45],[31,50],[44,48],[56,53],[80,50],[103,54],[126,52],[155,54],[179,50],[201,54],[224,48],[256,45],[256,58]],'#315446');
  ['#3d6b57','#3a6955','#356350','#2f5b4c','#2a5348','#254d42'].forEach((col,i)=>box(0,56+i*20,w,21,col));
  for(let i=0;i<80;i++){
    const x=rand(i+1000)*256+Math.sin(t*.4+i)*1.4,y=57+rand(i+1100)*119;
    box(x,y,2+rand(i+1200)*12,1,i%4?'#76a17c35':'#c4c68c35');
  }
  for(let i=0;i<10;i++)box(205-i*.6+Math.sin(i+t*.3)*3,58+i*4,8+rand(i+20)*14,1,'#c8c49138');
  // Reflection rings around our floating pair.
  line([[60,110],[65,103],[75,100]],'#7aa080');line([[61,119],[67,127],[82,134]],'#6b9775');
  line([[168,102],[178,105],[185,115],[183,124],[175,131]],'#739c78');
  line([[82,148],[101,152],[121,153],[144,151],[164,146]],'#80a781');
  function otter(x,y,lighter){
    const edge='#453a30',fur=lighter?'#a78356':'#8b6748',highlight=lighter?'#bd9b68':'#a68156',chest=lighter?'#ecdbaf':'#e1c99d',muzzle='#f1dfb6';
    // Curled tails, body, little feet, and soft chest fur.
    polygon([[x-6,y+40],[x+6,y+42],[x+11,y+52],[x+8,y+60],[x-2,y+65],[x-10,y+63],[x-12,y+59],[x-6,y+59],[x-2,y+54]],edge);
    polygon([[x-3,y+42],[x+4,y+44],[x+7,y+53],[x+5,y+58],[x-1,y+62],[x-8,y+61],[x-2,y+57],[x+1,y+50]],fur);
    oval(x,y+28,16,25,edge);oval(x,y+27,14,23,fur);
    oval(x-2,y+25,10,19,highlight);oval(x,y+25,9,18,chest);
    polygon([[x-6,y+13],[x-3,y+10],[x,y+12],[x+3,y+10],[x+6,y+14],[x+7,y+30],[x+4,y+40],[x-3,y+42],[x-7,y+31]],chest);
    box(x-2,y+22,1,2,'#c1aa82');box(x+3,y+31,1,1,'#bca37b');
    oval(x-9,y+46,5,5,edge);oval(x+9,y+46,5,5,edge);oval(x-9,y+45,3,4,highlight);oval(x+9,y+45,3,4,highlight);
    box(x-10,y+45,1,3,fur);box(x+8,y+45,1,3,fur);
    // Round ears and faces; every eyelid is closed.
    oval(x-11,y-7,5,5,edge);oval(x+11,y-7,5,5,edge);oval(x-11,y-7,3,3,highlight);oval(x+11,y-7,3,3,highlight);
    box(x-12,y-7,2,2,'#be9972');box(x+10,y-7,2,2,'#be9972');
    oval(x,y,15,13,edge);oval(x,y-1,13,11,fur);oval(x-2,y-3,10,8,highlight);
    oval(x-5,y+4,7,6,muzzle);oval(x+5,y+4,7,6,muzzle);
    line([[x-9,y-2],[x-7,y],[x-4,y-1]],'#453c32');line([[x+4,y-1],[x+7,y],[x+9,y-2]],'#453c32');
    box(x-2,y+3,5,2,'#493d32');box(x-1,y+5,3,1,'#493d32');line([[x,y+6],[x,y+8],[x+2,y+8]],'#6e5741');
    box(x-11,y+4,2,2,'#cc9877');box(x+10,y+4,2,2,'#cc9877');
    line([[x-10,y+6],[x-17,y+4]],'#d8c399');line([[x-10,y+8],[x-16,y+9]],'#d8c399');
    line([[x+10,y+6],[x+17,y+4]],'#d8c399');line([[x+10,y+8],[x+16,y+9]],'#d8c399');
  }
  const bob=Math.round(Math.sin(t*.75)*.7);
  otter(96,83+bob,false);otter(154,87+bob,true);
  // Outer paws resting on their tummies.
  line([[84,102+bob],[86,110+bob],[93,115+bob]],'#453a30',5);line([[85,103+bob],[87,110+bob],[94,114+bob]],'#a68156',3);
  line([[165,107+bob],[163,114+bob],[157,117+bob]],'#453a30',5);line([[165,108+bob],[163,114+bob],[157,116+bob]],'#bd9b68',3);
  // Their inner arms reach across the water and hold paws.
  line([[107,103+bob],[113,108+bob],[121,111+bob],[127,111+bob]],'#453a30',6);
  line([[108,104+bob],[114,109+bob],[122,112+bob],[127,112+bob]],'#a68156',3);
  line([[141,107+bob],[136,111+bob],[129,112+bob],[124,112+bob]],'#453a30',6);
  line([[141,108+bob],[136,112+bob],[130,113+bob],[125,113+bob]],'#bd9b68',3);
  box(124,111+bob,4,3,'#e5c799');box(128,112+bob,3,3,'#cfad7b');
  heart(123,64+bob,'#d4a38b');
  // Lily pads and two small lake flowers.
  oval(34,135,13,4,'#1c4739');polygon([[22,133],[35,130],[46,134],[35,136],[31,133]],'#698b54');
  box(33,127,3,4,'#e4cba9');box(31,128,7,2,'#e4cba9');box(33,128,3,2,'#c59b83');
  oval(215,130,12,4,'#1c4739');polygon([[204,128],[216,126],[226,129],[216,131],[214,128]],'#75965a');
  box(215,123,3,4,'#ead6ac');box(213,124,7,2,'#ead6ac');box(215,124,3,2,'#c5a479');
  line([[11,176],[14,159],[11,149]],'#1b4737',2);line([[16,176],[19,152],[23,146]],'#52794c');
  line([[240,176],[237,158],[240,148]],'#1b4737',2);line([[246,176],[247,153],[244,143]],'#729052');
  // A tiny, handwritten-in-pixels sleep symbol.
  const z=['111','001','010','100','111'];z.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')box(176+i,65+j,1,1,'#afc19b');}));
}
function drawPageDoodle(canvas){
  canvas.width=144;canvas.height=94;const {box,polygon,oval,line,heart}=pixelPainter(canvas);
  oval(76,40,29,29,'#e6dcb7');
  polygon([[34,82],[42,72],[65,67],[79,70],[101,69],[118,81]],'#b4ba87');
  box(65,31,22,44,'#adac7b');box(68,32,15,42,'#d9c99a');box(83,32,4,42,'#949a70');
  polygon([[60,32],[76,13],[92,32]],'#738b69');polygon([[63,31],[76,17],[83,31]],'#92a179');
  box(75,9,1,8,'#8f8e66');box(76,9,8,3,'#bd9d72');
  box(73,39,6,11,'#7f8e6d');box(74,40,4,9,'#f0d59f');box(73,58,7,16,'#7a8864');
  box(75,59,3,14,'#dec897');line([[84,71],[88,62],[85,52],[88,42]],'#839464');
  [[84,64],[87,55],[85,47],[87,41]].forEach(([x,y])=>box(x,y,4,2,'#8fa075'));
  line([[48,75],[47,66],[44,62]],'#8d9c71');line([[102,75],[105,67],[108,64]],'#8d9c71');
  heart(32,46,'#bf9d7b');box(103,34,1,5,'#b7a97b');box(101,36,5,1,'#b7a97b');
}

// Bitmap dedication: no external pixel-font dependency.
const lettering={
  y:['10001','10001','10001','01111','00001','00001','01110'],
  o:['00000','00000','01110','10001','10001','10001','01110'],
  u:['00000','00000','10001','10001','10001','10011','01101'],
  a:['00000','00000','01110','00001','01111','10001','01111'],
  n:['00000','00000','11110','10001','10001','10001','10001'],
  d:['00001','00001','01111','10001','10001','10001','01111'],
  s:['00000','00000','01111','10000','01110','00001','11110']
};
const words=document.getElementById('pixel-title'),letterPainter=pixelPainter(words);words.width=65;words.height=9;let cursor=0;
for(const char of 'you and us'){
  if(char===' '){cursor+=4;continue;}
  lettering[char].forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1')letterPainter.box(cursor+x,y+1,1,1,'#ead1a0');}));cursor+=6;
}
letterPainter.heart(cursor+2,2,'#cba899');
let previousPaint=0;
function animateScenery(time){
  if(time-previousPaint>120){paintBackground(time);if(!document.getElementById('otter-view').hidden)drawOtters(time);previousPaint=time;}
  requestAnimationFrame(animateScenery);
}
drawOtters();requestAnimationFrame(animateScenery);
