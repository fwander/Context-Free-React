import { SetStateAction, useCallback, useEffect, useRef, useState, createContext, useContext, ComponentType, createRef, Ref } from "react";
import { AST_node, AST_root, {{start}}_node } from "./ast";
import { {{start_comp}} } from "./components";
import { FocusRoot, useFocus } from "./focus";
import { DefaultChecker, Visitor } from "./visitor";
import './lib.css'
import './select.css'


export function useFocusRef<T extends (HTMLElement)>(){
  const [focus, _] = useContext(FocusContext);
  const isFocused = focus === focus_root.current.get_rotation();
  const ref = createRef<T>();
  useEffect(()=>{
    if(isFocused){
      ref?.current?.focus();
    }
  });
  return ref;
}



// TODO put these in a better place
export class SelectInput {
  constructor(names: string[], handleSelect: (name: string)=>void, isFocused: boolean){
    this.names = names;
    this.handleSelect = handleSelect;
    this.isFocused = isFocused;
  }
  names: string[];
  handleSelect: (name: string)=>void;
  isFocused: boolean;
}

export class ListInput {
  constructor(elements: JSX.Element[], push: ()=>void, pop: ()=>void, odd: boolean){
    this.elements = elements;
    this.push = push;
    this.pop = pop;
    this.odd = odd;
  }
  elements: JSX.Element[];
  push: ()=>void;
  pop: ()=>void;
  odd: boolean;
}

export class TerminalInput{
  constructor(content: string){
    this.content = content;
  }
  content: string;
}

export class RegexInput{
  constructor(submit: (value: string)=>void, text: string, isValid: boolean){
    this.submit = submit;
    this.text = text;
    this.isValid = isValid;
  }
  submit: (value: string)=>void;
  text: string;
  isValid: boolean;
}

export class BaseComponent {
  constructor(parent: AST_node, nth: number[], setPrev?: (n: SetStateAction<number>)=>void){
    this.parent = parent;
    this.setCurrent = (n: AST_node | string)=>{
      if (nth.length===0){
        parent.child=n;
      }
      else{
        let ref = parent.child;
        let prev = ref;
        for (let i of nth.slice(0,-1)){
          prev = ref;
          ref = ref[i]
          if (ref === undefined){
            ref = [];
          }
          prev[i] = ref;
        }
        ref[nth[nth.length-1]] = n;
      }
    };
    this.setPrev = setPrev;
  }
  parent: AST_node; 
  setPrev?: (n: SetStateAction<number>)=>void;
  setCurrent: (n: AST_node | string)=>void;
  children?: React.ReactNode;
}
export class ComponentInput extends BaseComponent{
  constructor(parent: AST_node, nth: number[], current: AST_node, setPrev?: (n: SetStateAction<number>)=>void){
    super(parent, nth, setPrev);
    this.current = current;
  }
  current: AST_node;
}

//TODO extract logic
export class TextInputInput extends BaseComponent{
  constructor(parent: AST_node, nth: number[], regex: RegExp, Child: ComponentType<RegexInput>, setPrev?: (n: SetStateAction<number>)=>void){
    super(parent, nth, setPrev);
    this.regex = regex;
    this.Child = Child;
  }
  regex: RegExp;
  Child: ComponentType<RegexInput>;
}

export const TextInput: React.FC<TextInputInput> = (props) => {
  const [val, setVal] = useState('');
  let ok = val.match(props.regex);
  if (ok){
    props.setCurrent(val);
  }

  const [focus,] = useContext(FocusContext);

  function submit(value: string){
    if(value.match(props.regex)){
      props.setCurrent(value);
      update_root();
    }
    setVal(value);
  }
  return <div
    onClick={(e)=>{e.stopPropagation();focus_root.current.set_rotation(focus);}}
    onKeyDown={
      (e)=>{
        if (e.key == 'Escape' && props.setPrev){
          props.setPrev(-1);
          update_root();
        }
      }
    }>
    <props.Child {...new RegexInput(submit,val,ok!==null)}/>
    </div>
}

export class DefaultInput extends BaseComponent {
  constructor(parent: AST_node, nth: number[],content: string, Child: ComponentType<TerminalInput>, current?: AST_node){
    super(parent,nth);
    this.content = content;
    this.Child = Child;
    this.current = current;
  }
  current?: AST_node;
  content: string;
  Child: ComponentType<TerminalInput>;
}


