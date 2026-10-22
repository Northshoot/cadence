import {InputError} from './core.js';
import {CONVERSION_PROMPT} from './conversion-prompt.js';

// This is local text composition only. Material never becomes markup or code.
export function validateMaterial(material){
 if(typeof material!=='string'||material.length>200000||new TextEncoder().encode(material).length>1000000)throw new InputError('Material is too long. Use at most 200,000 characters and 1 MB.');
 return material;
}
export function composeFullPrompt(material){
 validateMaterial(material);
 if(!material)return CONVERSION_PROMPT;
 const marker='[Paste the source material here]',index=CONVERSION_PROMPT.lastIndexOf(marker);
 return CONVERSION_PROMPT.slice(0,index)+material+CONVERSION_PROMPT.slice(index+marker.length);
}
