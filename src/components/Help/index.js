import React, { Component } from 'react';
import PopoutWindow from 'react-popout';
import { inject } from 'mobx-react';

@inject('uiStore', 'gpdStore')
class Help extends Component {
  render() {
    const imageSize = 64;
    const { trialMode } = this.props.gpdStore;
    return (
      <PopoutWindow
        title="Classification App Help"
        onClosing={this.props.closeHelpWindow}
        options={{ width: '800px', height: '800px' }}
        ref={el => (this._popup = el)}
      >
        <div>
          <h3>How to Use the Classification App</h3>

          <p>
            The Classification App is a tool for fast and accurate manual classification of satellite images.
            The overall aim is to create a database of manually classified images that can be used to train
            classification algorithms based on supervised machine learning.
          </p>

          <p>
            Here is an overview of the application's functionalities with instructions on how to use it. The
            following steps comprise the workflow for classifying a single image:
          </p>

          <ol>
            <li>
              <h4>Image selection</h4>

              <p>
                When the application loads (and after pressing the "Next image" or "Save and next image"
                button), the application will randomly select an area with {imageSize}x{imageSize} Sentinel-2
                pixels for classification. The area is allocated by a blue box on the map on the left. On the
                right is the same image zoomed in, where you will do the actual classification.
              </p>
              <p>
                <em>
                  Note: In some rare cases selected the selected image may fall on the edge of the satellite's
                  orbit (
                  <a href="#" onClick={() => this.props.openImageWindow('InvalidExample1.png')}>
                    Example1
                  </a>
                  ) or the entire image may is dark (
                  <a href="#" onClick={() => this.props.openImageWindow('InvalidExample2.png')}>
                    Example2
                  </a>
                  ). Such image should not be classified because the data might be corrupted. Instead you
                  should move to the next image by pressing the "Next image" button.
                </em>
              </p>
            </li>

            <li>
              <h4>Image analysis</h4>
              <p>
                Start by visually analyzing the image. There are two main tools to help you. The first is the
                map on the left, which can give you a good overview of the surrounding area. The second tool
                is comprised of the images on the bottom, which are different versions of the chosen image
                above, created using different combinations of bands. The images are as follows:
                <ul>
                  <li>TRUE_COLOR - Original true color image. </li>
                  <li>
                    BRIGHT_AREAS - Darker true color image useful for bright surfaces (e.g. clouds and snow).
                  </li>
                  <li>
                    DARK_AREAS - Brighter true color image useful for dark surfaces (e.g. water and
                    vegetation).
                  </li>
                  <li>
                    INFRARED - Image with B08 band useful for distinguishing between land and water and for
                    observing shadows.
                  </li>
                  <li>
                    CLOUDS_BCY - Braaten, Cohen, Yang algorithm for cloud detection. Blue areas mark denser
                    clouds and red areas mark scarcer clouds.
                  </li>
                  <li>
                    CLOUDS_B11_B3_B2 - A simple pixel-based algorithm for cloud detection using bands B11, B3
                    and B2. Pixels that are less likely to show clouds have their red color component
                    increased.
                  </li>
                  <li>CIRRUS - Image of brightened B10 which is useful for detecting cirrus clouds.</li>
                  <li>
                    WATER_TEST - A pixel-based algorithm for detecting water pixels. Pixels that are more
                    likely to show water are colored blue.
                  </li>
                  <li>
                    SNOW_TEST - A pixel-based algorithm for detecting snow pixels. Pixels that are more likely
                    to show snow are colored cyan.
                  </li>
                  <li>
                    NDVI - Image that shows the normalized difference vegetation index. Areas with higher
                    probability of vegetation are colored green and areas with lower probability of vegetation
                    are colored red.
                  </li>
                </ul>
              </p>
            </li>

            <li>
              <h4>Image classification</h4>

              <p>
                In this step you classify pixels in the image on the right into pre-defined classes. Image
                classification is done by coloring the pixels in a canvas environment on the right. Each image
                should be classified on 3 different layers: Clouds, Shadows and Surface. User must classify
                the image for each of them separately. As a consequence a pixel can be classified into more
                than one class (e.g. water and thin cloud).
              </p>
              <p>
                To start with classification first select the active classifier from the list of classifiers,
                which opens with the click on "Active classifier" button. Use the paint tools to color those
                pixels on the image that corresponds to selected classifier. Then repeat the processes for the
                rest of the classifiers.
              </p>

              <div>
                Here are specific instructions on when to use each classifier:
                <ul>
                  <li>
                    Clouds
                    <ul>
                      <li>
                        Opaque clouds - clouds that are so dense that it is impossible to see through them.
                      </li>
                      <li>
                        Thick clouds - medium dense clouds through which you can barely see the surface below.
                      </li>
                      <li>
                        Thin clouds - almost transparent clouds through which you can easily see surface
                        below.
                      </li>
                    </ul>
                    In many cases one cloud will have some opaque areas, some thick areas and some thin areas.
                    Note that mist, fog and smoke should also be considered as clouds and classified in this
                    layer. Clear areas should be left unmarked.
                  </li>

                  <li>
                    Shadows
                    <ul>
                      <li>
                        Shadows - all shadows should be marked, which includes shadows caused by clouds and
                        those caused by surface terrain. Shadows may be on surface or on top of other clouds.
                      </li>
                    </ul>
                    Unshaded areas should be left unmarked in this layer.
                  </li>

                  <li>
                    Surface
                    <ul>
                      <li>
                        Land - all land areas that are not covered by snow or ice. This includes all types of
                        vegetation, bare soil and man-made structures.
                      </li>
                      <li>
                        Water - all areas covered by water bodies (i.e. seas, rivers, lakes, ponds, etc.).
                      </li>
                      <li>Snow - all areas covered with snow or ice including icebergs and frozen lakes.</li>
                    </ul>
                    <b>Note: Every pixel in the image should be classified in this layer.</b> In the situation
                    where the surface is covered by opaque clouds, you should guess what is beneath. Disabling
                    Sentinel-2 layer on the map on the lefthand side and looking at Open Street Map layer
                    might be useful.
                  </li>
                </ul>
              </div>
              <p>
                From the list of classifiers you can also adjust the opacity using the slider bar. This
                changes the transparency associated with each classification option. By default, the
                classification options in the active layer are opaque and all the other classifiers are
                transparent. Note that it is only possible to change the pixels associated with a particular
                classification tool in the currently active layer. All the other classifications are shown in
                the background only.
                <br />
                Finally, it is possible to lock each classifier, which is intended to prevent the repainting
                of already classified pixels with different color. Note that this only applies to the tools in
                the active layer since these pixels are the only ones that can be changed.
              </p>
            </li>

            <li>
              <h4>Saving</h4>
              <p>
                The results of the classification are represented as raster images. By selecting the "Save and
                next image" option, the rasters will be uploaded to&nbsp;
                <a href="https://www.geopedia.world" target="_blank">
                  Geopedia
                </a>
                . Note that you must complete the full classification of each image, i.e. Clouds, Shadows and
                Surface, before saving the results to Geopedia.
              </p>

              <p>
                <em>
                  Note: If the user selects "Next image" instead of "Save and next image", the results will
                  not be saved.
                </em>
              </p>

              {/* <p>
                <em>
                  Note: If you realized that you made a mistake but pressed Save
                  classification to store the rasters, you should login
                  here&nbsp;
                  <a
                    href="https://www.geopedia.world/#T12_L1749"
                    target="_blank"
                  >
                    https://www.geopedia.world/#T12_L1749
                  </a>, navigate to the table of records of the Classification
                  App layer and delete the last record of the table.
                </em>
              </p> */}
            </li>
          </ol>

          {trialMode && (
            <em style={{ color: 'red' }}>
              Note: This is a trial version of Classification App which doesn't enable user sign-in. For full
              version first create an account at{' '}
              <a href="https://www.geopedia.world" target="_blank">
                Geopedia
              </a>{' '}
              and use it to sign in to{' '}
              <a href="https://apps.sentinel-hub.com/classificationApp/" target="_blank">
                full version of Classificaion app
              </a>
              .
            </em>
          )}

          <button
            style={{ margin: 'auto', display: 'block', marginTop: '10px' }}
            onClick={() => {
              this.props.closeHelpWindow();
            }}
          >
            Close
          </button>
        </div>
      </PopoutWindow>
    );
  }
}

export default Help;
