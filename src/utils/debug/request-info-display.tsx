import React from 'react';

interface RequestInfoDisplayProps {
  userData?: {
    userId?: string;
    associationId?: string;
  };
  requestInfo?: {
    requestTimestamp?: number | null;
    responseTimestamp?: number | null;
    retryCount?: number;
  };
  networkStatus: 'online' | 'offline';
}

export const RequestInfoDisplay: React.FC<RequestInfoDisplayProps> = ({
  userData,
  requestInfo,
  networkStatus,
}) => {
  return (
    <div className="font-mono text-xs bg-background p-2 rounded border overflow-auto max-h-[200px]">
      <p>Network: {networkStatus}</p>
      {userData?.userId && <p>User ID: {userData.userId}</p>}
      {userData?.associationId && (
        <p>Association ID: {userData.associationId}</p>
      )}
      {requestInfo?.retryCount !== undefined && (
        <p>Retry Count: {requestInfo.retryCount}</p>
      )}
      {requestInfo?.requestTimestamp && (
        <p>
          Request Time:{' '}
          {new Date(requestInfo.requestTimestamp).toLocaleTimeString()}
        </p>
      )}
      {requestInfo?.responseTimestamp && (
        <p>
          Response Time:{' '}
          {new Date(requestInfo.responseTimestamp).toLocaleTimeString()}
        </p>
      )}
      {requestInfo?.requestTimestamp && requestInfo?.responseTimestamp && (
        <p>
          Duration:{' '}
          {requestInfo.responseTimestamp - requestInfo.requestTimestamp}ms
        </p>
      )}
    </div>
  );
};

export default RequestInfoDisplay;
