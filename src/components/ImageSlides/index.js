import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

@inject('uiStore')
@observer
class ImageSlides extends Component {
  componentDidMount() {
    if (!this.props.uiStore.state.activePreset) {
      // Probably redundant
      this.props.uiStore.setActivePreset(0);
    }
  }

  render() {
    const {
      state: { activePreset, bbox }, // bbox has to be observed
      task: { window: imageSize },
      presetList,
    } = this.props.uiStore;
    const imageSlidesStyle = {
      backgroundImage: `url("${process.env.NODE_ENV === 'development' ? '../' : './'}")`,
      backgroundSize: `${Math.max(Math.min(120, (window.innerWidth - 75) / 2), 0)}px`,
    };
    return (
      <div className="footer">
        <div className="imageSlides" style={imageSlidesStyle}>
          {presetList.map((preset, idx) => {
            return (
              <SampleImage
                key={idx}
                preset={preset}
                size={imageSize}
                className={
                  preset.mapIdx === activePreset.mapIdx &&
                  preset.presetIdx === activePreset.presetIdx &&
                  'active'
                }
                src={this.props.uiStore.getPresetUrl(preset)}
                onClick={() => this.props.uiStore.setActivePreset(idx)}
              />
            );
          })}
        </div>
      </div>
    );
  }
}
const SampleImage = ({ src, onClick, className, size, preset }) => (
  <img
    className={className}
    title={preset.name} // <- text that is shown on mouse hover
    onClick={onClick}
    height={size.height}
    width={size.width}
    src={src}
    role="presentation"
  />
);

export default ImageSlides;
