import { RefObject, useCallback, useEffect, useRef, useState, useContext, MutableRefObject } from "react";
import { ParentFocusContext } from "./lib";

export class FocusNode {
  constructor(render: ()=>void){
    this.render = render;
  }
  children: FocusNode[] = [];
  parent?: FocusNode;
  index: number = 0;
  render: ()=>void;
  hidden = false;
   get_next(): FocusNode | undefined {
    if (this.children.length > 0) {
      return this.children[0];
    }
    if (this.parent) {
      const nextSibling = this.parent.children[this.index + 1];
      if (nextSibling) {
        return nextSibling;
      }
    }
    let currentNode: FocusNode | undefined = this;
    while (currentNode.parent) {
      const nextSibling = currentNode.parent.children[currentNode.index + 1];
      if (nextSibling) {
        return nextSibling;
      }
      currentNode = currentNode.parent;
    }
    return undefined;
  }
  get_prev(): FocusNode | undefined {
    if (this.parent) {
      const prevSibling = this.parent.children[this.index - 1];
      if (prevSibling) {
        let currentNode: FocusNode = prevSibling;
        while (currentNode.children.length > 0) {
          currentNode = currentNode.children[currentNode.children.length - 1];
        }
        return currentNode;
      }
    }
    return this.parent;
  }
  insert(render: ()=>void): FocusNode{
    let adding = new FocusNode(render);
    adding.parent = this;
    adding.index = this.children.length;
    this.children.push(adding);
    return adding;
  }
  private to_string_helper(current: FocusNode): string{
    let ret: string;
    if (this === current) ret = "!";
    else ret = this.index.toString();
    if (this.children.length !== 0) {
      ret += "{";
      this.children.forEach((child)=>{ret+=child.to_string_helper(current)});
      ret += "}";
    }
    return ret;
  }
  to_string(): string{
    let looking_at = this.parent;
    if (looking_at === undefined) return this.to_string_helper(this);
    while (looking_at.parent) looking_at = looking_at.parent;
    return looking_at.to_string_helper(this);
  }
}

const no_focus = new FocusNode(()=>{});

export function useFocus(override: boolean, focus_root: FocusRoot): [MutableRefObject<FocusNode>, RefObject<FocusNode>] {
  const f = useRef<FocusNode>(no_focus);
  const [updating, updateState] = useState({});
  const parent_focus = useContext(ParentFocusContext);
  const update = useCallback(() => {
    updateState({})
  }, []);
  useEffect(()=>{
    f.current = focus_root.setup_focus(parent_focus.current, update);
    if (parent_focus.current) parent_focus.current.hidden = override;
    console.log("mount",f.current.to_string());
    //updating = -1;
    return ()=>{
      console.log("unmount",f.current.to_string());
      if (f.current) focus_root.remove_focus(f.current);
      if (parent_focus.current) parent_focus.current.hidden = override;
      f.current = no_focus;
      //updating = -1;
    }
  }, [])
  useEffect(()=>{
    console.log("updating", f.current.to_string());
  },[updating]);
  return [f, parent_focus];
}

export class FocusRoot{
  private focused?: FocusNode;
  private focus_on_inserted = false;
  go_right(recursive = true): void {
    if (!this.focused) return;
    this.focused.render();
    const new_focus = this.focused.get_next();
    if (new_focus === undefined) return;
    this.focused = new_focus;
    if (recursive && this.focused.hidden) return this.go_right();
    this.focused.render();
  }
  go_left(recursive = true): void {
    if (!this.focused) return;
    this.focused.render();
    const new_focus = this.focused.get_prev();
    if (new_focus === undefined) return;
    this.focused = new_focus;
    if (recursive && this.focused.hidden) return this.go_left();
    this.focused.render();
  }
  set_focused(to: FocusNode|null|undefined){
    if (to){
      this.focused?.render();
      this.focused = to;
      this.focused.render();
    }
    else {
      this.focused = undefined;
    }
  }
  get_focused(){
    return this.focused;
  };
  setup_focus(prev: FocusNode|null, render: ()=>void){
    if (prev === null) {
      this.focused = new FocusNode(render)
      return this.focused;
    }
    if (this.focus_on_inserted){
      this.focused = prev.insert(render);
      this.focus_on_inserted = false;
      return this.focused;
    }
    return prev.insert(render);
  };
  remove_focus(to_remove: FocusNode){
    if (to_remove.parent === undefined) {
      this.focused = undefined;
      return;
    }
    if (this.focused === to_remove){
      this.focused = to_remove.get_prev();
    }
    to_remove.parent.children.splice(to_remove.index,1);
    for (let i = to_remove.index; i < to_remove.parent.children.length; i++) {
      to_remove.parent.children[i].index -= 1;
    }
    to_remove.index = 0;
    to_remove.parent = undefined;
  };
  focus_newest(){
    this.focus_on_inserted = true;
  }
}
