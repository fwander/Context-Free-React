use once_cell::sync::Lazy;
use tera::Tera;

pub static TERA: Lazy<Tera> = Lazy::new(|| {
    let mut tera = match Tera::new("templates/*") {
        Ok(t) => t,
        Err(e) => {
            println!("Parsing error(s): {}", e);
            ::std::process::exit(1);
        }
    };

    tera.add_raw_template(
        "component",
        r"
export const {{name}}: React.FC<ComponentInput> = (props) => {
  let expr = props.current as AST_node;
  {%- for select in selects%}
  const [select{{select[0]}}, setSelect{{select[0]}}] = useState(-1);
  expr.selection_state[{{select[1]}}] = select{{select[0]}};
  {%- endfor %}
  {%- for focus in focusi%}
  const [focus{{select[0]}}, setSelect{{select[0]}}] = useState(-1);
  expr.selection_state[{{select[1]}}] = select{{select[0]}};
  {%- endfor %}
  props.setCurrent(expr);
  useEffect(()=>{return ()=>{update_root();update_visual();}},[]);
  return {{jsx}};
}
",
    )
    .unwrap();

    tera.add_raw_template(
        "ast_file",
        r"
import { Visitor } from './visitor';
class Selector {
  constructor(selection?: number){this.selection=selection;}
  children: Selector[] = [];
  selection?: number;
}
export abstract class AST_node{
    constructor(parent: AST_node | undefined){
        this.parent = parent;
    }
    abstract accept(v: Visitor<any>): any;
    until_me(node: AST_node, name: string, first: boolean, outside: boolean, acc: AST_node[]): AST_node[] {
      let flat_children;
      if (Array.isArray(this.child))
        flat_children = this.child.flat(Infinity);
      else
        flat_children = [this.child]
      for (let child of flat_children){
        if (child === node){
          if (child.id === name){
            if (outside){
              console.log(child);
              acc.push(child);
            }
            outside = true
          }
          break;
        }
        else if (child.id === name){
          console.log(child);
          acc.push(child);
        }
      }
      if (this.parent === undefined) return acc;
      return this.parent.until_me(this, name, false, outside, acc)
    }
    visit_children<T>(v: Visitor<T>){
      let flat_children;
      let ret: T[] = [];
      if (Array.isArray(this.child))
        flat_children = this.child.flat(Infinity);
      else{
        if (!(this.child instanceof AST_node)) {
          return [];
        }
        flat_children = [this.child]
      }
      for (let child of flat_children){
        if (child instanceof AST_node) {
          ret.push(v.try(child));
        }
      }
      return ret;
    }
    str(){
      let flat_children;
      let ret = '';
      if (Array.isArray(this.child))
        flat_children = this.child.flat(Infinity);
      else{
        if (!(this.child instanceof AST_node)) {
          return this.child;
        }
        flat_children = [this.child]
      }
      for (let child of flat_children){
        if (!(child instanceof AST_node)) {
          ret += child;
        }
        else{
          ret += child.str();
        }
      }
      return ret;
    }
    set(val: any, access: number[]){
      if (access.length===0){
        this.child=val;
      }
      else{
        let ref = this.child;
        let prev = ref;
        for (let i of access.slice(0,-1)){
          prev = ref;
          ref = ref[i]
          if (ref === undefined){
            ref = [];
          }
          prev[i] = ref;
        }
        ref[access[access.length-1]] = val;
      }
    }
    get(access: number[]){
      let accessing = this.child;
      for (let n of access){
        if (accessing === undefined) return undefined;
        if (Array.isArray(accessing) && n < accessing.length){
          accessing = accessing[n];
        }
      }
      if (Array.isArray(accessing) && accessing.length === 0) return false;
      return accessing;
    }
    get_selection(index: number[], depth: number){
      let accessing = this.selection_state;
      let ii = 0;
      let ci = 0;
      while(ii !== index.length && ci !== depth){
        if (accessing.selection !== undefined){
          ci++;
          accessing = accessing.children[0];
        }
        else {
          accessing = accessing.children[index[ii++]];
        }
      }
      return accessing.selection??-1;
    }
    add_selection(index: number[], depth: number, to?: number){
      let accessing = this.selection_state;
      let ii = 0;
      let ci = 0;
      while(ii !== index.length && ci !== depth){
        if (accessing.selection !== undefined){
          ci++;
          accessing = accessing.children[0];
        }
        else {
          accessing = accessing.children[index[ii++]];
        }
      }
      accessing.children.push(new Selector(to));
    }
    check(index: number[], checking: number[]){
      let accessing = this.selection_state;
      let ii = 0;
      let ci = 0;
      while(ii !== index.length && ci !== checking.length){
        if (accessing.selection !== undefined){
          if (accessing.selection !== checking[ci++]){
            return false;
          }
          accessing = accessing.children[0];
        }
        else {
          accessing = accessing.children[index[ii++]];
        }
      }
      return true;
    }
    selection_state: Selector = new Selector();
    abstract child: any;
    parent?: AST_node;
    abstract clone(parent?: AST_node): AST_node;
    name(){return this.child};
}

export class AST_root extends AST_node {
  accept(v: Visitor<any>) {
      return v.try(this.child);
  }
  child: AST_node|[] = [];
  clone(parent?: AST_node) {
    let ret = new AST_root(parent)
    if (this.child instanceof AST_node) ret.child = this.child.clone(this);
    return ret;
  }
}
{% for astNode in astNodes %}
{{astNode}}
{%- endfor %}
",
    )
    .unwrap();

    tera.add_raw_template(
        "AST",
        r"
export class {{name}}_node extends AST_node {
  constructor(parent: AST_node|undefined){
      super(parent);
  }
  accept = (v : Visitor<any>) => { return v.visit{{name}}_node(this); }
  id = '{{name}}';
  child: {{type}}|[] = [];
  {%- for tag in tags %}
  {{tag}}
  {%- endfor %}
  clone(parent?: AST_node){
    let ret = new {{name}}_node(parent);
    let temp: any;
    ret.selection_state = this.selection_state;
    {{clone}}
    return ret;
  }
}
",
    )
    .unwrap();

    tera.add_raw_template(
        "visitor",
        r"
import { AST_node } from './ast';
import { 
  {%- for name in names -%}
  {{name}}_node,
  {%- endfor -%}
  } from './ast';
export abstract class Visitor<ResultType> {
  protected abstract noVal: ResultType;
  try(node: any, def?: ResultType): ResultType{
    if (node instanceof AST_node){
      return node.accept(this);
    }
    return def? def : this.noVal;
  }
  is_undefined(node: any){
    if (node === undefined || (Array.isArray(node) && node.length === 0)){
      return true;
    }
    return false;
  }
  get(node: any, def?: ResultType): ResultType{
    let ret = node as ResultType;
    if (this.is_undefined(ret)){
      return def? def : this.noVal;
    }
    return ret;
  }
  {%- for name in names %}
  abstract visit{{name}}_node (node : {{name}}_node) : ResultType;
  {%- endfor %}
}

export class DefaultChecker extends Visitor<boolean>{
    protected noVal: boolean = true;
    {%- for name in names%}
    visit{{name}}_node(node: {{name}}_node): boolean {
        return true;
    }
    {%- endfor %}
}
",
    )
    .unwrap();

    tera.add_raw_template(
        "astcss",
        r"
{% for name in names%}
.{{name}} {
  background: rgb(102, 102, 153, .2);
  display: table-cell
}
{% endfor %}
    ",
    )
    .unwrap();

    tera
});
