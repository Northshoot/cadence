// Manual selection remains available when the browser denies clipboard access.
export async function copyOrSelect(text,writeText,selectText){
 try{await writeText(text);return true;}
 catch{selectText();return false;}
}
