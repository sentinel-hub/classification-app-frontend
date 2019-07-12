import React from 'react';

import { Modal, Message } from 'semantic-ui-react';

const ModalError = props => {
  return (
    <Modal open={true}>
      <Modal.Content>
        <Message negative>
          <Message.Header>Error</Message.Header>
          <p>{props.children}</p>
        </Message>
      </Modal.Content>
    </Modal>
  );
};

export default ModalError;
