import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
test('public distribution has only intentional static assets and relative app paths',()=>{
 const expected=['.nojekyll','app.js','clipboard.js','conversion-prompt.js','conversion-prompt.txt','core.js','demo.js','generic-example.json','index.html','mark.svg','prompt-material.js','script.schema.json','style.css'];
 assert.deepEqual(fs.readdirSync(new URL('dist/',root)).sort(),expected.sort());
 const html=read('dist/index.html');
 for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){const value=match[1];if(value.startsWith('https:')||value.startsWith('#'))continue;assert.ok(!value.startsWith('/'),`Root-relative path: ${value}`);assert.ok(fs.existsSync(new URL('dist/'+value,root)),`Missing asset: ${value}`);}
 assert.match(html,/<title>Teleprompt Your Way/);assert.match(html,/A gift to humanity from/);assert.match(html,/TrainYourWay AI/);
});
test('public assets contain no private hosting identity, local paths or source document',()=>{
 const paths=fs.readdirSync(new URL('dist/',root));
 for(const path of paths)assert.doesNotMatch(read('dist/'+path),/appgprj_|appgdep_|libfile_|linear\.app|\/Users\/|source-document\.md|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{20,}/);
 assert.ok(!fs.existsSync(new URL('.openai',root)));assert.ok(!fs.existsSync(new URL('archive',root)));assert.ok(!fs.existsSync(new URL('evidence',root)));
});
test('standard MIT notice and package metadata agree',()=>{const license=read('LICENSE');assert.match(license,/Copyright \(c\) 2026 TrainYourWay AI/);assert.match(license,/Permission is hereby granted, free of charge/);assert.match(license,/THE SOFTWARE IS PROVIDED "AS IS"/);assert.equal(JSON.parse(read('package.json')).license,'MIT');assert.equal(read('dist/conversion-prompt.txt').trim(),read('dist/conversion-prompt.js').match(/`([\s\S]*)`;/)[1].trim());});
