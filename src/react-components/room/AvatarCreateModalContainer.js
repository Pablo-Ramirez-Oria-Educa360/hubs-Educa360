import React from "react";
import PropTypes from "prop-types";
import { AvatarCreateModal } from "./AvatarCreateModal";

export function AvatarCreateModalContainer({ onClose, onImport, onCreate }) {
  const handleImport = () => {
    onClose?.();
    onImport?.();
  };

  const handleCreate = () => {
    onClose?.();
    onCreate?.();
  };

  return <AvatarCreateModal onClose={onClose} onImport={handleImport} onCreate={handleCreate} />;
}

AvatarCreateModalContainer.propTypes = {
  onClose: PropTypes.func,
  onImport: PropTypes.func,
  onCreate: PropTypes.func
};
