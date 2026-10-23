import {parseProject,serializeProject,type KcutProject} from "@kyro-cut/project-model";
const DB_NAME="kyro-cut-local";
const DB_VERSION=1;
const FALLBACK_KEY="kyro-cut:autosave";

function openDatabase():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==="undefined"){reject(new Error("IndexedDB is unavailable"));return;}
  const request=indexedDB.open(DB_NAME,DB_VERSION);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains("projects"))db.createObjectStore("projects",{keyPath:"id"});if(!db.objectStoreNames.contains("meta"))db.createObjectStore("meta",{keyPath:"key"});};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error??new Error("Could not open local project database."));
 });
}
export async function saveLocalProject(project:KcutProject):Promise<void>{
 const serialized=serializeProject(project);
 try{
  const db=await openDatabase();
  await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction(["projects","meta"],"readwrite");
   tx.objectStore("projects").put(project);
   tx.objectStore("meta").put({key:"latestProjectId",value:project.id});
   tx.oncomplete=()=>resolve();
   tx.onerror=()=>reject(tx.error??new Error("Local autosave transaction failed."));
   tx.onabort=()=>reject(tx.error??new Error("Local autosave transaction was aborted."));
  });
  db.close();
 }catch(error){
  try{localStorage.setItem(FALLBACK_KEY,serialized);}
  catch{throw new Error("Local autosave failed. Export a .kcut copy to protect your work.");}
 }
}
export async function loadLatestLocalProject():Promise<KcutProject|null>{
 try{
  const db=await openDatabase();
  const result=await new Promise<KcutProject|null>((resolve,reject)=>{
   const tx=db.transaction(["projects","meta"],"readonly");
   const metaRequest=tx.objectStore("meta").get("latestProjectId");
   metaRequest.onsuccess=()=>{
    const id=metaRequest.result?.value;
    if(typeof id!=="string"){resolve(null);return;}
    const projectRequest=tx.objectStore("projects").get(id);
    projectRequest.onsuccess=()=>resolve(projectRequest.result?parseProject(JSON.stringify(projectRequest.result)):null);
    projectRequest.onerror=()=>reject(projectRequest.error??new Error("Could not read local project."));
   };
   metaRequest.onerror=()=>reject(metaRequest.error??new Error("Could not read local project index."));
  });
  db.close();
  if(result)return result;
 }catch{/* Fall back to the portable localStorage recovery copy. */}
 try{const saved=localStorage.getItem(FALLBACK_KEY);return saved?parseProject(saved):null;}
 catch{return null;}
}
