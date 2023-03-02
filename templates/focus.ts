import { RefObject, SetStateAction, useCallback, useEffect, useRef, useState, useContext } from "react";
import { FocusContext, update_visual } from "./lib";

export class FocusTree {
  constructor(val: number){
    this.val = val;
    this.children = [];
    this.focusable = 1;
  }
  val: number;
  children: FocusTree[];
  focusable: number;
  add(n: number, adding: number, counter: number): [number,boolean]{
    if (counter === n && this.focusable !== 0){
      this.children.push(new FocusTree(adding))
      return [counter, true];
    }
    if (this.children.length === 0){
      return [this.focusable, false];
    }
    let sum = this.focusable;
    for (let child of this.children){
      let [count, res] = child.add(n, adding, counter + sum);
      if (res === true) return [count, true];
      sum += count;
    }
    return [sum, false];
  }
  get_index(n: number, counter: number): [number, boolean]{
    if (n === this.val){
      if (this.focusable === 0) return [-1, true]
      return [counter, true];
    }
    if (this.children.length === 0){
      return [this.focusable, false];
    }
    let sum = this.focusable;
    for (let child of this.children){
      let [count, res] = child.get_index(n, counter + sum);
      if (res) return [count, true];
      sum += count;
    }
    return [sum, false];
  }
  get_parent_id(n: number): number{
    for (let child of this.children){
      if (child.val === n){
        return this.val;
      }
      let res = child.get_parent_id(n);
      if (res !== -1){
        return res;
      }
    }
    return -1;
  }
  set_parent_focus(n: number, set_to: number): void {
    for (let child of this.children){
      if (child.val === n){
        this.focusable = set_to;
        return;
      }
      child.set_parent_focus(n, set_to);
    }
  }
  num_children(): number{
    if (this.children.length === 0 && this.val !== -1 && this.focusable !== 0){
      return 1;
    }
    let sum = 0;
    for (let child of this.children){
      let count = child.num_children();
      sum += count;
    }
    if (this.val !== -1 && this.focusable !== 0){
      return sum + 1;
    }
    else {
      return sum;
    }
  }
  remove(n: number): number{
    if (this.children.length === 0){
      return -1;
    }
    let ret = -1;
    for (let i = 0; i < this.children.length; i++){
      if (this.children[i].val === n){
        this.children.splice(i,1);
        return n;
      }
    }
    for (let child of this.children){
      let res = child.remove(n);
      if (res != -1) ret = res;
    }
    return ret;
  }
  toString(): string{
    if (this.children.length === 0){
      if (this.focusable === 0)
        return "_ ";
      return this.val.toString() + " ";
    }
    let ret = "";
    if (this.focusable === 0)
      ret = "_["
    else
      ret = this.val.toString() + "["
    for (let child of this.children){
      ret += child.toString();
    }
    return ret + "]";
  }
  getMax(): number{
    if (this.children.length === 0){
      return this.val;
    }
    let max = -1;
    for (let child of this.children){
      let child_max = child.getMax();
      if (child_max > max){
        max = child_max;
      }
    }
    return max;
  }

}

let update_table: (()=>void)[] = [];
let hidden: boolean[] = [];
let updating = -1;

export function useFocus(override: boolean, focus_root: FocusRoot): [number, number] {
  const f = useRef(0);
  const [focus, setFocus] = useState(-2);
  const [, updateState] = useState({});
  const [, parent_focus] = useContext(FocusContext);
  const update = useCallback(() => {
    updating = focus;
    updateState({})
  }, []);
  useEffect(()=>{
    f.current = focus_root.setup_focus(parent_focus, false);
    setFocus(focus_root.get_focus(f.current));
    hidden[parent_focus] = override;
    updating = -1;
    return ()=>{
      focus_root.remove_focus(f.current,false);
      hidden[parent_focus] = false;
      updating = -1;
    }
  }, [])
  useEffect(()=>{
    if (updating === -1){
      const focus_tmp = focus_root.get_focus(f.current);
      setFocus(focus_tmp);
      update_table[focus_tmp] = update;
    }
  })
  return [focus, parent_focus];
}

export class FocusRoot{
  focus = new FocusTree(-1);
  rotation = 0
  temp_rotation: boolean | number = false;
  rotate = (i: number, force: boolean, recursive = true): boolean =>{
    this.temp_rotation = false;
    if (update_table[this.rotation]) update_table[this.rotation]();
    if (force){
      this.rotation = this.rotation+i;
    }
    else{
      //TODO speed this up by keeping track of num children over time (+1, -1 when adding/removing)
      const len = this.focus.num_children();
      if (len !== 0 && (this.rotation+i) >= (len)) return false;
      else if (this.rotation+i < 0) return false;
      else {
        this.rotation = (this.rotation+i);
      }
    }
    if (update_table[this.rotation]) update_table[this.rotation]();
    if (recursive && hidden[this.rotation]) return this.rotate(i,false);
    return true;
  }
  set_rotation = (n: number)=>{
    if (update_table[this.rotation]) update_table[this.rotation]();
    this.rotation = n;
    if (update_table[this.rotation]) update_table[this.rotation]();
  }
  set_temp_rotation = (n: number)=>{this.temp_rotation = n;}
  get_rotation = ()=>{
    return this.rotation;
  };
  get_focus = (n:number)=>{
    let ret = this.focus.get_index(n,-1);
    return ret[0];
  }
  setup_focus = (prev: number, override: boolean)=>{
    let rot = prev;
    if (this.temp_rotation !== false) {
        rot = this.temp_rotation as number;
    }
    const ret_id = this.focus.getMax() + 1;
    this.focus.add(Math.max(rot,-1),ret_id,-1);
    if (override) this.focus.set_parent_focus(ret_id,0);
    console.log("mount:",this.focus.toString(),rot);
    console.log("hidden",hidden);
    return ret_id;
  };
  remove_focus = (i: number, override: boolean)=>{
    if (override) this.focus.set_parent_focus(i,1);
    let ret = this.focus.remove(i);
    console.log("unmount:",this.focus.toString(),i);
    return ret;
  };
  peak_focus = ()=>{
    return this.focus.get_parent_id(this.focus.getMax());
  }
}
