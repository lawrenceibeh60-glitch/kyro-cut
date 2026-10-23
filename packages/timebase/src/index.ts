export type Frame=number&{readonly __frame:unique symbol};
export function frame(value:number):Frame{if(!Number.isSafeInteger(value))throw new RangeError("Frame must be a safe integer.");return value as Frame}
export function secondsToFrame(seconds:number,fps:number):Frame{if(!Number.isFinite(seconds)||seconds<0)throw new RangeError("Seconds must be finite and non-negative.");if(!Number.isFinite(fps)||fps<=0)throw new RangeError("FPS must be positive.");return frame(Math.round(seconds*fps))}
export function frameToSeconds(value:Frame|number,fps:number):number{if(!Number.isFinite(fps)||fps<=0)throw new RangeError("FPS must be positive.");return value/fps}
export function clampFrame(value:number,durationFrames:number):Frame{if(!Number.isInteger(durationFrames)||durationFrames<1)throw new RangeError("Duration must be at least one frame.");return frame(Math.max(0,Math.min(durationFrames-1,Math.round(value))))}
