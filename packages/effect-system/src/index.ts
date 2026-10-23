import type {EffectType,LayerEffect} from "@kyro-cut/project-model";
export interface EffectParameterLimit{min:number;max:number;step:number}
export interface EffectDefinition{type:EffectType;label:string;category:"anime"|"lighting"|"motion";description:string;defaults:Record<string,number|boolean|string>;limits:Record<string,EffectParameterLimit>}
export const EFFECT_DEFINITIONS:Record<EffectType,EffectDefinition>={
 glow:{type:"glow",label:"Glow",category:"lighting",description:"Soft light bloom around the layer.",defaults:{intensity:28},limits:{intensity:{min:0,max:80,step:1}}},
 "speed-lines":{type:"speed-lines",label:"Speed Lines",category:"anime",description:"Radial action lines around the subject.",defaults:{count:18,length:90,rotation:0},limits:{count:{min:4,max:64,step:1},length:{min:12,max:240,step:1},rotation:{min:-180,max:180,step:1}}},
 "impact-ring":{type:"impact-ring",label:"Impact Ring",category:"anime",description:"Pulsing concentric impact rings.",defaults:{radius:94,pulse:8,secondaryRadius:118},limits:{radius:{min:10,max:300,step:1},pulse:{min:0,max:40,step:1},secondaryRadius:{min:10,max:350,step:1}}},
 "motion-trail":{type:"motion-trail",label:"Motion Trail",category:"motion",description:"Faded echoes behind the animated subject.",defaults:{samples:4,distance:12},limits:{samples:{min:1,max:8,step:1},distance:{min:2,max:40,step:1}}}
};
export function createEffect(type:EffectType):LayerEffect{
 const definition=EFFECT_DEFINITIONS[type];if(!definition)throw new Error(`Unknown effect type: ${type}`);
 return{id:globalThis.crypto?.randomUUID?.()??`effect-${type}-${Date.now()}`,type,enabled:true,version:1,params:{...definition.defaults}};
}
export function effectNumber(effect:LayerEffect,key:string,fallback:number):number{
 const value=effect.params[key];return typeof value==="number"&&Number.isFinite(value)?value:fallback;
}
export function validateEffect(effect:LayerEffect):string[]{
 const errors:string[]=[];const definition=EFFECT_DEFINITIONS[effect.type];
 if(!definition)return["Unknown effect type."];
 if(!Number.isInteger(effect.version)||effect.version<1)errors.push("Effect version must be a positive integer.");
 for(const[key,value]of Object.entries(effect.params)){
  if(!(key in definition.defaults)){errors.push(`Unknown parameter: ${key}`);continue;}
  if(typeof definition.defaults[key]==="number"){
   if(typeof value!=="number"||!Number.isFinite(value)){errors.push(`Parameter ${key} must be a finite number.`);continue;}
   const limit=definition.limits[key];if(limit&&(value<limit.min||value>limit.max))errors.push(`Parameter ${key} must be between ${limit.min} and ${limit.max}.`);
  }else if(typeof value!==typeof definition.defaults[key])errors.push(`Parameter ${key} has the wrong type.`);
 }
 for(const key of Object.keys(definition.defaults))if(!(key in effect.params))errors.push(`Missing parameter: ${key}`);
 return errors;
}
