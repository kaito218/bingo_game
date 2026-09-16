(()=>{'use strict';
const $=id=>document.getElementById(id), E=BingoEngine, KEY='wakuwaku-bingo-v1';let state=E.normalize(null),busy=false,epoch=0,audio,noticeTimer,activeMode='machine',animStart=0,animDuration=2200,raf=0;
try{state=E.normalize(JSON.parse(localStorage.getItem(KEY)));}catch{}
function notice(text){$('notice').textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').textContent='',6000);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{notice('保存できませんでした。この画面を閉じずに遊んでください。');}}
const colors=['#dc697e','#d99327','#4b9d8c','#618bc6','#9470bf'],tints=['#fce7ed','#fff0cc','#def3ed','#e3edff','#f0e6fa'];
for(let c=0;c<5;c++){let el=document.createElement('div');el.className='column-label';el.textContent='BINGO'[c];el.style.setProperty('--column',colors[c]);$('board').append(el);}
for(let row=1;row<=15;row++)for(let col=0;col<5;col++){const n=col*15+row,el=document.createElement('div');el.className='tile';el.id='tile-'+n;el.textContent=n;el.style.setProperty('--column',colors[col]);el.style.setProperty('--tint',tints[col]);$('board').append(el);}
function label(n){return n?(state.settings.letters?E.letter(n)+' ':'')+n:'—';}
// 抽選結果は保存しておき、演出が終わるまで画面には公開しない。
function visibleHistory(){return busy?state.history.slice(0,-1):state.history;}
function renderHistory(h){
 const list=$('history-list');list.replaceChildren();
 h.forEach(n=>{const li=document.createElement('li');li.textContent=label(n);list.append(li);});
 if(!h.length){const p=document.createElement('p');p.textContent='まだ数字は出ていません。';list.append(p);}
}
function renderOrder(h){
 const list=$('order-list');list.replaceChildren();$('order-empty').hidden=h.length>0;
 h.forEach((n,index)=>{
  const item=document.createElement('li');item.className='order-tile'+(index===h.length-1?' latest':'');
  item.setAttribute('aria-label',(index+1)+'回目、'+label(n)+(index===h.length-1?'、いまの数字':''));
  const rank=document.createElement('span');rank.className='order-rank';rank.textContent=index+1;
  const value=document.createElement('strong');value.textContent=n;item.append(rank,value);list.append(item);
 });
}
function selectTab(id){
 for(const tabId of ['numbers-tab','order-tab']){const tab=$(tabId),selected=tabId===id;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;$(tab.getAttribute('aria-controls')).hidden=!selected;}
}
for(const id of ['numbers-tab','order-tab']){
 $(id).onclick=()=>selectTab(id);
 $(id).onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const target=event.key==='Home'?'numbers-tab':event.key==='End'?'order-tab':id==='numbers-tab'?'order-tab':'numbers-tab';selectTab(target);$(target).focus();};
}
function sync(){const h=visibleHistory(),n=h.at(-1);$('restore').disabled=!state.previousGame?.length;renderOrder(h);if($('history-dialog').open)renderHistory(h);$('remaining').textContent=75-h.length;$('previous').textContent=label(h.at(-2));$('draw-count').textContent=h.length+' / 75 回';$('board-summary').textContent=h.length?h.length+'個の数字が出ました':'まだ数字は出ていません';$('number').textContent=n||'';$('letter').textContent=state.settings.letters?E.letter(n):'';$('letter').hidden=!state.settings.letters;$('result').hidden=!n||busy;$('animation').hidden=!!n&&!busy;$('draw').disabled=busy||h.length===75;$('mode').disabled=busy;$('draw').innerHTML=busy?'わくわく…':h.length===75?'すべて抽選しました':'<span>✦</span> 抽選する <span>✦</span>';$('message').textContent=busy?'次は、何番かな？':h.length===75?'すべての数字が出ました！':n?'出たのは、'+n+'番！':'次は、何番かな？';$('hint').textContent=busy?'もうすぐ数字が出るよ！':h.length===75?'最後まで遊んでくれて、ありがとう！':n?'カードに同じ数字はあるかな？':'ボタンを押して、ビンゴをはじめよう！';for(let i=1;i<=75;i++){const el=$('tile-'+i);el.className='tile'+(h.includes(i)?' drawn':'')+(n===i?' latest':'');el.setAttribute('aria-label',i+'番 '+(n===i?'いまの数字':h.includes(i)?'抽選済み':'未抽選'));}$('sound').innerHTML='♪ <span>音 '+(state.settings.sound?'ON':'OFF')+'</span>';$('sound').setAttribute('aria-pressed',String(state.settings.sound));$('mode').value=state.settings.mode;for(const k of ['letters','sound','speech'])$(k+'-setting').checked=state.settings[k];$('speed-setting').value=state.settings.speed;}
function initAudio(){if(!state.settings.sound)return;try{audio ||=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
function chime(mode){if(!state.settings.sound||!audio)return;const notes=mode==='treasure'?[660,880,1320]:mode==='rocket'?[330,660,990]:mode==='monster'?[440,554,880]:[660,990];notes.forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.085;o.type=mode==='monster'?'triangle':'sine';o.frequency.setValueAtTime(hz,t);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.15,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.32);});}
function speak(n){if(!state.settings.speech||!('speechSynthesis'in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(n+'番！');u.lang='ja-JP';u.rate=.9;speechSynthesis.speak(u);}catch{}}
function celebrate(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;$('confetti').replaceChildren();for(let i=0;i<35;i++){const p=document.createElement('i');p.style.left=Math.random()*100+'%';p.style.background=colors[i%5];p.style.animationDelay=Math.random()*.6+'s';$('confetti').append(p);}setTimeout(()=>$('confetti').replaceChildren(),3000);}
async function draw(){if(busy||state.history.length>=75)return;busy=true;const token=++epoch;initAudio();const n=E.draw(state.history);state.history.push(n);save();activeMode=state.settings.mode==='random'?['machine','treasure','rocket','monster'][Math.floor(Math.random()*4)]:state.settings.mode;const instant=activeMode==='simple'||matchMedia('(prefers-reduced-motion: reduce)').matches;animDuration=state.settings.speed==='fast'?1000:activeMode==='rocket'?2700:2200;animStart=performance.now();$('stage').classList.toggle('simple',instant);$('stage').classList.add('busy');sync();if(!instant){animate();await new Promise(r=>setTimeout(r,animDuration));}if(token!==epoch)return;busy=false;cancelAnimationFrame(raf);$('stage').classList.remove('busy');$('countdown').textContent='';sync();$('result').classList.remove('pop');void $('result').offsetWidth;$('result').classList.add('pop');chime(activeMode);speak(n);if(state.history.length%10===0||state.history.length===75)celebrate();if(state.history.length===75){$('message').textContent='最後の数字！';setTimeout(()=>{if(token===epoch)$('message').textContent='すべての数字が出ました！';},1300);}}
// 演出なしはクリックごとに即時抽選。演出中の重複操作はbusyで防ぐ。
$('draw').addEventListener('click',draw);$('mode').addEventListener('change',()=>{state.settings.mode=$('mode').value;save();if(!state.history.length){activeMode=state.settings.mode==='random'?'machine':state.settings.mode;paint(0);}});
$('sound').onclick=()=>{state.settings.sound=!state.settings.sound;initAudio();save();sync();};
$('settings').onclick=()=>{$('settings-dialog').showModal();};for(const k of ['letters','sound','speech'])$(k+'-setting').onchange=()=>{state.settings[k]=$(k+'-setting').checked;if(k==='sound')initAudio();if(k==='speech'){if(!('speechSynthesis'in window)&&state.settings.speech){state.settings.speech=false;notice('このブラウザは読み上げに対応していません。');}else if(!state.settings.speech&&'speechSynthesis'in window)speechSynthesis.cancel();}save();sync();};$('speed-setting').onchange=()=>{state.settings.speed=$('speed-setting').value;save();};
$('history').onclick=()=>{renderHistory(visibleHistory());$('history-dialog').showModal();};$('history-dialog').querySelector('.close').onclick=()=>$('history-dialog').close();
function stopDraw(){
 epoch++;busy=false;cancelAnimationFrame(raf);
 if('speechSynthesis'in window)speechSynthesis.cancel();
 $('countdown').textContent='';$('confetti').replaceChildren();$('stage').classList.remove('busy');
}
function refreshGame(){save();sync();activeMode=state.settings.mode==='random'?'machine':state.settings.mode;paint(0);}
$('reset').onclick=()=>{$('reset-dialog').returnValue='cancel';$('reset-dialog').showModal();};
$('reset-dialog').addEventListener('close',()=>{
 if($('reset-dialog').returnValue!=='reset')return;
 const previous=visibleHistory();
 // 空のゲームを再度リセットしても、戻せるゲームを上書きしない。
 if(previous.length)state.previousGame=[...previous];
 stopDraw();state.history=[];refreshGame();
});
$('restore').onclick=()=>{
 if(!state.previousGame?.length)return;
 $('restore-summary').textContent=state.previousGame.length+'個目まで抽選済み（最後の数字：'+label(state.previousGame.at(-1))+'）のゲームに戻ります。';
 $('restore-dialog').returnValue='cancel';$('restore-dialog').showModal();
};
$('restore-dialog').addEventListener('close',()=>{
 if($('restore-dialog').returnValue!=='restore'||!state.previousGame?.length)return;
 stopDraw();state.history=[...state.previousGame];refreshGame();notice('リセット前のゲームに戻しました。');
});
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else notice('Safariの共有メニューから「ホーム画面に追加」すると、アプリのように大きく表示できます。');}catch{notice('この端末では全画面表示を利用できません。Safariの「ホーム画面に追加」をお試しください。');}};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target===document.body&&!document.querySelector('dialog[open]')){e.preventDefault();draw();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&audio?.state==='running')audio.suspend().catch(()=>{});});
// 演出は確定済みの抽選結果と独立して描画する。
const ctx=$('scene').getContext('2d');
function circle(x,y,r,fill,stroke,width=4){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function rect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=5;ctx.stroke();}}
function paint(p){ctx.clearRect(0,0,640,480);ctx.save();const shake=busy?Math.sin(p*65)*(p<.65?5:1):0;ctx.translate(shake,0);if(activeMode==='machine'||activeMode==='random'){
 ctx.fillStyle='#d9cff2';ctx.beginPath();ctx.ellipse(320,429,130,15,0,0,7);ctx.fill();rect(228,309,184,113,27,'#7660d7','#4e39a1');rect(254,344,132,49,18,'#4b348f');circle(320,364,18,'#372672');circle(320,196,139,'#ffffffa8','#8b7bd1',9);circle(320,196,125,'#f9f7ff88','#ddd6f4',3);
 for(let i=0;i<16;i++){const a=i*2.4+(busy?p*24:0),r=45+(i%4)*19;const x=320+Math.cos(a)*r,y=205+Math.sin(a)*r;circle(x,y,25,colors[i%5],'#ffffff',3);circle(x-7,y-8,6,'#ffffff66');}
 ctx.beginPath();ctx.arc(320,196,116,3.8,5.1);ctx.strokeStyle='#ffffffc9';ctx.lineWidth=11;ctx.lineCap='round';ctx.stroke();rect(187,180,23,62,10,'#b1a3df');rect(430,180,23,62,10,'#b1a3df');if(p>.7){circle(320,360+(p-.7)*80,28,'#f9c96a','#fff',5);}else circle(320,361,14,'#e8ddff');
 }else if(activeMode==='treasure'){
 const open=p>.6?Math.min(1,(p-.6)/.2):0;ctx.save();ctx.globalAlpha=open;for(let i=0;i<12;i++){ctx.save();ctx.translate(320,270);ctx.rotate(i*Math.PI/6);ctx.fillStyle='#ffd66988';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-12,-200);ctx.lineTo(12,-200);ctx.fill();ctx.restore();}ctx.restore();rect(185,245,270,142,20,'#b96339','#7e3c29');rect(211,245,27,140,5,'#ffd66d');rect(402,245,27,140,5,'#ffd66d');ctx.save();ctx.translate(185,246);ctx.rotate(-open*.6);rect(0,-99,270,108,22,'#df9151','#7e3c29');rect(0,-13,270,22,3,'#ffda72');ctx.restore();rect(296,248,48,55,9,'#ffe080','#bc862b');circle(320,274,7,'#855126');
 }else if(activeMode==='rocket'){
 const rise=p>.66?(p-.66)*1300:0;ctx.translate(0,-rise);if(busy){ctx.fillStyle='#ffc750';ctx.beginPath();ctx.moveTo(285,327);ctx.lineTo(320,410+Math.sin(p*70)*25);ctx.lineTo(355,327);ctx.fill();}ctx.fillStyle='#9a86e6';ctx.beginPath();ctx.moveTo(282,250);ctx.lineTo(235,355);ctx.lineTo(299,330);ctx.lineTo(350,330);ctx.lineTo(405,355);ctx.lineTo(358,250);ctx.fill();ctx.fillStyle='#fffdf8';ctx.beginPath();ctx.moveTo(320,92);ctx.bezierCurveTo(240,165,260,286,285,331);ctx.lineTo(355,331);ctx.bezierCurveTo(380,286,400,165,320,92);ctx.fill();ctx.fillStyle='#ee8795';ctx.beginPath();ctx.moveTo(320,92);ctx.quadraticCurveTo(285,127,277,171);ctx.lineTo(365,171);ctx.quadraticCurveTo(354,122,320,92);ctx.fill();circle(321,230,37,'#99d9eb','#b5a3e6',9);circle(311,217,10,'#e6faff');
 }else if(activeMode==='monster'){
 const opening=p>.62?(p-.62)*190:0;ctx.save();ctx.translate(0,-opening);ctx.fillStyle='#8dcfbb';ctx.beginPath();ctx.arc(320,246,118,Math.PI,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(237,175);ctx.lineTo(245,111);ctx.lineTo(282,139);ctx.fill();ctx.beginPath();ctx.moveTo(358,139);ctx.lineTo(395,111);ctx.lineTo(403,176);ctx.fill();circle(283,200,21,'white');circle(358,200,21,'white');circle(286,203,9,'#39324d');circle(355,203,9,'#39324d');ctx.restore();ctx.fillStyle='#fffdf8';ctx.beginPath();ctx.arc(320,249+opening*.3,118,0,Math.PI);ctx.fill();rect(202,237+opening*.3,236,22,9,'#6b59b8');circle(320,248+opening*.3,26,'#ffd574','#fff',7);
 }else{circle(320,240,126,'#fff','#ddd4f7',12);ctx.font='bold 100px Arial';ctx.fillStyle='#6550d8';ctx.textAlign='center';ctx.fillText('?',320,275);}
ctx.restore();}
function animate(){const p=Math.min(1,(performance.now()-animStart)/animDuration);paint(p);$('countdown').textContent=activeMode==='rocket'&&p<.66?Math.max(1,3-Math.floor(p/.22)):'';if(p<1&&busy)raf=requestAnimationFrame(animate);}
activeMode=state.settings.mode==='random'?'machine':state.settings.mode;sync();paint(0);
if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();

