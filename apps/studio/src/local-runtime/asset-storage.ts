import type{AssetReference}from"@kyro-cut/project-model";
const DB_NAME="kyro-cut-local";const DB_VERSION=2;const urlCache=new Map<string,string>();
function openAssetDatabase():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{if(typeof indexedDB==="undefined"){reject(new Error("IndexedDB is unavailable; local media import needs persistent browser storage."));return}const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains("projects"))db.createObjectStore("projects",{keyPath:"id"});if(!db.objectStoreNames.contains("meta"))db.createObjectStore("meta",{keyPath:"key"});if(!db.objectStoreNames.contains("assets"))db.createObjectStore("assets",{keyPath:"id"})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error??new Error("Could not open media database."))})}
function assetKind(file:File):AssetReference["kind"]{if(file.type.startsWith("image/"))return"image";if(file.type.startsWith("video/"))return"video";if(file.type.startsWith("audio/"))return"audio";return"other"}
export async function saveLocalAsset(file:File):Promise<{asset:AssetReference;url:string}>{
 const kind=assetKind(file);if(kind==="other")throw new Error("Choose an image, video, or audio file.");
 const id=globalThis.crypto?.randomUUID?.()??`asset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
 const asset:AssetReference={id,name:file.name,kind,mimeType:file.type||"application/octet-stream",sizeBytes:file.size,lastModified:file.lastModified,storageKey:id};
 const db=await openAssetDatabase();
 try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction("assets","readwrite");tx.objectStore("assets").put({...asset,blob:file});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error("Could not store media file."));tx.onabort=()=>reject(tx.error??new Error("Media storage transaction aborted."))})}finally{db.close()}
 const url=URL.createObjectURL(file);urlCache.set(id,url);return{asset,url};
}
export async function loadLocalAssetUrl(id:string):Promise<string|null>{
 const cached=urlCache.get(id);if(cached)return cached;
 let db:IDBDatabase;
 try{db=await openAssetDatabase()}catch{return null}
 try{const record=await new Promise<{blob?:Blob}|undefined>((resolve,reject)=>{const tx=db.transaction("assets","readonly");const request=tx.objectStore("assets").get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error??new Error("Could not read local media."))});if(!record?.blob)return null;const url=URL.createObjectURL(record.blob);urlCache.set(id,url);return url}
 catch{return null}finally{db.close()}
}
