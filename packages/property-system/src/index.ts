import type {AnimatableProperty,Keyframe} from "@kyro-cut/project-model";
export function evaluateProperty<T>(property:AnimatableProperty<T>,atFrame:number):T{
 if(!Number.isFinite(atFrame))throw new RangeError("Evaluation frame must be finite.");
 const keys=[...property.keyframes].sort((a,b)=>a.frame-b.frame);
 if(!keys.length||atFrame<keys[0].frame)return property.value;
 let left=keys[0];
 for(let i=1;i<keys.length;i++){const right=keys[i];if(atFrame<right.frame){if(left.interpolation==="hold"||typeof left.value!=="number"||typeof right.value!=="number")return left.value;const span=right.frame-left.frame;if(span<=0)return right.value;return (left.value+(right.value-left.value)*(atFrame-left.frame)/span) as T;}left=right;}
 return left.value;
}
export function upsertKeyframe<T>(property:AnimatableProperty<T>,key:Keyframe<T>):AnimatableProperty<T>{
 if(!Number.isSafeInteger(key.frame)||key.frame<0)throw new RangeError("Keyframe frame must be a non-negative integer.");
 const keyframes=property.keyframes.filter(k=>k.frame!==key.frame);keyframes.push(key);keyframes.sort((a,b)=>a.frame-b.frame);return {...property,keyframes};
}
