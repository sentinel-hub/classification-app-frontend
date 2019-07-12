import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import s from 'styled-components';

@inject('uiStore')
@observer
class ClassPanel extends Component {
  render() {
    const {
      cls: { title, lock, classIdx, layerIdx, color },
      uiStore: {
        state: {
          activeClass: { classIdx: activeClassIdx },
          activeLayer: { idx: activeLayerIdx },
        },
        classList,
      },
    } = this.props;
    return (
      <tr>
        <td>
          <p>{title}</p>
        </td>
        {classList.length > 1 && (
          <td>
            <div className="table-input-container">
              <input
                type="checkbox"
                checked={activeClassIdx === classIdx}
                onChange={() => this.props.uiStore.setActiveClass(classIdx)}
              />
            </div>
          </td>
        )}
        <td>
          <div className="table-input-container">
            <RangeStyle color={color}>
              <input
                type="range"
                min="0"
                max={this.props.uiStore.appConfig.maxOpacity}
                step="1"
                //style = {{background: color}}
                onInput={event => {
                  this.props.uiStore.setOpacity(classIdx, parseInt(event.target.value, 10));
                }}
              />
            </RangeStyle>
          </div>
        </td>
        {classList.length > 1 && (
          <td>
            <div className="table-input-container">
              <input
                type="checkbox"
                checked={lock}
                disabled={this.props.uiStore.campaignConfig.layers[layerIdx].idx !== activeLayerIdx}
                onChange={() => this.props.uiStore.setLockClass(classIdx)}
              />
            </div>
          </td>
        )}
      </tr>
    );
  }
}

const RangeStyle = s.div`

  input[type=range] {
    -webkit-appearance: none;
    width: 100px;
    height: 5px;
    border-radius: 10px;
    border: 1px solid #808080;
    background: ${props => props.color};
    transition: opacity 0.5s;
    position: relative;
  }

  input[type=range]::-moz-range-track {
    width: 100px;
    height: 5px;
    border-radius: 10px;
    border: 1px solid #808080;
    background: ${props => props.color};
    transition: opacity 0.5s;
    position: relative;
  }

  input[type=range]::-ms-track {
    width: 100px;
    height: 5px;
    border-radius: 10px;
    border: 1px solid #808080;
    background: ${props => props.color};
    transition: opacity 0.5s;
    position: relative;
  }

  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    border: 1px solid #808080;
    height: 15px;
    width: 15px;
    border-radius: 20px;
    background: #ffffff;
    color: black;
    cursor: pointer;
  }

  input[type=range]::-moz-range-thumb {
    border: 1px solid #808080;
    height: 15px;
    width: 15px;
    border-radius: 20px;
    background: #ffffff;
    color: black;
    cursor: pointer;
  }

  input[type=range]::-ms-thumb {
    border: 1px solid #808080;
    height: 15px;
    width: 15px;
    border-radius: 20px;
    background: #ffffff;
    color: black;
    cursor: pointer;
  }
`;

export default ClassPanel;
