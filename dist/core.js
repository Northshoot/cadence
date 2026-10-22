// All imported JSON, local storage and editor text cross this boundary before use.
export const VERSION = 1;
export const LIMITS = Object.freeze({jsonBytes:1000000,storageBytes:4500000,plainChars:200000,textChars:12000,totalText:200000,words:20000,cues:2000,sections:100,depth:12,nodes:60000,seconds:3600,totalSeconds:28800,scripts:60});
export const DEFAULTS = Object.freeze({wpm:110,fontSize:44,countdown:3,pauseMode:'full',breathReminders:false,mirror:false});
const FORBIDDEN = new Set(['__proto__','prototype','constructor']);
export class InputError extends Error {}
const fail = message => {throw new InputError(message);};
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&(Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
export const uid=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const tokens=text=>[...text.matchAll(/\S+/gu)].map(m=>({text:m[0],start:m.index,end:m.index+m[0].length}));
export const words=text=>(text.match(/\S+/gu)||[]).length;
export const clock=seconds=>{const n=Math.floor(Math.max(0,Number.isFinite(seconds)?seconds:0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
const byteLength=text=>new TextEncoder().encode(text).length;
export function assertSafeTree(root,maxNodes=LIMITS.nodes){
 const stack=[[root,0]],seen=new Set();let count=0;
 while(stack.length){const [value,depth]=stack.pop();if(++count>maxNodes)fail('Too many values. Split this input into smaller files.');if(depth>LIMITS.depth)fail('Input is nested too deeply.');
  if(value===null||['string','boolean'].includes(typeof value))continue;
  if(typeof value==='number'){if(!Number.isFinite(value))fail('Numbers must be finite.');continue;}
  if(typeof value!=='object')fail('Only JSON data is supported.');
  if(seen.has(value))fail('Circular input is not supported.');seen.add(value);
  if(!Array.isArray(value)&&!record(value))fail('Use plain JSON objects.');
  for(const key of Reflect.ownKeys(value)){if(typeof key!=='string'||FORBIDDEN.has(key))fail('Reserved object keys are not allowed.');const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor||!own(descriptor,'value'))fail('Executable properties are not allowed.');if(Array.isArray(value)&&key==='length')continue;stack.push([descriptor.value,depth+1]);}
 }
}
export function safeJSON(raw,{maxBytes=LIMITS.jsonBytes}={}){
 if(typeof raw!=='string'||raw.length>maxBytes||byteLength(raw)>maxBytes)fail('Input exceeds the allowed file size.');
 // Bound nesting before JSON.parse, respecting escaped quotes inside strings.
 let depth=0,inString=false,escaped=false;
 for(const char of raw){if(inString){if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char==='"')inString=false;}else if(char==='"')inString=true;else if(char==='{'||char==='['){if(++depth>LIMITS.depth)fail('Input is nested too deeply.');}else if(char==='}'||char===']')depth--;}
 let result;try{result=JSON.parse(raw);}catch{fail('This JSON is not valid. Check commas, quotation marks and brackets.');}
 assertSafeTree(result,maxBytes>LIMITS.jsonBytes?300000:LIMITS.nodes);return result;
}
const shape=(o,keys,label)=>{if(!record(o))fail(`${label} must be an object.`);if(Object.keys(o).some(k=>!keys.includes(k)))fail(`${label} contains an unsupported field.`);};
const string=(v,label,max,required=true)=>{if(typeof v!=='string'||v.length>max||(required&&!v.trim())||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(v))fail(`${label} must be valid text, up to ${max} characters.`);return v;};
const number=(v,label,min,max)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail(`${label} must be a finite number between ${min} and ${max}.`);return v;};
export function validateScript(input){
 assertSafeTree(input);
 shape(input,['version','id','title','subtitle','status','defaultWpm','targetSeconds','source','notes','sections'],'Script');
 if(input.version!==VERSION)fail('Script version must be 1.');
 const ids=new Set();const id=v=>{string(v,'ID',120);if(ids.has(v))fail('Every script, section and cue must have a unique ID.');ids.add(v);return v;};
 const out={version:1,id:id(input.id),title:string(input.title,'Title',200)};
 for(const field of ['subtitle','status'])if(own(input,field))out[field]=string(input[field],field,300,false);
 if(own(input,'defaultWpm'))out.defaultWpm=number(input.defaultWpm,'Default WPM',60,240);
 if(own(input,'targetSeconds'))out.targetSeconds=number(input.targetSeconds,'Target duration',0,LIMITS.totalSeconds);
 if(own(input,'source')){shape(input.source,['issue','url','updatedAt'],'Source');out.source={};for(const field of ['issue','url','updatedAt'])if(own(input.source,field))out.source[field]=string(input.source[field],'Source metadata',2048,false);}
 if(own(input,'notes')){if(!Array.isArray(input.notes)||input.notes.length>50)fail('Notes must be a list of at most 50 text items.');out.notes=input.notes.map(v=>string(v,'Note',2000,false));}
 if(!Array.isArray(input.sections)||!input.sections.length||input.sections.length>LIMITS.sections)fail('Include 1–100 sections.');
 let cueCount=0,textCount=0,wordCount=0,minimumPaceSeconds=0;
 out.sections=input.sections.map(section=>{
  shape(section,['id','title','cues'],'Section');const s={id:id(section.id),title:string(section.title,'Section title',200),cues:[]};
  if(!Array.isArray(section.cues)||!section.cues.length)fail('Every section needs at least one cue.');
  s.cues=section.cues.map(cue=>{
   if(++cueCount>LIMITS.cues)fail('Use at most 2,000 cues.');
   shape(cue,['id','type','text','duration','label','editorNote','breathHint'],'Cue');
   if(!['speak','pause','stage','breath'].includes(cue.type))fail('Cue type must be speak, pause, stage or breath.');
   const c={id:id(cue.id),type:cue.type};
   if(cue.type==='pause'){if(own(cue,'text'))fail('Pause cues do not have spoken text.');if(!own(cue,'duration'))fail('A pause needs a duration in seconds.');}
   else{c.text=string(cue.text,'Cue text',LIMITS.textChars);textCount+=c.text.length;if(cue.type==='speak')wordCount+=words(c.text);}
   if(own(cue,'duration'))c.duration=number(cue.duration,'Cue duration',cue.type==='speak'?0.01:0,LIMITS.seconds);
   for(const field of ['label','editorNote'])if(own(cue,field))c[field]=string(cue[field],'Cue metadata',1000,false);
   if(own(cue,'breathHint')){shape(cue.breathHint,['mode'],'Breathing hint');if(!['easy','three-five'].includes(cue.breathHint.mode))fail('Unsupported breathing hint.');c.breathHint={mode:cue.breathHint.mode};}
   minimumPaceSeconds+=c.duration??(c.type==='speak'?words(c.text):c.type==='breath'?4:0);
   return c;
  });return s;
 });
 if(!wordCount)fail('Include at least one spoken word.');
 if(textCount>LIMITS.totalText||wordCount>LIMITS.words)fail('Script is too long. Limit it to 200,000 text characters and 20,000 words.');
 if(minimumPaceSeconds>LIMITS.totalSeconds)fail('The script exceeds 8 hours at the slowest supported pace.');
 if(byteLength(JSON.stringify(out))>LIMITS.jsonBytes)fail('Keep a script under 1 MB.');
 return out;
}
export const parseScriptJSON=raw=>validateScript(safeJSON(raw));
export function parsePlain(raw,{title='Untitled script',previous=null}={}){
 string(raw,'Plain text',LIMITS.plainChars);const old=previous?validateScript(previous):null;const oldCues=old?.sections.flatMap(s=>s.cues)||[],used=new Set();
 const matching=(type,text,duration)=>{const c=oldCues.find(c=>!used.has(c.id)&&c.type===type&&c.text===text&&c.duration===duration);if(c)used.add(c.id);return c;};
 const sections=[];let section=null,buffer=[];
 const ensure=()=>{if(!section){section={id:old?.sections[sections.length]?.id||uid(),title:'Your script',cues:[]};sections.push(section);}};
 const add=(type,text,duration)=>{ensure();const prior=matching(type,text,duration);const cue=prior?{...prior}:{id:uid(),type};if(text!==undefined)cue.text=text;if(duration!==undefined)cue.duration=duration;section.cues.push(cue);};
 const flush=()=>{if(buffer.length){const value=buffer.join('\n').trim();if(value)add('speak',value);buffer=[];}};
 for(const line of raw.replace(/\r\n?/g,'\n').split('\n')){
  const heading=line.match(/^#{1,3}\s+(.+)$/),marker=line.trim().replace(/\\([\[\]])/g,'$1').match(/^\[(pause|breath|stage)(?:\s+(\d+(?:\.\d+)?)s)?(?:\s*:\s*(.*))?\]$/i);
  if(heading){flush();section={id:old?.sections[sections.length]?.id||uid(),title:heading[1].trim(),cues:[]};sections.push(section);}
  else if(marker){flush();const type=marker[1].toLowerCase();add(type,type==='pause'?undefined:marker[3]||(type==='breath'?'Breathe naturally':'Direction'),marker[2]===undefined?undefined:Number(marker[2]));}
  else if(!line.trim())flush();else buffer.push(line);
 }
 flush();return validateScript({version:1,id:old?.id||uid(),title,sections:sections.filter(s=>s.cues.length)});
}
export const toPlain=script=>script.sections.map(s=>`# ${s.title}\n\n`+s.cues.map(c=>c.type==='speak'?c.text:`[${c.type}${c.duration!==undefined?' '+c.duration+'s':''}${c.type==='pause'?'':': '+c.text}]`).join('\n\n')).join('\n\n');
export function settingsFrom(input){
 const out={...DEFAULTS};if(!record(input))return out;
 for(const [key,min,max] of [['wpm',60,240],['fontSize',28,72]])if(typeof input[key]==='number'&&Number.isFinite(input[key])&&input[key]>=min&&input[key]<=max)out[key]=input[key];
 if([0,3,5,10].includes(input.countdown))out.countdown=input.countdown;
 if(['full','recording','skip'].includes(input.pauseMode))out.pauseMode=input.pauseMode;
 out.breathReminders=input.breathReminders===true;out.mirror=input.mirror===true;return out;
}
export function makeTimeline(script,rawSettings=DEFAULTS){
 const settings=settingsFrom(rawSettings),items=[];let start=0;
 if(!script)return {items,total:0};
 for(const section of script.sections)for(const cue of section.cues){const wordTokens=cue.type==='speak'?tokens(cue.text):[];
  const duration=cue.type==='speak'?(cue.duration??wordTokens.length/settings.wpm*60):cue.type==='pause'?(settings.pauseMode==='skip'?0:settings.pauseMode==='recording'?Math.min(2,cue.duration):cue.duration):cue.type==='breath'?(settings.breathReminders?(cue.duration??4):0):(cue.duration??0);
  items.push({...cue,wordTokens,sectionId:section.id,sectionTitle:section.title,start,duration});start+=duration;
 }return {items,total:start};
}
export function locate(timeline,position){if(!timeline.items.length)return -1;const i=timeline.items.findIndex(c=>c.duration>0&&c.start+c.duration>position+1e-9);return i<0?timeline.items.length-1:i;}
export function wordAt(item,position){if(!item||item.type!=='speak'||!item.wordTokens.length)return -1;return Math.min(item.wordTokens.length-1,Math.max(0,Math.floor((position-item.start)/item.duration*item.wordTokens.length+1e-9)));}
export function retime(before,after,position){if(position===0)return 0;if(position>=before.total)return after.total;const old=before.items[locate(before,position)],next=after.items.find(c=>c.id===old?.id);return next?next.start+Math.max(0,Math.min(1,(position-old.start)/(old.duration||1)))*next.duration:0;}
export function restoreState(raw){
 const input=safeJSON(raw,{maxBytes:LIMITS.storageBytes});shape(input,['version','settings','custom','scriptId','position'],'Saved state');
 if(![1,2].includes(input.version)||!Array.isArray(input.custom)||input.custom.length>LIMITS.scripts)fail('Saved state has an unsupported format.');
 const scripts=[],ids=new Set();let rejected=0;
 for(const value of input.custom){try{const s=validateScript(value);if(ids.has(s.id))fail('Duplicate saved script.');scripts.push(s);ids.add(s.id);}catch{rejected++;}}
 const settings=settingsFrom(input.settings),position=typeof input.position==='number'&&Number.isFinite(input.position)?Math.max(0,Math.min(LIMITS.totalSeconds,input.position)):0;
 return {custom:scripts,settings,position,scriptId:typeof input.scriptId==='string'?input.scriptId:null,rejected};
}
export function restoreDraft(raw){const d=safeJSON(raw);shape(d,['title','text','mode'],'Draft');return {title:string(d.title,'Draft title',200,false),text:string(d.text,'Draft text',LIMITS.jsonBytes,false),mode:['plain','json'].includes(d.mode)?d.mode:fail('Draft mode is invalid.')};}
export function importedFile(name,size,content){
 if(typeof name!=='string'||!Number.isFinite(size)||size<0||size>LIMITS.jsonBytes)fail('Choose a file smaller than 1 MB.');
 const extension=name.toLowerCase().split('.').pop();if(!['json','txt','md'].includes(extension))fail('Choose a .json, .txt or .md file.');
 const script=extension==='json'?parseScriptJSON(content):parsePlain(content,{title:name.replace(/\.[^.]+$/,'').slice(0,200)||'Imported script'});
 return {script,mode:extension==='json'?'json':'plain',content:extension==='json'?JSON.stringify(script,null,2):content};
}
