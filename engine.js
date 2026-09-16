(function(root){
 'use strict';
 const defaults={mode:'machine',speed:'normal',sound:true,speech:false,letters:true};
 function cleanHistory(value){const seen=new Set();return Array.isArray(value)?value.filter(n=>Number.isInteger(n)&&n>=1&&n<=75&&!seen.has(n)&&seen.add(n)):[];}
 function normalize(raw){const history=cleanHistory(raw?.history);const backup=cleanHistory(raw?.previousGame);const s=raw?.settings||{};return {history,previousGame:backup.length?backup:null,settings:{mode:['machine','treasure','rocket','monster','simple','random'].includes(s.mode)?s.mode:defaults.mode,speed:s.speed==='fast'?'fast':'normal',sound:typeof s.sound==='boolean'?s.sound:true,speech:typeof s.speech==='boolean'?s.speech:false,letters:typeof s.letters==='boolean'?s.letters:true}};}
 function letter(n){return 'BINGO'[Math.floor((n-1)/15)]||'';}
 function draw(history,rng=Math.random){const used=new Set(history);const remaining=Array.from({length:75},(_,i)=>i+1).filter(n=>!used.has(n));if(!remaining.length)return null;return remaining[Math.min(remaining.length-1,Math.floor(rng()*remaining.length))];}
 const api={defaults,normalize,letter,draw};root.BingoEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
