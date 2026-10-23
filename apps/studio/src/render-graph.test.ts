import{describe,expect,it}from"vitest";
import{topologicalOrder,validateRenderGraph,type RenderGraph}from"@kyro-cut/render-graph";
const graph:RenderGraph={nodes:[{id:"output",type:"output",inputs:{image:"grade"}},{id:"grade",type:"grade",inputs:{image:"source"}},{id:"source",type:"source",inputs:{}}]};
describe("render dependency graph",()=>{
 it("sorts dependencies before consumers deterministically",()=>expect(topologicalOrder(graph).map(n=>n.id)).toEqual(["source","grade","output"]));
 it("rejects references to missing nodes",()=>expect(validateRenderGraph({nodes:[{id:"a",type:"effect",inputs:{image:"missing"}}]}).some(i=>i.message.includes("missing node"))).toBe(true));
 it("detects cycles",()=>expect(validateRenderGraph({nodes:[{id:"a",type:"effect",inputs:{image:"b"}},{id:"b",type:"effect",inputs:{image:"a"}}]}).some(i=>i.message.includes("cycle"))).toBe(true));
});
