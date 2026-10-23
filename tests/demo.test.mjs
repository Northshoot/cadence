import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMO,initialSelection,editorIdentity} from '../dist/demo.js';
import {DEFAULTS,validateScript,makeTimeline,locate,wordAt,restoreState} from '../dist/core.js';

const saved=(custom=[],extra={})=>restoreState(JSON.stringify({version:2,settings:DEFAULTS,custom,scriptId:null,position:0,...extra}));
const personal=()=>({...structuredClone(DEMO),title:'My saved speech'});

test('original pirate demo is valid, concise, and begins with paced speech',()=>{
 assert.deepEqual(validateScript(DEMO),DEMO);
 const timeline=makeTimeline(DEMO);
 assert.ok(timeline.total<65);
 assert.equal(timeline.items[0].type,'speak');
 assert.equal(wordAt(timeline.items[0],0),0);
 assert.equal(wordAt(timeline.items[0],60/DEFAULTS.wpm),1);
 assert.equal(timeline.items.filter(c=>c.type==='breath').length,0);
 for(const cue of timeline.items.filter(c=>c.type!=='speak')){
  assert.equal(wordAt(cue,cue.start),-1);
  assert.equal(locate(timeline,cue.start),timeline.items.indexOf(cue));
  if(cue.type==='stage')assert.match(cue.text,/^Optional:/);
 }
 assert.equal(Object.isFrozen(DEMO.sections[0].cues[0]),true);
 assert.throws(()=>{DEMO.sections[0].cues[0].text='Changed';},TypeError);
});

test('fresh and previously empty libraries get the demo without creating a saved script',()=>{
 assert.deepEqual(initialSelection(null),{id:null,demo:true,position:0});
 const empty=saved();
 assert.deepEqual(initialSelection(empty),{id:null,demo:true,position:0});
 assert.deepEqual(empty.custom,[]);
});

test('existing saved selection and position survive even when its ID matches the demo',()=>{
 const own=personal(),state=saved([own],{scriptId:own.id,position:12.5});
 const before=JSON.stringify(state);
 assert.deepEqual(initialSelection(state),{id:own.id,demo:false,position:12.5});
 assert.equal(JSON.stringify(state),before);
 assert.deepEqual(state.custom,[own]);
 const blank=saved([own]);
 assert.deepEqual(initialSelection(blank),{id:null,demo:false,position:0});
});

test('demo selection can be restored independently of personal scripts and IDs',()=>{
 const own=personal(),state=saved([own],{demoSelected:true,position:8});
 assert.deepEqual(initialSelection(state),{id:null,demo:true,position:8});
 assert.deepEqual(state.custom,[own]);
 for(const value of ['true',1,null,{},[]])assert.throws(()=>saved([],{demoSelected:value}));
});

test('storage recovery never silently substitutes the demo for missing work',()=>{
 assert.deepEqual(initialSelection(null,false),{id:null,demo:false,position:0});
 assert.deepEqual(initialSelection(saved(),false),{id:null,demo:false,position:0});
 assert.deepEqual(initialSelection(saved([],{scriptId:'missing',position:7}),false),{id:'missing',demo:false,position:7});
});

test('demo editing creates a copy and uses a different draft from New script and personal work',()=>{
 assert.deepEqual(editorIdentity(DEMO,true,false),{targetId:null,suffix:'builtin-pirate-demo'});
 assert.deepEqual(editorIdentity(DEMO,true,true),{targetId:null,suffix:'new'});
 assert.deepEqual(editorIdentity(personal(),false,false),{targetId:DEMO.id,suffix:DEMO.id});
});
