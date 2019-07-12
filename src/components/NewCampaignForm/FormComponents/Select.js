import React from 'react';

const Select = props => {
  return (
    <select name={props.name} value={props.value} onChange={props.onChange} className="select">
      {Object.keys(props.options).map(option => {
        return (
          <option key={option} value={props.options[option]}>
            {props.options[option]}
          </option>
        );
      })}
    </select>
  );
};

export default Select;
