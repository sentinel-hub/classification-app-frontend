import React from 'react';

import './SliderCC.css';

const Slider = props => {
  return (
    <div className={props.className}>
      <input
        type="range"
        className="slider"
        id={props.name}
        name={props.name}
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={props.onChange}
      />
      <span className="slider-value">{props.value}%</span>
    </div>
  );
};

export default Slider;
