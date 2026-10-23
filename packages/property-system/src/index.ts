import type {AnimatableProperty,BezierControlPoints,Keyframe}from"@kyro-cut/project-model";
const DEFAULT_BEZIER:BezierControlPoints={x1:.25,y1:.1,x2:.25,y2:1};
function cubic(a:number,b:number,t:number):number{const inv=1-t;return 3*inv*inv*t*a+3*inv*t*t*b+t*t*t}
function bezierProgress(t:number,control:BezierControlPoints):number{let low=0,high=1,u=t;for(let i=0;i<18;i++){u=(low+high)/2;const x=cubic(control.x1,control.x2,u);if(x<t)low=u;else high=u}return cubic(control.y1,control.y2,u)}
export function evaluateProperty<T>(property:AnimatableProperty<T>,atFrame:number):T{
 if(!Number.isFinite(atFrame))throw new RangeError("Evaluation frame must be finite.");
 const keys=[...property.keyframes].sort((a,b)=>a.frame-b.frame);
 if(!keys.length||atFrame<keys[0].frame)return property.value;
 let left=keys[0];
 for(let i=1;i<keys.length;i++){const right=keys[i];if(atFrame<right.frame){if(left.interpolation==="hold"||typeof left.value!=="number"||typeof right.value!=="number")return left.value;const span=right.frame-left.frame;if(span<=0)return right.value;const t=(atFrame-left.frame)/span;const eased=left.interpolation==="bezier"?bezierProgress(t,left.bezier??DEFAULT_BEZIER):t;return(left.value+(right.value-left.value)*eased) as T;}left=right;}
 return left.value;
}
export function upsertKeyframe<T>(property:AnimatableProperty<T>,key:Keyframe<T>):AnimatableProperty<T>{
 if(!Number.isSafeInteger(key.frame)||key.frame<0)throw new RangeError("Keyframe frame must be a non-negative integer.");
 const keyframes=property.keyframes.filter(k=>k.frame!==key.frame);keyframes.push(key);keyframes.sort((a,b)=>a.frame-b.frame);return{...property,keyframes};
}
