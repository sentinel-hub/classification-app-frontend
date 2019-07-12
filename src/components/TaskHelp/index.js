import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { debounce } from 'lodash';
import ReactDOM from 'react-dom';

@inject('uiStore')
@observer
class TaskHelp extends Component {
  closeEvent = debounce(event => {
    const popup = document.getElementsByClassName('taskHelp')[0];
    const specifiedElement = ReactDOM.findDOMNode(popup);
    if (specifiedElement) {
      const isClickInside = specifiedElement.contains(event.target);
      if (this.props.uiStore.state.showTaskHelp && !isClickInside) {
        this.props.uiStore.state.showTaskHelp = false;
      }
    }
  }, 100);

  componentDidMount() {
    document.addEventListener('click', this.closeEvent);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closeEvent);
  }

  render() {
    const {
      appConfig: { urlPrefix },
    } = this.props.uiStore;
    return (
      <div className="taskHelp">
        <div>
          <h1 style={{ textAlign: 'center' }}>Water Body Monitoring Classification Exercise</h1>

          <p>
            <b>Objective:</b>
            <ul>Improve water detection algorithm by correcting misidentified water pixels</ul>
          </p>

          <p>
            <b>Task:</b>
            <ul style={{ listStyleType: 'circle' }}>
              <it>
                {' '}
                Use the Pencil &nbsp;{' '}
                <img src={urlPrefix + 'lc/img/pencil.png'} className="taskHelpImg" alt="" /> &nbsp; to draw
                blue pixels over the area, which is water but not classified as such.{' '}
              </it>
              <it>
                {' '}
                Use the Eraser &nbsp;{' '}
                <img src={urlPrefix + 'lc/img/eraser.png'} className="taskHelpImg" alt="" /> &nbsp; to remove
                blue pixels over areas, where there is no water.{' '}
              </it>
            </ul>
          </p>

          <p>You can change the transparency of the blue color by clicking on "Active classifier: Water"</p>
        </div>

        <button
          style={{ margin: 'auto', display: 'block', marginTop: '10px' }}
          onClick={() => {
            this.props.uiStore.closeTaskHelp();
          }}
        >
          Close
        </button>
      </div>
    );
  }
}
export default TaskHelp;
