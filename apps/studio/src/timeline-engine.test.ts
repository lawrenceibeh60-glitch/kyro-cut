import{describe,expect,it}from"vitest";
import{rippleDelete,snapFrame,splitClip,trimClipLeft,trimClipRight,type TimelineClip,type TimelineTrack}from"@kyro-cut/timeline-engine";
const clip:TimelineClip={id:"a",trackId:"v1",kind:"video",startFrame:10,sourceInFrame:20,durationFrames:40,playbackRate:1};
describe("timeline editing primitives",()=>{
 it("splits clips while preserving source continuity",()=>{const[left,right]=splitClip(clip,25,"b");expect(left.durationFrames).toBe(15);expect(right.startFrame).toBe(25);expect(right.sourceInFrame).toBe(35);expect(right.durationFrames).toBe(25)});
 it("trims the left edge and advances source in-point",()=>{const trimmed=trimClipLeft(clip,18);expect(trimmed.startFrame).toBe(18);expect(trimmed.sourceInFrame).toBe(28);expect(trimmed.durationFrames).toBe(32)});
 it("trims the right edge without changing source in-point",()=>{expect(trimClipRight(clip,12)).toMatchObject({sourceInFrame:20,durationFrames:12})});
 it("ripple deletes a clip and shifts later clips",()=>{const track:TimelineTrack={id:"v1",name:"Video 1",kind:"video",locked:false,muted:false,clips:[clip,{...clip,id:"b",startFrame:50}]};const next=rippleDelete(track,"a");expect(next.clips).toHaveLength(1);expect(next.clips[0].startFrame).toBe(10)});
 it("snaps only inside the configured frame threshold",()=>{expect(snapFrame(19,[0,20,40],2)).toBe(20);expect(snapFrame(25,[20],2)).toBe(25)});
});
