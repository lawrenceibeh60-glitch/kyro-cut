import{describe,expect,it}from"vitest";
import{applyColorGrade,computeColorHistogram,DEFAULT_COLOR_GRADE,validateColorGrade}from"@kyro-cut/color-engine";
describe("color grading",()=>{
 it("leaves neutral input unchanged with default controls",()=>expect(applyColorGrade([.5,.5,.5],{...DEFAULT_COLOR_GRADE})).toEqual([.5,.5,.5]));
 it("raises brightness when exposure increases",()=>expect(applyColorGrade([.25,.25,.25],{...DEFAULT_COLOR_GRADE,exposureEV:1})[0]).toBeGreaterThan(.25));
 it("rejects invalid grade ranges",()=>expect(validateColorGrade({...DEFAULT_COLOR_GRADE,gamma:0})).toContain("gamma must be between 0.1 and 4."));
 it("counts RGB and luma histogram samples",()=>{const histogram=computeColorHistogram(new Uint8ClampedArray([255,0,0,255,0,255,0,255]));expect(histogram.sampleCount).toBe(2);expect(histogram.red.reduce((a,b)=>a+b,0)).toBe(2);expect(histogram.luma.reduce((a,b)=>a+b,0)).toBe(2)});
});
