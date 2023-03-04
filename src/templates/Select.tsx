import { useState, createRef, useEffect } from "react";
import './select.css'
import {getTextWidth, SelectInput } from "./lib";

const MAX_LEN = 20;

const Select: React.FC<SelectInput> = (props) => {
  function handleText(text: string){
    setTentative(0);
    setText(text);
  }
  function handleKeyPress(event: React.KeyboardEvent<HTMLInputElement>){
    switch (event.key){
        case "n":
            if (event.altKey){
              if (tentative === -1){
                  setTentative(0);
                  break;
              }
              setTentative(Math.min(names.length-1,tentative+1));
            }
            break;
        case "p":
            if (event.altKey){
              setTentative(Math.max(-1,tentative-1));
            }
            break;
        case "ArrowDown":
            if (tentative === -1){
                setTentative(0);
                break;
            }
            setTentative(Math.min(names.length-1,tentative+1));
            break;
        case "ArrowUp":
            setTentative(Math.max(-1,tentative-1));
            break;
        case "Escape":
            setTentative(-1);
            break;
        case "q":
            if (event.altKey){
              props.handleSelect("..");
            }
            break;
        case "Enter":
            props.handleSelect(names[tentative]);
            break;
        default:
            return;
    }
    event.stopPropagation();
  }
  const [tentative, setTentative] = useState(-1);
  const [text, setText] = useState("");
  let i = 0;
  let width = getTextWidth(text.toLowerCase());

  let names: string[] = [];

  //TODO @fix select inside of list won't have correct selection_state (done, not tested)

  const ref = createRef<HTMLInputElement>();
  useEffect(()=>{
    if(props.isFocused()){
      ref?.current?.focus();
    }
  });


  if (tentative != -1){
      names = getNames(props.names, text);
  }
  return <div className="select-container" style={ {width: width} }>
    <input className="select-input" onClick={()=>{setTentative(0)}} style={ {width: width} } ref={ref} defaultValue={text} onChange={(e)=>{handleText(e.target.value)}} onKeyDown={handleKeyPress}/>
    <div className="select-options">
    {
      (props.isFocused())?
        names.map((name) => 
        <option className="select-option" style={((i===tentative)? {backgroundColor: "rgb(221, 187, 229)"} : {backgroundColor: ""})} onClick={
        (e)=> {
          e.stopPropagation();
          props.handleSelect(names[tentative]);
        } } onMouseEnter={(e : React.MouseEvent<HTMLElement>)=>{setTentative(parseInt((e.target as HTMLOptionElement).value));}} key={i} value={i++} >{name}</option>
      ): null}
    </div>
  </div>
}

export default Select;

  /*
    case (SelectType.MENU):
      return <div style = { {display: "flex", flexDirection: "row"} }>
        <div className="select-container" style={ {width: "fit-content"} } onClick={(e)=>{e.stopPropagation();focus_root.current.set_rotation(focus);update_visual();}} onKeyDown={handleKeyPress} ref={ref}>
          <div className="select-options">
          {
          props.names.map((name) => 
              <option className="select-option" style={((i===index)? {backgroundColor: "rgb(221, 187, 229)"} : {backgroundColor: ""})} onClick={
              (e)=>{
              e.stopPropagation();
              handleSelect(props.names[tentative]);
              focus_root.current.set_rotation(focus);
              console.log(focus);
              }} onMouseEnter={(e : React.MouseEvent<HTMLElement>)=>{setTentative(parseInt((e.target as HTMLOptionElement).value));}} key={i} value={i++} >{name}</option>
          )}
          </div>
        </div>
        {props.outputs[index]}
      </div>
      */


function getNames(inputNames: string[], currentText: string): string[]{
  let filters: number[] = inputNames.map((name: string)=>fuzzy(name,currentText));
  let names : [string,number][] = inputNames.map(
  (name: string, i: number)=>{
    const adding: [string, number] = [name, filters[i]];
    return adding;
  })
  .filter((e)=>e[1]!==0)
  .sort((a:[string,number],b:[string,number])=>{return b[1] - a[1]});
  if(names.length > MAX_LEN){
      names = names.splice(0,MAX_LEN);
  }
  /*
  let to_remove = [];
  let i = 0;
  for (let [name,_] of names){
    const subProps = outputs[inputNames.findIndex(x => x === name)].props;
    const add = subProps.setCurrent;
    if (add) {
      const current = subProps.current;
      const content = subProps.content;
      if (current instanceof AST_node){
        add(current);
      }
      else {
        add(content);
      }
      const can_add = root.current.accept(get_checker());
      if (!can_add){
        to_remove.push(i);
      }
      i++;
      add([]);
    }
  }
  for (let removing of to_remove){
    names.splice(removing,1);
  }
  */
  return names.map((a:[string,number])=>{return a[0]});
}

function fuzzy(name: string, input: string): number{
    let inputIndex = 0;
    let nameIndex = 0;
    const inputLen = input.length;
    const nameLen = name.length;
    let score = 0;
    let longest_streak = 0;
    let current_streak = 0;

    while (inputIndex != inputLen && nameIndex != nameLen) {
        const patternChar = input.charAt(inputIndex).toLowerCase();
        const strChar = name.charAt(nameIndex).toLowerCase();
        if (patternChar === strChar) {
            ++inputIndex;
            score += 5*(1.0/(nameIndex + 1.0));
            ++current_streak;
        }
        else {
          current_streak = 0;
        }
        if (current_streak > longest_streak) longest_streak = current_streak;
        ++nameIndex;
    }

    score += longest_streak;
    if (inputLen === 0) return 1;

    return inputLen != 0 && nameLen != 0 && inputIndex === inputLen
        ? score
        : 0;

}
