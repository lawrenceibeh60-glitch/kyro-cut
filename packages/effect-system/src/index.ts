import type {EffectType,LayerEffect} from "@kyro-cut/project-model";
export interface EffectDefinition{type:EffectType;label:string;category:"anime"|"lighting"|"motion";description:string;defaults:Record<string,number|boolean|string>}
export const EFFECT_DEFINITIONS:Record<EffectType,EffectDefinition>={
 "glow":{type:"glow",label:"Glow",category:"lighting",description:"Soft light bloom around the layer.",defaults:{intensity:28}},
 "speed-lines":{type:"speed-lines",label:"Speed Lines",category:"anime",description:"Radial action lines around the subject.",defaults:{count:18,length:90,rotation:0}},
 "impact-ring":{type:"impact-ring",label:"Impact Ring",category:"anime",description:"Pulsing concentric impact rings.",defaults:{radius:94,pulse:8,secondaryRadius:118}},
 "motion-trail":{type:"motion-trail",label:"Motion Trail",category:"motion",description:"Faded echoes behind the animated subject.",defaults:{samples:4,distance:12}}
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
 for(const[key,value]of Object.entries(effect.params)){if(!(key in definition.defaults))errors.push(`Unknown parameter: ${key}`);if(typeof value==="number"&&!Number.isFinite(value))errors.push(`Parameter ${key} must be finite.`);}
 return errors;
}
