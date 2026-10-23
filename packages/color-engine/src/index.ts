export interface ColorGrade{exposureEV:number;contrast:number;saturation:number;temperature:number;tint:number;gamma:number}
export const DEFAULT_COLOR_GRADE:Readonly<ColorGrade>={exposureEV:0,contrast:1,saturation:1,temperature:0,tint:0,gamma:1};
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const toLinear=(v:number)=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);
const toSrgb=(v:number)=>v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055;
export function validateColorGrade(grade:ColorGrade):string[]{
 const errors:string[]=[];for(const key of ["exposureEV","contrast","saturation","temperature","tint","gamma"] as const)if(!Number.isFinite(grade[key]))errors.push(`${key} must be finite.`);
 if(grade.exposureEV< -10||grade.exposureEV>10)errors.push("exposureEV must be between -10 and 10.");
 if(grade.contrast<0||grade.contrast>4)errors.push("contrast must be between 0 and 4.");
 if(grade.saturation<0||grade.saturation>3)errors.push("saturation must be between 0 and 3.");
 if(grade.temperature< -1||grade.temperature>1)errors.push("temperature must be between -1 and 1.");
 if(grade.tint< -1||grade.tint>1)errors.push("tint must be between -1 and 1.");
 if(grade.gamma<.1||grade.gamma>4)errors.push("gamma must be between 0.1 and 4.");
 return errors;
}
export function applyColorGrade(rgb:readonly[number,number,number],grade:ColorGrade):[number,number,number]{
 const errors=validateColorGrade(grade);if(errors.length)throw new RangeError(errors.join(" "));
 if(rgb.some(channel=>!Number.isFinite(channel)))throw new RangeError("RGB channels must be finite.");
 let[r,g,b]=rgb.map(channel=>toLinear(clamp(channel))) as [number,number,number];
 const exposure=Math.pow(2,grade.exposureEV);r*=exposure;g*=exposure;b*=exposure;
 r=(r-.18)*grade.contrast+.18;g=(g-.18)*grade.contrast+.18;b=(b-.18)*grade.contrast+.18;
 const luma=.2126*r+.7152*g+.0722*b;r=luma+(r-luma)*grade.saturation;g=luma+(g-luma)*grade.saturation;b=luma+(b-luma)*grade.saturation;
 r*=1+grade.temperature*.16;b*=1-grade.temperature*.16;g*=1+grade.tint*.12;r*=1-grade.tint*.06;b*=1-grade.tint*.06;
 r=Math.pow(Math.max(0,r),1/grade.gamma);g=Math.pow(Math.max(0,g),1/grade.gamma);b=Math.pow(Math.max(0,b),1/grade.gamma);
 return[r,g,b].map(channel=>clamp(toSrgb(clamp(channel)))) as [number,number,number];
}
export interface ColorHistogram{red:number[];green:number[];blue:number[];luma:number[];sampleCount:number}
export function computeColorHistogram(rgba:Uint8Array|Uint8ClampedArray,bins=256):ColorHistogram{
 if(!Number.isInteger(bins)||bins<2||bins>1024)throw new RangeError("Histogram bins must be an integer between 2 and 1024.");
 if(rgba.length%4!==0)throw new RangeError("RGBA pixel data length must be divisible by four.");
 const red=Array(bins).fill(0) as number[],green=Array(bins).fill(0) as number[],blue=Array(bins).fill(0) as number[],luma=Array(bins).fill(0) as number[];
 for(let i=0;i<rgba.length;i+=4){const r=rgba[i]/255,g=rgba[i+1]/255,b=rgba[i+2]/255;red[Math.min(bins-1,Math.floor(r*(bins-1)))]++;green[Math.min(bins-1,Math.floor(g*(bins-1)))]++;blue[Math.min(bins-1,Math.floor(b*(bins-1)))]++;luma[Math.min(bins-1,Math.floor((.2126*r+.7152*g+.0722*b)*(bins-1)))]++}
 return{red,green,blue,luma,sampleCount:rgba.length/4};
}
