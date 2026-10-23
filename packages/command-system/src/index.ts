export interface EditorCommand<S>{readonly label:string;execute(state:S):S;undo(state:S):S}
export class CommandHistory<S>{
 private undoStack:Array<{command:EditorCommand<S>;before:S}>=[];private redoStack:Array<{command:EditorCommand<S>;before:S}>=[];
 constructor(private state:S,private readonly onChange?:(state:S)=>void){}
 get current():S{return this.state} get canUndo():boolean{return this.undoStack.length>0} get canRedo():boolean{return this.redoStack.length>0}
 execute(command:EditorCommand<S>):S{const before=this.state;const next=command.execute(before);if(next===undefined)throw new Error(`Command "${command.label}" returned undefined state.`);this.undoStack.push({command,before});this.redoStack=[];this.state=next;this.onChange?.(next);return next}
 undo():S{const entry=this.undoStack.pop();if(!entry)return this.state;this.state=entry.command.undo(this.state);this.redoStack.push(entry);this.onChange?.(this.state);return this.state}
 redo():S{const entry=this.redoStack.pop();if(!entry)return this.state;const before=this.state;this.state=entry.command.execute(this.state);this.undoStack.push({command:entry.command,before});this.onChange?.(this.state);return this.state}
 clear():void{this.undoStack=[];this.redoStack=[]}
}
