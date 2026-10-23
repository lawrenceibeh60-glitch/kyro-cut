import {describe,expect,it} from "vitest";
import {CommandHistory,type EditorCommand} from "@kyro-cut/command-system";
type State={value:number};
const add=(amount:number):EditorCommand<State>=>({label:`add ${amount}`,execute:s=>({value:s.value+amount}),undo:s=>({value:s.value-amount})});
describe("reversible command history",()=>{
 it("executes, undoes and redoes state changes",()=>{const history=new CommandHistory<State>({value:2});history.execute(add(3));expect(history.current.value).toBe(5);expect(history.canUndo).toBe(true);history.undo();expect(history.current.value).toBe(2);expect(history.canRedo).toBe(true);history.redo();expect(history.current.value).toBe(5)});
 it("clears redo history after a new command",()=>{const history=new CommandHistory<State>({value:0});history.execute(add(1));history.undo();history.execute(add(4));expect(history.current.value).toBe(4);expect(history.canRedo).toBe(false)});
});
