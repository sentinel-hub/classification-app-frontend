import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { observer, inject } from 'mobx-react';
import Help from './../Help';
import ClassPanel from './ClassPanel';
import s from 'styled-components';
import { debounce } from 'lodash';
import InformationDisplayModal from '../InformationDisplayModal';

const SHOW_POPUP_INSTRUCTIONS_LC = 'ca.instructions';
class CommandsPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showLayersPanel: false,
      showScoreboardPanel: false,
      showHelp: false,
      showInstructions: false,
    };
    this.layerTitle = null;

    this._popup = null;
  }

  getCloseEvent = (btnId, showPanel, popupName) => {
    return debounce(event => {
      const popup = document.getElementsByClassName(popupName)[0];
      const specifiedElement = ReactDOM.findDOMNode(popup);
      const isClickInside = specifiedElement.contains(event.target);
      if (this.state[showPanel] && event.target.id !== btnId && !isClickInside) {
        var newStateProp = {};
        newStateProp[showPanel] = false;
        this.setState(newStateProp);
      }
    }, 100);
  };

  closeEvents = [
    //this.getCloseEvent('layersBtn', 'showLayersPanel', 'layersPopup'),  <- uncomment this if you want layerPopup to close 'automatically'
    this.getCloseEvent('scoreboardBtn', 'showScoreboardPanel', 'scoreboardPopup'),
  ];

  componentDidMount() {
    this.closeEvents.forEach(event => {
      document.addEventListener('mouseover', event);
    });

    const {
      campaignConfig: { id, ui },
    } = this.props.uiStore;

    const popupInstructionsVal = window.localStorage.getItem(`${SHOW_POPUP_INSTRUCTIONS_LC}.${id}`);
    const popupInstructionsBool = popupInstructionsVal ? popupInstructionsVal === 'true' : true;
    //TODO add showInstructions from uiStore.campaignConfig.ui
    this.setState({ showLayersPanel: false, showInstructions: popupInstructionsBool && !!ui.instructions });
  }

  componentWillUnmount() {
    this.closeEvents.forEach(event => {
      document.removeEventListener('mouseover', event);
    });
  }

  componentWillUpdate(prevProps, prevState) {
    if (this.layerTitle !== this.props.uiStore.state.activeLayer.title) {
      this.layerTitle = this.props.uiStore.state.activeLayer.title;
      const layers = this.props.uiStore.campaignConfig.layers;
      document.querySelectorAll('input[type=range]').forEach((rng, index) => {
        rng.value =
          layers[this.props.uiStore.classList[index].layerIdx].title === this.layerTitle
            ? this.props.uiStore.appConfig.maxOpacity
            : 0;
        this.props.uiStore.setOpacity(index, rng.value);
      });
    }
  }

  openHelpWindow = () => {
    if (!this.state.showHelp) {
      this.setState({
        showHelp: true,
      });
    } else {
      new Promise((resolve, reject) => {
        this.closeHelpWindow();
        resolve();
      }).then(() => {
        this.openHelpWindow();
      });
    }
  };

  closeHelpWindow = () => {
    this.setState({
      showHelp: false,
    });
  };

  openInstructions = () => {
    this.setState({
      showInstructions: true,
    });
  };

  closeInstructions = () => {
    const {
      campaignConfig: { id },
    } = this.props.uiStore;

    this.setState({
      showInstructions: false,
    });
    window.localStorage.setItem(`${SHOW_POPUP_INSTRUCTIONS_LC}.${id}`, false);
  };
  openImageWindow = imagePath => {
    window.open(this.props.uiStore.appConfig.urlPrefix + imagePath, '_blank');
  };

  createScoreboardData = () => {
    const maxScorePositions = 10;
    const activeUserId = this.props.gpdStore.user ? this.props.gpdStore.user.id : null;
    if (activeUserId && !this.props.gpdStore.gpdInfo) {
      this.props.gpdStore.fetchGpdInfo();
    }
    var scores = [];
    if (this.props.gpdStore.gpdInfo) {
      var allScores = [];
      Object.keys(this.props.gpdStore.gpdInfo.samplesPerUser).forEach(id => {
        allScores.push({
          id: id + (id === activeUserId ? ' ( ' + this.props.gpdStore.username + ' )' : ''),
          num: this.props.gpdStore.gpdInfo.samplesPerUser[id],
          active: id === activeUserId,
        });
      });
      const userValue = user => {
        return user.num + (user.active ? 0.5 : 0);
      };
      allScores.sort((a, b) => userValue(b) - userValue(a));
      var cnt = 0;
      var activeUserIndex = allScores.length;
      for (var i = 0; i < allScores.length; i++) {
        if (i === 0 || allScores[i].num < allScores[i - 1].num) {
          cnt = i + 1;
        }
        if (allScores[i].active) {
          activeUserIndex = i;
        }
        allScores[i].place = cnt.toString() + '.';
      }
      scores = allScores.slice(0, maxScorePositions);
      if (activeUserIndex >= maxScorePositions) {
        if (activeUserIndex > maxScorePositions) {
          scores.push(null);
        }
        if (activeUserIndex === allScores.length) {
          scores.push({
            id: activeUserId + ' ( ' + this.props.gpdStore.username + ' )',
            num: 0,
            active: true,
            place: (allScores.length + 1).toString() + '.',
          });
        } else {
          scores.push(allScores[activeUserIndex]);
        }
      }
      if (maxScorePositions < allScores.length && activeUserIndex < allScores.length - 1) {
        scores.push(null);
      }
    }
    return scores;
  };

  render() {
    const {
      state: {
        loadingStatus,
        activeClass,
        activeLayer: { title: activeLayerTitle },
      },
      appConfig: { saveType, activeTeaching, urlPrefix },
      campaignConfig: { layers, ui, name },
      classList,
    } = this.props.uiStore;
    const { username, gpdInfo } = this.props.gpdStore;
    const { showLayersPanel, showScoreboardPanel, showHelp } = this.state;
    const scores = ui.showRanking ? this.createScoreboardData() : [];
    return (
      <CommandsStyle showLayersPanel={showLayersPanel} showScoreboardPanel={showScoreboardPanel}>
        <div id="layers" className="layers-buttons-container">
          <button
            id="layersBtn"
            onClick={() => this.setState({ showLayersPanel: !this.state.showLayersPanel })}
          >
            Active classifier: {activeLayerTitle} &rarr; {activeClass.title}
          </button>
          <div className="layersPopup">
            {layers.map(layer => {
              return (
                <div
                  key={layer.idx}
                  className={`layer-panel ${activeLayerTitle === layer.title && 'layer-panel-active'}`}
                >
                  <h3 className="layer-panel-title">{layer.title} layer</h3>
                  <table>
                    <thead>
                      <tr>
                        <th className="classificators-table-head">Classifier</th>
                        {classList.length > 1 && <th>Active</th>}
                        <th>Color opacity</th>
                        {classList.length > 1 && <th>Lock</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {layer.classes.map(cls => (
                        <ClassPanel key={cls.classIdx} cls={classList[cls.classIdx]} />
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          <button
            disabled={loadingStatus !== null}
            title={'Next image'}
            style={{ width: '83px' }}
            onClick={() => {
              this.setState({ showLayersPanel: false });
              this.props.uiStore.getNewTask();
            }}
          >
            <img src={urlPrefix + 'buttons/arrow.png'} alt="Next task" />
          </button>

          <button
            className="saveButton"
            title={activeTeaching ? 'Save image' : 'Save and next image'}
            disabled={loadingStatus !== null}
            onClick={() => {
              this.setState({ showLayersPanel: false });
              this.props.uiStore.state.saveImage = true;
            }}
          >
            {loadingStatus !== null ? (
              <img src={urlPrefix + 'buttons/loading.png'} alt="Loading" />
            ) : activeTeaching ? (
              <div className="loadDiv">
                <img src={urlPrefix + 'buttons/save.png'} alt="Save" />
              </div>
            ) : (
              <div className="loadDiv">
                <img src={urlPrefix + 'buttons/save.png'} alt="Save" /> &amp;{' '}
                <img src={urlPrefix + 'buttons/arrow.png'} alt="Next task" />
              </div>
            )}
          </button>
          {ui.instructions && (
            <button
              title={'Instructions'}
              disabled={loadingStatus !== null}
              style={{ float: 'right' }}
              onClick={this.openInstructions}
            >
              <i className="fa fa-info-circle" />
            </button>
          )}

          {ui.showRanking && (
            <button
              title={'Help'}
              disabled={loadingStatus !== null}
              style={{ float: 'right' }}
              onClick={() => this.openHelpWindow()}
            >
              <i className="fa fa-question-circle" />
            </button>
          )}
          {ui.showRanking && (
            <button
              title={'Scoreboard'}
              id="scoreboardBtn"
              style={{ float: 'right' }}
              onClick={() =>
                this.setState({
                  showScoreboardPanel: !this.state.showScoreboardPanel,
                })
              }
            >
              <img src={urlPrefix + 'buttons/scoreboard.png'} alt="Scoreboard" />
            </button>
          )}

          <div className="scoreboardPopup">
            <div className={`layer-panel`}>
              <h3 className="layer-panel-title">Anonymous user scoreboard:</h3>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User ID</th>
                    <th>Number of classified areas</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map(score => {
                    if (score) {
                      return (
                        <tr key={score.id} className={score.active && 'activeScore'}>
                          <th>{score.place}</th>
                          <th>{score.id}</th>
                          <th>{score.num}</th>
                        </tr>
                      );
                    } else {
                      return (
                        <tr key="...">
                          <th>...</th>
                          <th>...</th>
                          <th>...</th>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
            <div className={`layer-panel`}>
              <h3 className="layer-panel-title">
                Total number of classified areas: {gpdInfo && gpdInfo.totalSamples}
              </h3>
            </div>
          </div>
        </div>
        {showHelp && (
          <Help
            closeHelpWindow={() => this.closeHelpWindow()}
            openImageWindow={imgPath => this.openImageWindow(imgPath)}
          />
        )}
        <InformationDisplayModal
          open={this.state.showInstructions}
          title={`${name} instructions`}
          content={ui.instructions}
          onClose={this.closeInstructions}
        />
      </CommandsStyle>
    );
  }
}

const CommandsStyle = s.div`
  .layers-buttons-container {
    height: 100%;
    width: 100%;
    font-size: 13px;
    letter-spacing: 0.05em;
    font-weigth: 200;
    padding: 7px 10px 0px 10px;
    position: absolute;
    top: 0;
    clear: both;
    color: #333;
    & > * {
        margin-right: 6px;
    }
    display: inline-block;
  }

  .layersPopup {
    z-index: 2; /*puts this in front of map*/
    position: absolute;
    top: 0px;
    width: ${props => (props.showLayersPanel ? '100%' : 0)};
    max-width: 400px;
    height: auto;
    overflow: hidden;
    transition: all ease 0.4s;
    background: #3e3e3e;
    color: #fff;
    margin-top: 40px;
    transition: 0.3s ease-in-out;
    font-size: 13px;
    letter-spacing: 0.05em;
    font-weigth: 200;

    table {
      width: 100%
    }

    th,
    td {
      padding: .25em;
    }
    white-space: nowrap;
  }

  .layer-panel {
    padding: 1em;
    border: 1px solid rgba(0, 0, 0, .25);
    border-radius: 5px;
    margin: .25em;
  }

  .layer-panel-active {
    background-color: rgba(0, 0, 0, .1);
  }

  .layer-panel-title {
    padding: 0;
    margin: 0;
    padding: .25em;
  }

  .table-input-container {
    display: flex;
    justify-content: center;
  }

  .classificators-table-head {
    text-align: left;
  }

  button {
    border: 1px solid #ccc;
  }

  button:hover {
    background-color: #eee;
  }

  .loadDiv {
    width: 100%;
    height: 100%;
  }

  img {
    min-width: 25%;
    height: 75%;
    vertical-align: middle;
    margin-left: 5px;
    margin-right: 5px;
    margin-bottom: 2px;
  }

  .saveButton:disabled {
    background: #F5F5F5;
    color : #888888;
  }

  .scoreboardPopup {
    position: absolute;
    right: 70px;
    top: 26px;
    width: ${props => (props.showScoreboardPanel ? '400px' : 0)};
    overflow: hidden;
    transition: all ease 0.4s;
    background: #fff;
    z-index: 100;
    table {
      width: 100%
    }
    th {
      color: rgba(0, 0, 0, .4);
    }
    th,
    td {
      padding: .25em;
    }
    white-space: nowrap;
  }

  .activeScore {
    th {
      color: rgb(0, 0, 0);
    }
  }
`;

export default inject('uiStore', 'gpdStore')(observer(CommandsPanel));
