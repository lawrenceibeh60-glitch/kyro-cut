export type PortValueType="image"|"mask"|"number"|"color"|"any";
export interface NodePort{id:string;label:string;type:PortValueType;required?:boolean}
export interface NodeDefinition{id:string;label:string;category:"input"|"effect"|"composite"|"output";inputs:NodePort[];outputs:NodePort[]}
export interface NodeInstance{id:string;type:string;params:Record<string,unknown>}
export interface NodeConnection{id:string;fromNodeId:string;fromPortId:string;toNodeId:string;toPortId:string}
export interface NodeGraph{nodes:NodeInstance[];connections:NodeConnection[]}
export interface NodeGraphIssue{path:string;message:string}
export const NODE_REGISTRY:Record<string,NodeDefinition>={
 source:{id:"source",label:"Source",category:"input",inputs:[],outputs:[{id:"image",label:"Image",type:"image"}]},
 blur:{id:"blur",label:"Blur",category:"effect",inputs:[{id:"image",label:"Image",type:"image",required:true},{id:"radius",label:"Radius",type:"number"}],outputs:[{id:"image",label:"Image",type:"image"}]},
 glow:{id:"glow",label:"Glow",category:"effect",inputs:[{id:"image",label:"Image",type:"image",required:true},{id:"intensity",label:"Intensity",type:"number"}],outputs:[{id:"image",label:"Image",type:"image"}]},
 mask:{id:"mask",label:"Mask",category:"effect",inputs:[{id:"image",label:"Image",type:"image",required:true},{id:"matte",label:"Matte",type:"mask",required:true}],outputs:[{id:"image",label:"Image",type:"image"}]},
 composite:{id:"composite",label:"Composite",category:"composite",inputs:[{id:"background",label:"Background",type:"image",required:true},{id:"foreground",label:"Foreground",type:"image",required:true}],outputs:[{id:"image",label:"Image",type:"image"}]},
 output:{id:"output",label:"Output",category:"output",inputs:[{id:"image",label:"Image",type:"image",required:true}],outputs:[]}
};
export function validateNodeGraph(graph:NodeGraph):NodeGraphIssue[]{
 const issues:NodeGraphIssue[]=[];const nodes=new Map<string,NodeInstance>();
 graph.nodes.forEach((node,i)=>{if(!node.id||nodes.has(node.id))issues.push({path:`nodes[${i}].id`,message:"Node ids must be present and unique."});nodes.set(node.id,node);if(!NODE_REGISTRY[node.type])issues.push({path:`nodes[${i}].type`,message:`Unknown node type "${node.type}".`})});
 const connectedInputs=new Set<string>();
 graph.connections.forEach((connection,i)=>{
  const path=`connections[${i}]`;const from=nodes.get(connection.fromNodeId),to=nodes.get(connection.toNodeId);
  if(!from)issues.push({path:path+".fromNodeId",message:"Source node does not exist."});
  if(!to)issues.push({path:path+".toNodeId",message:"Destination node does not exist."});
  const fromDef=from?NODE_REGISTRY[from.type]:undefined,toDef=to?NODE_REGISTRY[to.type]:undefined;
  const output=fromDef?.outputs.find(port=>port.id===connection.fromPortId),input=toDef?.inputs.find(port=>port.id===connection.toPortId);
  if(fromDef&&!output)issues.push({path:path+".fromPortId",message:"Source output port does not exist."});
  if(toDef&&!input)issues.push({path:path+".toPortId",message:"Destination input port does not exist."});
  if(output&&input&&output.type!=="any"&&input.type!=="any"&&output.type!==input.type)issues.push({path,message:`Port type mismatch: ${output.type} cannot connect to ${input.type}.`});
  const key=connection.toNodeId+":"+connection.toPortId;if(connectedInputs.has(key))issues.push({path,message:"An input port may have only one incoming connection."});connectedInputs.add(key);
 });
 graph.nodes.forEach((node,i)=>{const definition=NODE_REGISTRY[node.type];if(!definition)return;for(const port of definition.inputs){if(port.required&&!connectedInputs.has(node.id+":"+port.id))issues.push({path:`nodes[${i}].inputs.${port.id}`,message:"Required input is not connected."})}});
 try{sortNodeGraph(graph)}catch(error){issues.push({path:"connections",message:error instanceof Error?error.message:"Node graph contains a cycle."})}
 return issues;
}
export function sortNodeGraph(graph:NodeGraph):NodeInstance[]{
 const nodes=new Map(graph.nodes.map(node=>[node.id,node]));if(nodes.size!==graph.nodes.length)throw new Error("Node graph contains duplicate node ids.");
 const indegree=new Map<string,number>();const outgoing=new Map<string,string[]>();
 for(const id of nodes.keys()){indegree.set(id,0);outgoing.set(id,[])}
 for(const c of graph.connections){if(!nodes.has(c.fromNodeId)||!nodes.has(c.toNodeId))throw new Error("Node graph references a missing node.");indegree.set(c.toNodeId,(indegree.get(c.toNodeId)??0)+1);outgoing.get(c.fromNodeId)!.push(c.toNodeId)}
 const ready=[...nodes.keys()].filter(id=>indegree.get(id)===0).sort();const ordered:NodeInstance[]=[];
 while(ready.length){const id=ready.shift()!;ordered.push(nodes.get(id)!);for(const next of outgoing.get(id)!.sort()){const degree=(indegree.get(next)??0)-1;indegree.set(next,degree);if(degree===0){ready.push(next);ready.sort()}}}
 if(ordered.length!==nodes.size)throw new Error("Node graph contains a dependency cycle.");return ordered;
}
