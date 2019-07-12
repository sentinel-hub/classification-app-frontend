import React, { Component } from 'react';
import { storiesOf } from '@storybook/react';

import InformationDisplayModal from '.';

const stories = storiesOf('Information Display', module);

const sampleText = `

# Live demo

Changes are automatically rendered as you type.

- Implements [GitHub Flavored Markdown](https://github.github.com/gfm/)
- Renders actual, "native" React DOM elements
- Allows you to escape or skip HTML (try toggling the checkboxes above)
- If you escape or skip the HTML, no \`dangerouslySetInnerHTML\` is used! Yay!

## HTML block below

<blockquote>
  This blockquote will change based on the HTML settings above.
</blockquote>
<a href="/InvalidExample2.png" target="_blank"  rel="noopener noreferrer" >example</a>

## How about some code?

\`\`\`js
var React = require('react');
var Markdown = require('react-markdown');
React.render(
<Markdown source="# Your markdown here" />,
document.getElementById('content')
);
\`\`\`

Pretty neat, eh?

## Tables?

| Feature   | Support |
| --------- | ------- |
| tables    | ✔       |
| alignment | ✔       |
| wewt      | ✔       |

## More info?

## Read usage information and more on [GitHub](//github.com/rexxars/react-markdown)

A component by [Espen Hovlandsdal](https://espen.codes/)
`;

stories.add('default', () => (
  <InformationDisplayModal
    open={true}
    title="Title"
    content={sampleText}
    onClose={() => console.log('onClose')}
  />
));

class TestInformationDisplay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showInstructions: false,
    };
  }

  openInstructions = () => {
    this.setState({
      showInstructions: true,
    });
  };

  closeInstructions = () => {
    this.setState({
      showInstructions: false,
    });
  };

  render() {
    return (
      <div>
        <button onClick={this.openInstructions}>open</button>
        <InformationDisplayModal
          open={this.state.showInstructions}
          title={`title`}
          content={sampleText}
          onClose={this.closeInstructions}
        />
      </div>
    );
  }
}

stories.add('with button', () => <TestInformationDisplay />);