export const Default: React.FC<DefaultInput> = (props) => {
  useEffect(()=>{ update_root(); return ()=>{update_root();} },[]);
  if (props.current){
    props.setCurrent(props.current);
  }
  else if (props.content){
    props.setCurrent(props.content);
  }
  return <props.Child {...new TerminalInput(props.content)}/>
}

//TODO extract logic
export class VariaticInput {
  constructor(getNth: (n: number)=>JSX.Element, min: number, virtical: boolean, add_selection: ()=>void, Child: ComponentType<ListInput>){
    this.min = min;
    this.getNth = getNth;
    this.virtical = virtical;
    this.add_selection = add_selection;
    this.Child = Child;
  }
  min: number;
  getNth: (n: number)=>JSX.Element;
  virtical: boolean;
  add_selection: ()=>void;
  Child: ComponentType<ListInput>;
}

export const Variatic: React.FC<VariaticInput> = (props) => { 
  const [elements, setElements] = useState<JSX.Element[]>([]);
  props.add_selection();
  function push(){
    setElements([...elements, props.getNth(elements.length)]);
    update_root();
  }
  function pop(){
    if (elements.length > props.min){
      const newElements = [...elements];
      newElements.pop();
      setElements(newElements);
      update_root();
    }
  }
  function handleKeyPress(event: React.KeyboardEvent<HTMLInputElement>){
    console.log("press",event.key);
    switch (event.key){
      case "-":
        if (event.altKey) {
          pop()
          update_root();
          if (focus !== focus_root.current.get_rotation())
            focus_root.current.rotate(-1,false);
        }
        break;
      case "=":
        if (event.altKey) {
          push();
          update_root();
        }
        break;
      default:
        return;
    }
    event.stopPropagation();
  }
  useEffect(()=>{if (props.min === 1) push();},[])
  const [focus, _] = useContext(FocusContext);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(()=>{
      if (ref)
      if((focus) === focus_root.current.get_rotation() && ref.current){
        ref.current.focus();
      }});
  return <SelectionContext.Provider value = {null}>
  <div ref={ref} tabIndex={-1} onKeyDown={handleKeyPress} onClick={(e)=>{e.stopPropagation()}}>
    <props.Child {... new ListInput(elements,push,pop,props.virtical)}/>
  </div>
  </SelectionContext.Provider>
}

class BeforeInput {
  constructor( parent: AST_node, nth: number[], looking_for: string, Child: ComponentType<SelectInput>, TerminalChild: ComponentType<TerminalInput>){
    this.parent = parent
    this.nth = nth
    this.looking_for = looking_for;
    this.Child = Child
    this.TerminalChild = TerminalChild
  }
  parent: AST_node;
  nth: number[];
  looking_for: string;
  Child: ComponentType<SelectInput>;
  TerminalChild: ComponentType<TerminalInput>;
}

export const Before: React.FC<BeforeInput> = (props) => {
  let pool = props.parent.until_me(props.parent,props.looking_for,true,false,[]);
  let names = pool.map((n)=>{let name = n.name(); return (name instanceof AST_node)? name.str() : name});
  let jsxs = pool.map((n,i)=>{return <Default {...new DefaultInput(props.parent, props.nth, names[i], props.TerminalChild, n)}/>});
  return <Choice {...new ChoiceInput((n:number)=>{},names,jsxs,props.Child)}/>
}

export function Break(props: any){
  return <div className="break"></div>
}

export function getTextWidth(text: string) : number {
    const font = "normal 14px Courier New";
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
  
    if (context){
    context.font = font || getComputedStyle(document.body).font;
    return Math.max(30,context.measureText(text).width + 5);
    }
    console.log("no context");
    return 0;
}

