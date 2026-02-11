import React from 'react';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import { Icon } from '@iconify/react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="p-6 text-center">
      <Icon icon="mdi:alert-circle" className="text-red-500 text-6xl mb-4" />
      <Message severity="error" text={message} className="mb-4" />
      {onRetry && (
        <Button
          label="Intentar de nuevo"
          icon={<Icon icon="mdi:refresh" />}
          onClick={onRetry}
          className="p-button-outlined"
        />
      )}
    </div>
  );
};

export default ErrorMessage;