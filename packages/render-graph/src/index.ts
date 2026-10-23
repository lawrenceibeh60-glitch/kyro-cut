export interface RenderNode{ id:string; type:string; inputs:Record<string,string>; params?:Record<string,unknown> }
export interface RenderGraph{ nodes:RenderNode[] }
export interface GraphIssue{nodeId:string;message:string}
export function validateRenderGraph(graph:RenderGraph):GraphIssue[]{
 const issues:GraphIssue[]=[];const ids=new Set<string>();
 for(const node of graph.nodes){if(!node.id||ids.has(node.id))issues.push({nodeId:node.id,message:"Node ids must be present and unique."});ids.add(node.id)}
 for(const node of graph.nodes){for(const[sourcePort,sourceId]of Object.entries(node.inputs)){if(!ids.has(sourceId))issues.push({nodeId:node.id,message:`Input "${sourcePort}" references missing node "${sourceId}".`})}}
 try{topologicalOrder(graph)}catch(error){issues.push({nodeId:"",message:error instanceof Error?error.message:"Render graph contains a cycle."})}
 return issues;
}
export function topologicalOrder(graph:RenderGraph):RenderNode[]{
 const byId=new Map<string,RenderNode>();
 for(const node of graph.nodes){if(byId.has(node.id))throw new Error(`Duplicate render node id: ${node.id}`);byId.set(node.id,node)}
 const indegree=new Map<string,number>();const outgoing=new Map<string,string[]>();
 for(const id of byId.keys()){indegree.set(id,0);outgoing.set(id,[])}
 for(const node of graph.nodes){for(const sourceId of Object.values(node.inputs)){if(!byId.has(sourceId))throw new Error(`Render node "${node.id}" references missing input node "${sourceId}".`);indegree.set(node.id,(indegree.get(node.id)??0)+1);outgoing.get(sourceId)!.push(node.id)}}
 const ready=[...byId.keys()].filter(id=>indegree.get(id)===0).sort();const ordered:RenderNode[]=[];
 while(ready.length){const id=ready.shift()!;ordered.push(byId.get(id)!);for(const next of outgoing.get(id)!.sort()){const degree=(indegree.get(next)??0)-1;indegree.set(next,degree);if(degree===0){ready.push(next);ready.sort()}}}
 if(ordered.length!==byId.size)throw new Error("Render graph contains a dependency cycle.");
 return ordered;
}