export class ChoiceInput {
  constructor(add_selection:(n:number)=>void, names: string[], outputs: JSX.Element[], Child: ComponentType<SelectInput>, start = -1){
    this.add_selection = add_selection;
    this.names = names;
    this.outputs = outputs;
    this.Child = Child;
    this.start = start;
  }
  add_selection:(n:number)=>void;
  names: string[];
  outputs: JSX.Element[];
  Child: ComponentType<SelectInput>;
  start: number;
}
export const Choice: React.FC<ChoiceInput> = (props) => {
  let [state, setState] = useState(props.start);
  const setPrev = useContext(SelectionContext);
  props.add_selection(state);
  const [focus, _] = useContext(FocusContext);
  //TODO add option for type checking, you can keep a list of add functions and recursively look through children for props with a setCurrent function!
  function resetState() {
    setState(-1);
    update_root();
  }
  function handleSelect(name: string) {
    if (name === '..'){
      if(setPrev) {
        setPrev(-1);
        update_root();
        focus_root.current.rotate(-1, true, false);
      }
      return;
    }
    let ind = props.names.findIndex(x => x === name);
    let force = props.outputs[ind].props.content === undefined;
    setState(ind);
    update_root();
    focus_root.current.rotate(1, force);
  }
  const isFocused = focus === focus_root.current.get_rotation();
  const ref = createRef<HTMLDivElement>();
  useEffect(()=>{
    if(isFocused){
      ref?.current?.focus();
    }
  });
  if (state > -1) {
  //TODO customized selected look
    return <SelectionContext.Provider value = {setState}>
    <div className="selected" tabIndex={-1} ref={ref}
    onClick={(e)=>{
      e.stopPropagation();
      focus_root.current.set_rotation(focus);
      if (isFocused)
        resetState();
    }}
    onKeyDown={
      (e)=>{
        if (isFocused && e.key === 'Escape'){
          resetState();
        }
      }
    }>
    {props.outputs[state]}
    </div>
    </SelectionContext.Provider>
  }
  function grabFocus(){
    focus_root.current.set_rotation(focus);
  }
  let passing_names = props.names.map((x)=>x);
  if (setPrev !== null){
    passing_names.push("..");
  }

  return <div onClick={(e)=>{e.stopPropagation(); grabFocus();}}><props.Child {...new SelectInput(passing_names,handleSelect,isFocused)}/></div>
}

export const SelectionContext = createContext<(((n: SetStateAction<number>)=>void)|null)>(null);

export class FocusableInput {
  constructor(push: boolean){
    this.push = push;
  }
  push: boolean;
  children?: React.ReactNode;
}
export const Focusable: React.FC<FocusableInput> = (props) => {
  const setPrev = useContext(SelectionContext);
  const override = setPrev? true: false;
  let [focus, parent_focus] = useFocus(override, focus_root.current);
  if (props.push){
    parent_focus = focus;
  }
  return <FocusContext.Provider value = {[focus, parent_focus]}>{props.children}</FocusContext.Provider>;
}

export const FocusContext = createContext<[number, number]>([-1,-1]);

export let update_visual = ()=>{}
export let update_root = ()=>{}
export let get_checker: ()=>Visitor<boolean> = ()=>{return new DefaultChecker();}



export let focus_root: React.MutableRefObject<FocusRoot>;
export let root: React.MutableRefObject<AST_node>;
class RootInput{
  constructor(update: (root: AST_node)=>void,checker?: Visitor<boolean>){
    this.update = update;
    this.checker = checker;
  }
  update: (root: AST_node) => void;
  checker?: Visitor<boolean>;
}
export const Root = ({update, checker} : RootInput): JSX.Element =>{
  focus_root = useRef(new FocusRoot());
  const [, updateState] = useState({});
  const lowest_focus = useRef(-1);
  root = useRef(new AST_root(undefined));
  if (checker)
    get_checker = ()=>{return checker as Visitor<boolean>;}
  update_visual = useCallback(() => {
    updateState({})
  }, []);
  update_root = useCallback(() => {
    update(root.current);
  }, []);
  let expr = root.current;
  return <div onKeyDown={(e)=>{
    if (!e.ctrlKey && !e.altKey) return;
    if(e.key === 'ArrowLeft' || e.key === 'k') {focus_root.current.rotate(-1, false);} 
    else if (e.key === 'ArrowRight' || e.key === 'j') {focus_root.current.rotate(1,false);}}}
    onClick={(e)=>{focus_root.current.set_rotation(-1); update_visual();}}
    >
  <div className="program">
<{{start_comp}} {...new ComponentInput(expr,[],new {{start}}_node(expr))}/>
</div>
  </div>;
}

