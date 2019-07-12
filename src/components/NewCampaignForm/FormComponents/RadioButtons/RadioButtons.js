import React from 'react';

import './RadioButtons.css';

const RadioButtons = props => {
  return (
    <div>
      {Object.keys(props.options).map(option => {
        return (
          <label key={props.options[option]} className="form-radio-button">
            <input
              className="input-form-radio-button"
              name={props.name}
              onChange={props.onChange}
              value={props.options[option]}
              checked={props.selectedOption === props.options[option]}
              type="radio"
            />
            {props.options[option]}
          </label>
        );
      })}
    </div>
  );
};

export default RadioButtons;
