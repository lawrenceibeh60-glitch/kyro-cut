export const PROJECT_FORMAT = "kyro-cut";
export const CURRENT_PROJECT_VERSION = 1;
export type Interpolation = "hold" | "linear";
export interface Keyframe<T> { frame:number; value:T; interpolation:Interpolation }
export interface AnimatableProperty<T> { id:string; name:string; value:T; keyframes:Keyframe<T>[] }
export interface LayerTransform { x:number;y:number;scaleX:number;scaleY:number;rotation:number;opacity:number }
export type EffectType="glow"|"speed-lines"|"impact-ring"|"motion-trail";
export interface LayerEffect {id:string;type:EffectType;enabled:boolean;version:number;params:Record<string,number|boolean|string>}
export interface StudioLayer { id:string;name:string;kind:"shape"|"text"|"image"|"video"|"audio";shape?:"circle"|"ring";effects?:LayerEffect[];enabled:boolean;transform:LayerTransform;color:string;x:AnimatableProperty<number>;y:AnimatableProperty<number> }
export interface Composition { id:string;name:string;width:number;height:number;frameRate:number;durationFrames:number;background:string;layers:StudioLayer[] }
export interface KcutProject { format:typeof PROJECT_FORMAT;version:number;id:string;name:string;createdAt:string;updatedAt:string;activeCompositionId:string;compositions:Composition[];metadata:{author?:string;colorSpace:"srgb";notes?:string} }
export type ValidationIssue={path:string;message:string};
export function validateProject(input:unknown):ValidationIssue[]{
 const issues:ValidationIssue[]=[];
 if(!input||typeof input!=="object"||Array.isArray(input))return[{path:"$",message:"Project must be an object."}];
 const p=input as Partial<KcutProject>;
 if(p.format!==PROJECT_FORMAT)issues.push({path:"format",message:"Unsupported project format."});
 if(!Number.isInteger(p.version)||(p.version??0)<1||(p.version??0)>CURRENT_PROJECT_VERSION)issues.push({path:"version",message:"Project version is not supported."});
 if(typeof p.id!=="string"||!p.id.trim())issues.push({path:"id",message:"Project id is required."});
 if(typeof p.name!=="string"||!p.name.trim())issues.push({path:"name",message:"Project name is required."});
 if(!Array.isArray(p.compositions)||!p.compositions.length)issues.push({path:"compositions",message:"At least one composition is required."});
 else{
  const ids=new Set<string>();
  p.compositions.forEach((c,i)=>{
   if(!c||typeof c!=="object"){issues.push({path:`compositions[${i}]`,message:"Composition must be an object."});return}
   if(!c.id||ids.has(c.id))issues.push({path:`compositions[${i}].id`,message:"Composition ids must be present and unique."});ids.add(c.id);
   if(!Number.isInteger(c.width)||c.width<1||!Number.isInteger(c.height)||c.height<1)issues.push({path:`compositions[${i}]`,message:"Dimensions must be positive integers."});
   if(!Number.isFinite(c.frameRate)||c.frameRate<=0||c.frameRate>240)issues.push({path:`compositions[${i}].frameRate`,message:"Frame rate must be in (0, 240]."});
   if(!Number.isInteger(c.durationFrames)||c.durationFrames<1)issues.push({path:`compositions[${i}].durationFrames`,message:"Duration must be a positive integer frame count."});
   if(!Array.isArray(c.layers))issues.push({path:`compositions[${i}].layers`,message:"Layers must be an array."});
  });
  if(typeof p.activeCompositionId!=="string"||!ids.has(p.activeCompositionId))issues.push({path:"activeCompositionId",message:"Must reference an existing composition."});
 }
 return issues;
}
export function serializeProject(project:KcutProject):string{const issues=validateProject(project);if(issues.length)throw new Error("Invalid project: "+issues.map(i=>i.path+": "+i.message).join("; "));return JSON.stringify(project,null,2)}
export function parseProject(source:string):KcutProject{let value:unknown;try{value=JSON.parse(source)}catch{throw new Error("Project file is not valid JSON.")}const issues=validateProject(value);if(issues.length)throw new Error("Invalid project: "+issues.map(i=>i.path+": "+i.message).join("; "));return value as KcutProject}
