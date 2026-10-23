import{describe,expect,it}from"vitest";
import{createEffect,EFFECT_DEFINITIONS,validateEffect}from"@kyro-cut/effect-system";
describe("effect registry",()=>{
 it("creates a versioned effect with declared defaults",()=>{const effect=createEffect("speed-lines");expect(effect.version).toBe(1);expect(effect.params.count).toBe(18);expect(validateEffect(effect)).toEqual([])});
 it("rejects unknown effect parameters",()=>{const effect=createEffect("glow");expect(validateEffect({...effect,params:{...effect.params,unexpected:2}})).toContain("Unknown parameter: unexpected")});
 it("rejects out-of-range parameter values",()=>{const effect=createEffect("glow");expect(validateEffect({...effect,params:{intensity:500}})).toContain("Parameter intensity must be between 0 and 80.")});
 it("provides the core anime and lighting effects",()=>{expect(EFFECT_DEFINITIONS["impact-ring"].category).toBe("anime");expect(EFFECT_DEFINITIONS.glow.category).toBe("lighting");expect(EFFECT_DEFINITIONS["motion-trail"].category).toBe("motion")});
});
