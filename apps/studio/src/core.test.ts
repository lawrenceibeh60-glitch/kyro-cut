import {describe,expect,it} from "vitest";
import {parseProject,serializeProject,validateProject,type KcutProject} from "@kyro-cut/project-model";
import {evaluateProperty,upsertKeyframe} from "@kyro-cut/property-system";
import {clampFrame,frameToSeconds,secondsToFrame} from "@kyro-cut/timebase";

const project:KcutProject={format:"kyro-cut",version:1,id:"p1",name:"Test",createdAt:"2026-01-01T00:00:00.000Z",updatedAt:"2026-01-01T00:00:00.000Z",activeCompositionId:"c1",compositions:[{id:"c1",name:"Main",width:1920,height:1080,frameRate:24,durationFrames:240,background:"#000000",layers:[]}],metadata:{colorSpace:"srgb"}};

describe("portable project format",()=>{
 it("round trips a valid project",()=>expect(parseProject(serializeProject(project))).toEqual(project));
 it("rejects unsupported formats",()=>expect(validateProject({...project,format:"other"}).some(i=>i.path==="format")).toBe(true));
 it("rejects unknown vector geometry",()=>{const malformed={...project,compositions:[{...project.compositions[0],layers:[{id:"shape1",name:"Shape",kind:"shape",shape:"polygon",enabled:true,color:"#fff",transform:{x:0,y:0,scaleX:1,scaleY:1,rotation:0,opacity:1},x:{id:"x",name:"X",value:0,keyframes:[]},y:{id:"y",name:"Y",value:0,keyframes:[]}} as never]}]};expect(validateProject(malformed).some(i=>i.path.endsWith("shape"))).toBe(true)});
 it("rejects an active composition that does not exist",()=>expect(validateProject({...project,activeCompositionId:"missing"}).some(i=>i.path==="activeCompositionId")).toBe(true));
 it("accepts a valid empty multitrack timeline",()=>{const withTimeline={...project,timeline:{id:"t1",frameRate:24,durationFrames:240,tracks:[{id:"v1",name:"Video 1",kind:"video",locked:false,muted:false,clips:[]},{id:"a1",name:"Audio 1",kind:"audio",locked:false,muted:false,clips:[]}],markers:[]}};expect(validateProject(withTimeline)).toEqual([])});
 it("rejects audio track gain outside the normalized range",()=>{const malformed={...project,timeline:{id:"t1",frameRate:24,durationFrames:240,tracks:[{id:"a1",name:"Audio",kind:"audio",locked:false,muted:false,gain:1.5,clips:[]}],markers:[]}};expect(validateProject(malformed).some(i=>i.path.endsWith(".gain"))).toBe(true)});
 it("rejects timeline clips referencing missing layers",()=>{const malformed={...project,timeline:{id:"t1",frameRate:24,durationFrames:240,tracks:[{id:"v1",name:"Video",kind:"video",locked:false,muted:false,clips:[{id:"clip1",layerId:"missing-layer",trackId:"v1",kind:"video",startFrame:0,sourceInFrame:0,durationFrames:240,playbackRate:1}]}],markers:[]}};expect(validateProject(malformed).some(i=>i.path.endsWith("layerId"))).toBe(true)});
 it("rejects layers with missing media references",()=>{const malformed={...project,compositions:[{...project.compositions[0],layers:[{id:"l1",name:"Image",kind:"image",assetId:"missing",enabled:true,color:"#fff",transform:{x:0,y:0,scaleX:1,scaleY:1,rotation:0,opacity:1},x:{id:"x",name:"X",value:0,keyframes:[]},y:{id:"y",name:"Y",value:0,keyframes:[]}} as never]}]};expect(validateProject(malformed).some(i=>i.path.endsWith("assetId"))).toBe(true)});
 it("rejects malformed layer keyframes",()=>{const malformed={...project,compositions:[{...project.compositions[0],layers:[{id:"l1",name:"Layer",kind:"shape",enabled:true,color:"#fff",transform:{x:0,y:0,scaleX:1,scaleY:1,rotation:0,opacity:1},x:{id:"x",name:"X",value:0,keyframes:[{frame:-1,value:2,interpolation:"linear"}]},y:{id:"y",name:"Y",value:0,keyframes:[]}} as never]}]};expect(validateProject(malformed).some(i=>i.path.includes("keyframes"))).toBe(true)});
});
describe("frame timebase",()=>{
 it("converts seconds using integer frames",()=>expect(secondsToFrame(1.5,24)).toBe(36));
 it("converts frames to seconds",()=>expect(frameToSeconds(36,24)).toBe(1.5));
 it("clamps to composition boundaries",()=>{expect(clampFrame(-2,100)).toBe(0);expect(clampFrame(200,100)).toBe(99)});
});
describe("animated properties",()=>{
 const property={id:"x",name:"X",value:0,keyframes:[{frame:10,value:100,interpolation:"linear" as const},{frame:0,value:0,interpolation:"linear" as const}]};
 it("evaluates linear interpolation deterministically even with unsorted keys",()=>expect(evaluateProperty(property,5)).toBe(50));
 it("holds the left key for hold interpolation",()=>expect(evaluateProperty({...property,keyframes:[{frame:0,value:4,interpolation:"hold" as const},{frame:10,value:20,interpolation:"linear" as const}]},5)).toBe(4));
 it("applies Bézier easing between keyframes",()=>expect(evaluateProperty({...property,keyframes:[{frame:0,value:0,interpolation:"bezier" as const},{frame:10,value:100,interpolation:"linear" as const}]},5)).toBeGreaterThan(50));
 it("replaces duplicate-frame keys",()=>expect(upsertKeyframe(property,{frame:10,value:55,interpolation:"linear"}).keyframes.filter(k=>k.frame===10)).toHaveLength(1));
});
