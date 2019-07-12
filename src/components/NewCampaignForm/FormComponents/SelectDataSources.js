import React from 'react';

const Select = props => {
  return (
    <select name={props.name} value={props.value} onChange={props.onChange} className="select">
      {props.options &&
        Object.keys(props.options).map(option => {
          return (
            <option key={props.options[option].name} value={props.options[option].name}>
              {props.options[option].name}
            </option>
          );
        })}
    </select>
  );
};

export default Select;
