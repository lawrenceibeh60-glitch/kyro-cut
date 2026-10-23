import{describe,expect,it}from"vitest";
import{sortNodeGraph,validateNodeGraph,type NodeGraph}from"@kyro-cut/node-engine";
const graph:NodeGraph={nodes:[{id:"out",type:"output",params:{}},{id:"blur",type:"blur",params:{radius:8}},{id:"src",type:"source",params:{}}],connections:[{id:"c2",fromNodeId:"blur",fromPortId:"image",toNodeId:"out",toPortId:"image"},{id:"c1",fromNodeId:"src",fromPortId:"image",toNodeId:"blur",toPortId:"image"}]};
describe("typed node graph",()=>{
 it("orders nodes from source to output",()=>expect(sortNodeGraph(graph).map(node=>node.id)).toEqual(["src","blur","out"]));
 it("rejects incompatible port types",()=>{const invalid:NodeGraph={nodes:[{id:"src",type:"source",params:{}},{id:"mask",type:"mask",params:{}}],connections:[{id:"c",fromNodeId:"src",fromPortId:"image",toNodeId:"mask",toPortId:"matte"}]};expect(validateNodeGraph(invalid).some(issue=>issue.message.includes("Port type mismatch"))).toBe(true)});
 it("detects cycles",()=>{const cyclic:NodeGraph={nodes:[{id:"a",type:"blur",params:{}},{id:"b",type:"blur",params:{}}],connections:[{id:"ab",fromNodeId:"a",fromPortId:"image",toNodeId:"b",toPortId:"image"},{id:"ba",fromNodeId:"b",fromPortId:"image",toNodeId:"a",toPortId:"image"}]};expect(validateNodeGraph(cyclic).some(issue=>issue.message.includes("cycle"))).toBe(true)});
});
