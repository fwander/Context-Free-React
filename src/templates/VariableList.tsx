import {ListInput} from "./lib";


const VariableList: React.FC<ListInput> = (props) => {
    return <div className={props.odd? 'virtical' : 'horizontal'}>
        {props.elements.map((element, index) => <div key={index}>{element}</div>)} 
        <div className={!props.odd? 'virtical' : 'horizontal'}>
          <div className='button' onClick={()=>{props.push()}}>+</div>
          <div className='button' onClick={()=>{props.pop()}}>-</div>
        </div>
    </div>
}

export default VariableList;
