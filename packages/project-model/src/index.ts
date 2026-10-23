export const PROJECT_FORMAT="kyro-cut";
export const CURRENT_PROJECT_VERSION=1;
export type Interpolation="hold"|"linear";
export interface Keyframe<T>{frame:number;value:T;interpolation:Interpolation}
export interface AnimatableProperty<T>{id:string;name:string;value:T;keyframes:Keyframe<T>[]}
export interface LayerTransform{x:number;y:number;scaleX:number;scaleY:number;rotation:number;opacity:number}
export type EffectType="glow"|"speed-lines"|"impact-ring"|"motion-trail";
export interface LayerEffect{id:string;type:EffectType;enabled:boolean;version:number;params:Record<string,number|boolean|string>}
export interface StudioLayer{id:string;name:string;kind:"shape"|"text"|"image"|"video"|"audio";shape?:"circle"|"ring";effects?:LayerEffect[];enabled:boolean;transform:LayerTransform;color:string;x:AnimatableProperty<number>;y:AnimatableProperty<number>}
export interface Composition{id:string;name:string;width:number;height:number;frameRate:number;durationFrames:number;background:string;layers:StudioLayer[]}
export interface KcutProject{format:typeof PROJECT_FORMAT;version:number;id:string;name:string;createdAt:string;updatedAt:string;activeCompositionId:string;assets?:AssetReference[];compositions:Composition[];metadata:{author?:string;colorSpace:"srgb";notes?:string}}
export type ValidationIssue={path:string;message:string};
const LAYER_KINDS=["shape","text","image","video","audio"] as const;
const EFFECT_TYPES=["glow","speed-lines","impact-ring","motion-trail"] as const;
const finite=(value:unknown):value is number=>typeof value==="number"&&Number.isFinite(value);
export function validateProject(input:unknown):ValidationIssue[]{
 const issues:ValidationIssue[]=[];
 if(!input||typeof input!=="object"||Array.isArray(input))return[{path:"$",message:"Project must be an object."}];
 const p=input as Partial<KcutProject>;
 if(p.format!==PROJECT_FORMAT)issues.push({path:"format",message:"Unsupported project format."});
 if(!Number.isInteger(p.version)||(p.version??0)<1||(p.version??0)>CURRENT_PROJECT_VERSION)issues.push({path:"version",message:"Project version is not supported."});
 if(typeof p.id!=="string"||!p.id.trim())issues.push({path:"id",message:"Project id is required."});
 if(typeof p.name!=="string"||!p.name.trim())issues.push({path:"name",message:"Project name is required."});
 const assetIds=new Set<string>();
 if(p.assets!==undefined&&!Array.isArray(p.assets))issues.push({path:"assets",message:"Assets must be an array."});
 if(Array.isArray(p.assets))p.assets.forEach((rawAsset,index)=>{const ap=`assets[${index}]`;if(!rawAsset||typeof rawAsset!=="object"||Array.isArray(rawAsset)){issues.push({path:ap,message:"Asset must be an object."});return;}const a=rawAsset as AssetReference;if(typeof a.id!=="string"||!a.id||assetIds.has(a.id))issues.push({path:ap+".id",message:"Asset ids must be present and unique."});if(typeof a.id==="string")assetIds.add(a.id);if(typeof a.name!=="string"||!a.name.trim())issues.push({path:ap+".name",message:"Asset name is required."});if(!["image","video","audio","font","other"].includes(a.kind))issues.push({path:ap+".kind",message:"Unsupported asset kind."});if(typeof a.mimeType!=="string"||!Number.isSafeInteger(a.sizeBytes)||a.sizeBytes<0||!Number.isFinite(a.lastModified)||typeof a.storageKey!=="string"||!a.storageKey)issues.push({path:ap,message:"Asset metadata is malformed."});});
 if(!Array.isArray(p.compositions)||!p.compositions.length)issues.push({path:"compositions",message:"At least one composition is required."});
 else{
  const compositionIds=new Set<string>();const layerIds=new Set<string>();
  p.compositions.forEach((rawComp,index)=>{
   const path=`compositions[${index}]`;
   if(!rawComp||typeof rawComp!=="object"||Array.isArray(rawComp)){issues.push({path,message:"Composition must be an object."});return;}
   const c=rawComp as Composition;
   if(typeof c.id!=="string"||!c.id||compositionIds.has(c.id))issues.push({path:path+".id",message:"Composition ids must be present and unique."});
   if(typeof c.id==="string")compositionIds.add(c.id);
   if(!Number.isInteger(c.width)||c.width<1||!Number.isInteger(c.height)||c.height<1)issues.push({path,message:"Dimensions must be positive integers."});
   if(!finite(c.frameRate)||c.frameRate<=0||c.frameRate>240)issues.push({path:path+".frameRate",message:"Frame rate must be in (0, 240]."});
   if(!Number.isInteger(c.durationFrames)||c.durationFrames<1)issues.push({path:path+".durationFrames",message:"Duration must be a positive integer frame count."});
   if(!Array.isArray(c.layers)){issues.push({path:path+".layers",message:"Layers must be an array."});return;}
   c.layers.forEach((rawLayer,layerIndex)=>{
    const lp=`${path}.layers[${layerIndex}]`;
    if(!rawLayer||typeof rawLayer!=="object"||Array.isArray(rawLayer)){issues.push({path:lp,message:"Layer must be an object."});return;}
    const l=rawLayer as StudioLayer;
    if(typeof l.id!=="string"||!l.id||layerIds.has(l.id))issues.push({path:lp+".id",message:"Layer ids must be present and unique within the project."});
    if(typeof l.id==="string")layerIds.add(l.id);
    if(typeof l.name!=="string"||!l.name.trim())issues.push({path:lp+".name",message:"Layer name is required."});
    if(l.assetId!==undefined&&(typeof l.assetId!=="string"||!assetIds.has(l.assetId)))issues.push({path:lp+".assetId",message:"Layer asset reference must exist in the project asset list."});
    if(!(LAYER_KINDS as readonly unknown[]).includes(l.kind))issues.push({path:lp+".kind",message:"Unsupported layer kind."});
    if(typeof l.enabled!=="boolean")issues.push({path:lp+".enabled",message:"Layer enabled state must be boolean."});
    if(!l.transform||typeof l.transform!=="object"||!["x","y","scaleX","scaleY","rotation","opacity"].every(key=>finite((l.transform as unknown as Record<string,unknown>)[key])))issues.push({path:lp+".transform",message:"Transform must contain finite x, y, scale, rotation and opacity values."});
    else if(l.transform.opacity<0||l.transform.opacity>1)issues.push({path:lp+".transform.opacity",message:"Opacity must be between 0 and 1."});
    for(const axis of ["x","y"] as const){
     const prop=l[axis] as unknown as {id?:unknown;name?:unknown;value?:unknown;keyframes?:unknown};
     if(!prop||typeof prop!=="object"||typeof prop.id!=="string"||typeof prop.name!=="string"||!finite(prop.value)||!Array.isArray(prop.keyframes)){issues.push({path:lp+"."+axis,message:"Animatable property is malformed."});continue;}
     const seenFrames=new Set<number>();
     prop.keyframes.forEach((key,ki)=>{
      const kp=`${lp}.${axis}.keyframes[${ki}]`;
      if(!key||typeof key!=="object"||!Number.isSafeInteger((key as Keyframe<number>).frame)||(key as Keyframe<number>).frame<0||!finite((key as Keyframe<number>).value)||!["hold","linear"].includes((key as Keyframe<number>).interpolation)){issues.push({path:kp,message:"Keyframe requires a non-negative integer frame, finite value and supported interpolation."});return;}
      const frame=(key as Keyframe<number>).frame;if(seenFrames.has(frame))issues.push({path:kp+".frame",message:"Keyframe frames must be unique within a property."});seenFrames.add(frame);
     });
    }
    if(l.effects!==undefined&&!Array.isArray(l.effects))issues.push({path:lp+".effects",message:"Effects must be an array."});
    if(Array.isArray(l.effects))l.effects.forEach((rawEffect,ei)=>{
     const ep=`${lp}.effects[${ei}]`;
     if(!rawEffect||typeof rawEffect!=="object"||Array.isArray(rawEffect)){issues.push({path:ep,message:"Effect must be an object."});return;}
     const e=rawEffect as LayerEffect;
     if(typeof e.id!=="string"||!e.id)issues.push({path:ep+".id",message:"Effect id is required."});
     if(!(EFFECT_TYPES as readonly unknown[]).includes(e.type))issues.push({path:ep+".type",message:"Unsupported effect type."});
     if(typeof e.enabled!=="boolean")issues.push({path:ep+".enabled",message:"Effect enabled state must be boolean."});
     if(!Number.isInteger(e.version)||e.version<1)issues.push({path:ep+".version",message:"Effect version must be a positive integer."});
     if(!e.params||typeof e.params!=="object"||Array.isArray(e.params))issues.push({path:ep+".params",message:"Effect parameters must be an object."});
     else for(const[key,value]of Object.entries(e.params)){if(!["string","boolean","number"].includes(typeof value)||(typeof value==="number"&&!Number.isFinite(value)))issues.push({path:ep+".params."+key,message:"Effect parameters must be finite numbers, strings or booleans."});}
    });
   });
  });
  if(typeof p.activeCompositionId!=="string"||!compositionIds.has(p.activeCompositionId))issues.push({path:"activeCompositionId",message:"Active composition must reference an existing composition."});
 }
 return issues;
}
export function serializeProject(project:KcutProject):string{const issues=validateProject(project);if(issues.length)throw new Error("Invalid project: "+issues.map(i=>i.path+": "+i.message).join("; "));return JSON.stringify(project,null,2)}
export function parseProject(source:string):KcutProject{let value:unknown;try{value=JSON.parse(source)}catch{throw new Error("Project file is not valid JSON.")}const issues=validateProject(value);if(issues.length)throw new Error("Invalid project: "+issues.map(i=>i.path+": "+i.message).join("; "));return value as KcutProject}
