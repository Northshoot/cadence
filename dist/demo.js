import {validateScript} from './core.js';

// This original demo is a separate, immutable library item, never a saved user script.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const DEMO=freeze(validateScript({
 version:1,id:'tyw-pirate-demo-v1',title:'Fit for the high seas.',
 subtitle:'Try the demo · Press Begin reading and follow the golden word.',
 status:'DEMO · MAKE IT YOURS',
 notes:[
  'An original, playful demo from TrainYourWay AI. Stage directions are optional performance ideas, never spoken words.',
  'The golden word follows your selected WPM. Pauses use their explicit duration; the total reading time is an estimate.',
  'Edit this demo to save your own copy, or choose New script for a fresh page. Your saved scripts stay separate.'
 ],
 sections:[
  {id:'pirate-aboard',title:'All aboard',cues:[
   {id:'pirate-welcome',type:'speak',text:'Welcome aboard, crew. Today we’re lifting treasure and spirits.'},
   {id:'pirate-pause-one',type:'pause',duration:2,label:'Let that land'},
   {id:'pirate-salute',type:'stage',text:'Optional: salute with an imaginary dumbbell.',duration:2},
   {id:'pirate-sea-legs',type:'speak',text:'Stretch those sea legs. The plank is for core work now; the sharks have joined a book club.'}
  ]},
  {id:'pirate-recovery',title:'Rest is treasure',cues:[
   {id:'pirate-rest',type:'speak',text:'Our secret weapon? Rest and recovery. Even a legendary captain needs shore leave. Tomorrow’s treasure can wait until after a very respectable nap.'},
   {id:'pirate-pause-two',type:'pause',duration:3,label:'A little shore leave'},
   {id:'pirate-wink',type:'stage',text:'Optional: give the camera your finest captain’s wink.',duration:2}
  ]},
  {id:'pirate-sailing',title:'Your next adventure',cues:[
   {id:'pirate-close',type:'speak',text:'Now find your pace, follow the golden word, and sail into your next great take. New script is your next adventure. Arrr, you ready?'}
  ]}
 ]
}));

// Only validated storage reaches this function. Recovery never silently selects a demo.
export function initialSelection(saved,allowDemo=true){
 if(saved?.demoSelected&&allowDemo)return {id:null,demo:true,position:saved.position};
 if(saved?.scriptId)return {id:saved.scriptId,demo:false,position:saved.position};
 const demo=allowDemo&&!saved?.custom.length;
 return {id:null,demo,position:0};
}

export function editorIdentity(script,isDemo,isNew){
 if(isNew||!script)return {targetId:null,suffix:'new'};
 return {targetId:isDemo?null:script.id,suffix:isDemo?'builtin-pirate-demo':script.id};
}
