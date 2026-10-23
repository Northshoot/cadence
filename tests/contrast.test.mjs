import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const rule=selector=>css.slice(css.indexOf(selector+'{')+selector.length+1).split('}')[0];
const value=(selector,property)=>rule(selector).split(';').find(x=>x.startsWith(property+':'))?.slice(property.length+1);
const luminance=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);

test('light-panel text palette meets WCAG AA normal-text contrast, including chapter states',()=>{
 const paper=value(':root','--paper'),active=value('.section-button.active','background');
 for(const selector of ['.side-heading,.outline-title','.outline-title span','.section-number','.section-info strong','.section-info small','.sidebar-note p','.sidebar-note .text-button','.outline-empty']){
  for(const background of [paper,active,'#e9ecdf'])assert.ok(ratio(value(selector,'color'),background)>=4.5,`${selector} on ${background}`);
 }
 for(const [selector,background]of [['.small-label','#fafaf3'],['.time-block>div','#fafaf3'],['.transport-bottom','#fafaf3'],['.keyboard-hint','#fafaf3'],['.field p,.dialog-footnote',paper],['.editor-hint,.storage-note',paper],['.material-field label span',paper],['input::placeholder,textarea::placeholder','#fffdf7']]){
  assert.ok(ratio(value(selector,'color'),background)>=4.5,selector);
 }
});
