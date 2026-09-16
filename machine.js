// Fixed-step ball simulation; the drawn number is decided separately by engine.js.
class BingoMachine {
 constructor(){this.palette=['#ed7790','#efba4a','#55bca8','#61a6e6','#a58ada'];this.reset();}
 reset(){
  this.balls=[];this.angle=0;this.time=0;this.accumulator=0;this.lastProgress=0;this.selected=null;this.impact=0;
  for(let row=0;row<4;row++)for(let col=0;col<6;col++){
   const x=(col-2.5)*34+(row%2)*8,y=(row-1.5)*34;
   this.balls.push({x,y,vx:0,vy:0,r:16,spin:Math.random()*6.28,color:this.palette[(row*6+col)%5]});
  }
  for(let i=0;i<240;i++)this.step(1/120,0);
  this.impact=0;
 }
 step(dt,power){
  const omega=power*5.2;this.angle+=omega*dt;
  for(const b of this.balls){
   b.vy+=720*dt;b.vx*=.998;b.vy*=.999;b.x+=b.vx*dt;b.y+=b.vy*dt;b.spin+=b.vx*dt*.035;
   // Three rotating paddles catch balls, lift them, and release them under gravity.
   if(power>0)for(let k=0;k<3;k++){
    const a=this.angle+k*Math.PI*2/3,ux=Math.cos(a),uy=Math.sin(a);
    const along=Math.max(42,Math.min(119,b.x*ux+b.y*uy));
    const px=along*ux,py=along*uy,dx=b.x-px,dy=b.y-py,d=Math.hypot(dx,dy),limit=b.r+5;
    if(d<limit&&d>.01){const nx=dx/d,ny=dy/d;b.x+=nx*(limit-d);b.y+=ny*(limit-d);
     const relative=(b.vx+omega*py)*nx+(b.vy-omega*px)*ny;
     if(relative<0){b.vx-=nx*relative*1.35;b.vy-=ny*relative*1.35;this.impact=Math.max(this.impact,-relative);}
    }
   }
  }
  // Multiple contact passes keep piled balls from visibly intersecting.
  for(let pass=0;pass<3;pass++){
   for(let i=0;i<this.balls.length;i++)for(let j=i+1;j<this.balls.length;j++){
    const a=this.balls[i],b=this.balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),limit=a.r+b.r;
    if(d<limit&&d>.001){const nx=dx/d,ny=dy/d,overlap=(limit-d)*.5;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;
     const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
     if(relative<0){const impulse=-relative*.79;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;this.impact=Math.max(this.impact,-relative);}
    }
   }
   for(const b of this.balls){const d=Math.hypot(b.x,b.y),limit=132-b.r;if(d>limit){const nx=b.x/d,ny=b.y/d;b.x=nx*limit;b.y=ny*limit;const speed=b.vx*nx+b.vy*ny;if(speed>0){b.vx-=1.65*speed*nx;b.vy-=1.65*speed*ny;this.impact=Math.max(this.impact,speed);}}}
  }
 }
 advance(progress,duration){
  const target=progress*duration/1000,elapsed=Math.min(.08,Math.max(0,target-this.time));this.time=target;this.accumulator+=elapsed;this.impact=0;
  const power=progress<.65?Math.min(1,progress/.13):Math.max(0,1-(progress-.65)/.14);
  while(this.accumulator>=1/120){this.step(1/120,power);this.accumulator-=1/120;}
  if(progress>=.74&&!this.selected){
   // Pick one of the visible balls closest to the bottom gate; keep its colour and path.
   const ball=this.balls.reduce((best,b)=>Math.hypot(b.x,b.y-130)<Math.hypot(best.x,best.y-130)?b:best);
   this.selected={...ball};this.balls.splice(this.balls.indexOf(ball),1);
  }
  this.lastProgress=progress;
 }
 ball(ctx,x,y,r,color,spin=0){
  ctx.save();ctx.translate(x,y);ctx.shadowColor='#30254645';ctx.shadowBlur=5;ctx.shadowOffsetY=3;
  let g=ctx.createRadialGradient(-r*.35,-r*.42,r*.08,r*.1,r*.3,r*1.2);g.addColorStop(0,'#ffffff');g.addColorStop(.22,color);g.addColorStop(.7,color);g.addColorStop(1,'#423551');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.shadowColor='transparent';
  ctx.rotate(spin);ctx.fillStyle='#ffffffcf';ctx.beginPath();ctx.ellipse(0,0,r*.42,r*.48,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ffffff70';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r-.8,3.5,5.3);ctx.stroke();ctx.restore();
 }
 draw(ctx,p){
  const circle=(x,y,r,fill,stroke,width=2)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}};
  const box=(x,y,w,h,r,fill)=>{ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);ctx.fillStyle=fill;ctx.fill();};
  ctx.save();
  const shadow=ctx.createRadialGradient(322,438,10,322,438,158);shadow.addColorStop(0,'#50417735');shadow.addColorStop(1,'#50417700');ctx.fillStyle=shadow;ctx.save();ctx.translate(0,332);ctx.scale(1,.24);ctx.beginPath();ctx.arc(322,438,158,0,7);ctx.fill();ctx.restore();
  // Solid enamel base and metal supports, drawn behind the transparent drum.
  const base=ctx.createLinearGradient(0,326,0,427);base.addColorStop(0,'#a190e1');base.addColorStop(.2,'#7965bf');base.addColorStop(1,'#4d3a8c');
  box(217,321,206,101,23,base);box(239,417,38,10,5,'#493b67');box(365,417,38,10,5,'#493b67');
  ctx.strokeStyle='#8d81af';ctx.lineWidth=15;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(240,334);ctx.lineTo(169,226);ctx.lineTo(169,196);ctx.moveTo(400,334);ctx.lineTo(471,226);ctx.lineTo(471,196);ctx.stroke();
  ctx.strokeStyle='#e3dcf2';ctx.lineWidth=4;ctx.stroke();
  const glass=ctx.createRadialGradient(270,126,5,320,198,145);glass.addColorStop(0,'#ffffffdb');glass.addColorStop(.7,'#eef6ff8a');glass.addColorStop(1,'#a9bbd496');circle(320,198,139,glass,'#9286b2',7);
  ctx.save();ctx.beginPath();ctx.arc(320,198,132,0,7);ctx.clip();
  ctx.save();ctx.translate(320,198);ctx.rotate(this.angle);
  for(let k=0;k<3;k++){ctx.rotate(Math.PI*2/3);box(42,-5,77,10,5,'#9d91ba66');box(101,-6,18,12,4,'#dbd4ecbb');}
  circle(0,0,14,'#a69cc270','#f9f6ff88',2);ctx.restore();
  for(const b of [...this.balls].sort((a,b)=>a.y-b.y))this.ball(ctx,320+b.x,198+b.y,b.r,b.color,b.spin);
  if(this.selected&&p<.82){const q=Math.min(1,(p-.74)/.08);this.ball(ctx,320+this.selected.x*(1-q),198+this.selected.y+(130-this.selected.y)*q,16,this.selected.color,this.selected.spin+q*2);}
  // Glass reflections stay fixed while the paddles and balls rotate inside.
  ctx.strokeStyle='#ffffff9c';ctx.lineWidth=10;ctx.beginPath();ctx.arc(320,198,120,3.55,4.62);ctx.stroke();ctx.strokeStyle='#ffffff4d';ctx.lineWidth=4;ctx.beginPath();ctx.arc(320,198,124,.05,.9);ctx.stroke();ctx.restore();
  const rim=ctx.createLinearGradient(170,60,445,334);rim.addColorStop(0,'#f9f5ff');rim.addColorStop(.3,'#a297bc');rim.addColorStop(.55,'#e5deed');rim.addColorStop(1,'#72658b');circle(320,198,139,null,rim,8);circle(320,198,145,null,'#c4b9d8',2);
  circle(173,198,13,'#c4b9d8','#f5efff',3);circle(467,198,13,'#c4b9d8','#f5efff',3);
  // A crank on the right provides a readable mechanical connection to the drum.
  const crank=this.angle,handleY=198+Math.sin(crank)*33,handleX=493+Math.cos(crank)*9;
  ctx.strokeStyle='#82748f';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(468,198);ctx.lineTo(488,198);ctx.lineTo(handleX,handleY);ctx.lineTo(handleX+21,handleY);ctx.stroke();box(handleX+13,handleY-9,27,18,8,'#cfab68');
  // Dark outlet, transparent chute, and a shallow tray guide one ball toward the viewer.
  box(297,322,46,30,13,'#382c52');box(301,326,38,58,12,'#e5dff26b');
  ctx.strokeStyle='#ffffffa6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(301,330);ctx.lineTo(301,370);ctx.quadraticCurveTo(303,396,334,397);ctx.lineTo(381,397);ctx.stroke();
  box(268,394,131,16,8,'#b9acd4');box(275,393,116,7,4,'#51416c');
  if(this.selected&&p>=.82){const q=Math.min(1,(p-.82)/.18);let x,y,r=16;
   if(q<.45){const t=q/.45;x=320;y=333+48*t*t;}
   else{const t=(q-.45)/.55;x=320+40*t;y=381-Math.sin(t*Math.PI)*14;r=16+8*t;}
   this.ball(ctx,x,y,r,this.selected.color,this.selected.spin+q*5);
  }
  ctx.restore();
 }
}
if(typeof module!=='undefined')module.exports=BingoMachine;
