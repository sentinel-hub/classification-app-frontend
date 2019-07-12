import React from 'react';
import Markdown from 'react-markdown';

import { Modal, Button } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import './InformationDisplayModal.css';

const inlineStyle = {
  modal: {
    marginTop: '0px ',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};

const InformationDisplayModal = ({ title, onClose, open, content }) => (
  <Modal style={inlineStyle.modal} open={open} onClose={onClose} className="informationDisplayModal">
    <Modal.Header>{title}</Modal.Header>
    <Modal.Content scrolling>
      <Modal.Description>
        <Markdown skipHtml={false} escapeHtml={false} source={content} />
      </Modal.Description>
    </Modal.Content>
    <Modal.Actions>
      <Button className="button-close" onClick={onClose}>
        close
      </Button>
    </Modal.Actions>
  </Modal>
);

InformationDisplayModal.defaultProps = {
  title: '',
  onClose: () => {},
  content: '',
  open: false,
};

export default InformationDisplayModal;
