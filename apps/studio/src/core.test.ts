import {describe,expect,it} from "vitest";
import {parseProject,serializeProject,validateProject,type KcutProject} from "@kyro-cut/project-model";
import {evaluateProperty,upsertKeyframe} from "@kyro-cut/property-system";
import {clampFrame,frameToSeconds,secondsToFrame} from "@kyro-cut/timebase";

const project:KcutProject={format:"kyro-cut",version:1,id:"p1",name:"Test",createdAt:"2026-01-01T00:00:00.000Z",updatedAt:"2026-01-01T00:00:00.000Z",activeCompositionId:"c1",compositions:[{id:"c1",name:"Main",width:1920,height:1080,frameRate:24,durationFrames:240,background:"#000000",layers:[]}],metadata:{colorSpace:"srgb"}};

describe("portable project format",()=>{
 it("round trips a valid project",()=>expect(parseProject(serializeProject(project))).toEqual(project));
 it("rejects unsupported formats",()=>expect(validateProject({...project,format:"other"}).some(i=>i.path==="format")).toBe(true));
 it("rejects an active composition that does not exist",()=>expect(validateProject({...project,activeCompositionId:"missing"}).some(i=>i.path==="activeCompositionId")).toBe(true));
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
 it("replaces duplicate-frame keys",()=>expect(upsertKeyframe(property,{frame:10,value:55,interpolation:"linear"}).keyframes.filter(k=>k.frame===10)).toHaveLength(1));
});
