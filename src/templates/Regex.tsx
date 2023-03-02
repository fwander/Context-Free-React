import { getTextWidth, RegexInput, useFocusRef } from "./lib";

const Regex: React.FC<RegexInput> = (props) => {
  let name = 'input';
  if(!props.isValid) {
    name += ' invalid';
  }
  let width = getTextWidth(props.text.toLowerCase());
  const ref = useFocusRef<HTMLInputElement>();
  return <input className={name} ref={ref} style={ {width: width} } onChange={(e) => { props.submit(e.target.value); }} defaultValue={props.text} />
};

export default Regex;
