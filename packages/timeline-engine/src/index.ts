export type TimelineMediaKind="video"|"audio"|"image"|"generated";
export interface TimelineClip{id:string;assetId?:string;trackId:string;kind:TimelineMediaKind;startFrame:number;sourceInFrame:number;durationFrames:number;playbackRate:number;muted?:boolean}
export interface TimelineTrack{id:string;name:string;kind:"video"|"audio"|"overlay";locked:boolean;muted:boolean;clips:TimelineClip[]}
export interface TimelineMarker{id:string;frame:number;label:string;color?:string}
export interface TimelineSequence{id:string;frameRate:number;durationFrames:number;tracks:TimelineTrack[];markers:TimelineMarker[]}
export function validateTimeline(sequence:TimelineSequence):string[]{
 const errors:string[]=[];
 if(!Number.isFinite(sequence.frameRate)||sequence.frameRate<=0||sequence.frameRate>240)errors.push("Frame rate must be in (0, 240].");
 if(!Number.isSafeInteger(sequence.durationFrames)||sequence.durationFrames<1)errors.push("Sequence duration must be a positive integer.");
 const ids=new Set<string>();
 for(const track of sequence.tracks){if(!track.id||ids.has(track.id))errors.push("Track ids must be present and unique.");ids.add(track.id);const clipIds=new Set<string>();for(const clip of track.clips){if(!clip.id||clipIds.has(clip.id))errors.push(`Track ${track.id}: clip ids must be present and unique.`);clipIds.add(clip.id);if(clip.trackId!==track.id)errors.push(`Clip ${clip.id}: trackId does not match its containing track.`);for(const field of ["startFrame","sourceInFrame","durationFrames"] as const)if(!Number.isSafeInteger(clip[field])||clip[field]<0)errors.push(`Clip ${clip.id}: ${field} must be a non-negative integer.`);if(clip.durationFrames<1)errors.push(`Clip ${clip.id}: duration must be at least one frame.`);if(!Number.isFinite(clip.playbackRate)||clip.playbackRate<=0)errors.push(`Clip ${clip.id}: playback rate must be positive.`);if(clip.startFrame+clip.durationFrames>sequence.durationFrames)errors.push(`Clip ${clip.id}: extends beyond sequence duration.`)}}
 for(const marker of sequence.markers)if(!Number.isSafeInteger(marker.frame)||marker.frame<0||marker.frame>=sequence.durationFrames)errors.push(`Marker ${marker.id}: frame is outside the sequence.`);
 return errors;
}
export function trimClipRight(clip:TimelineClip,newDurationFrames:number):TimelineClip{
 if(!Number.isSafeInteger(newDurationFrames)||newDurationFrames<1||newDurationFrames>clip.durationFrames)throw new RangeError("Right trim must keep at least one frame and cannot extend the clip.");
 return{...clip,durationFrames:newDurationFrames};
}
export function trimClipLeft(clip:TimelineClip,newStartFrame:number):TimelineClip{
 const end=clip.startFrame+clip.durationFrames;
 if(!Number.isSafeInteger(newStartFrame)||newStartFrame<clip.startFrame||newStartFrame>=end)throw new RangeError("Left trim must remain inside the existing clip.");
 const delta=newStartFrame-clip.startFrame;
 return{...clip,startFrame:newStartFrame,sourceInFrame:clip.sourceInFrame+Math.round(delta*clip.playbackRate),durationFrames:end-newStartFrame};
}
export function splitClip(clip:TimelineClip,atFrame:number,rightId:string):[TimelineClip,TimelineClip]{
 const offset=atFrame-clip.startFrame;
 if(!Number.isSafeInteger(atFrame)||offset<1||offset>=clip.durationFrames)throw new RangeError("Split point must be inside the clip, not on an edge.");
 if(!rightId||rightId===clip.id)throw new Error("Split requires a distinct right-hand clip id.");
 const leftDuration=offset;const sourceOffset=Math.round(leftDuration*clip.playbackRate);
 return[{...clip,durationFrames:leftDuration},{...clip,id:rightId,startFrame:atFrame,sourceInFrame:clip.sourceInFrame+sourceOffset,durationFrames:clip.durationFrames-leftDuration}];
}
export function rippleDelete(track:TimelineTrack,clipId:string):TimelineTrack{
 const target=track.clips.find(c=>c.id===clipId);if(!target)return track;
 const cutAt=target.startFrame;const cutDuration=target.durationFrames;
 return{...track,clips:track.clips.filter(c=>c.id!==clipId).map(c=>c.startFrame>=cutAt+cutDuration?{...c,startFrame:c.startFrame-cutDuration}:c)};
}
export function snapFrame(value:number,candidates:readonly number[],thresholdFrames:number):number{
 if(!Number.isFinite(value)||!Number.isFinite(thresholdFrames)||thresholdFrames<0)throw new RangeError("Snap input and threshold must be finite; threshold cannot be negative.");
 let nearest=value;let distance=Infinity;for(const candidate of candidates){if(!Number.isFinite(candidate))continue;const next=Math.abs(candidate-value);if(next<=thresholdFrames&&next<distance){nearest=candidate;distance=next}}return nearest;
}
