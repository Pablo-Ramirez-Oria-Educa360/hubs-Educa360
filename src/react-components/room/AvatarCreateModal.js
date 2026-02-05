import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { CloseButton } from "../input/CloseButton";
import { Button } from "../input/Button";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";

export function AvatarCreateModal({ onImport, onCreate, onClose }) {
  return (
    <Modal
      title={<FormattedMessage id="avatar-create-modal.title" defaultMessage="Create avatar" />}
      beforeTitle={<CloseButton onClick={onClose} />}
    >
      <Column padding center>
        <p>
          <FormattedMessage id="avatar-create-modal.body" defaultMessage="Choose how you want to add your avatar." />
        </p>
        <Button preset="primary" lg onClick={onCreate}>
          <FormattedMessage id="avatar-create-modal.create" defaultMessage="Use Avatar Maker" />
        </Button>
        <Button preset="basic" lg onClick={onImport}>
          <FormattedMessage id="avatar-create-modal.import" defaultMessage="Import GLB" />
        </Button>
      </Column>
    </Modal>
  );
}

AvatarCreateModal.propTypes = {
  onImport: PropTypes.func,
  onCreate: PropTypes.func,
  onClose: PropTypes.func
};
