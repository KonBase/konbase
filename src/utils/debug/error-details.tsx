import React from 'react';

interface ErrorDetailsProps {
  errorData?: any;
}

export const ErrorDetails: React.FC<ErrorDetailsProps> = ({ errorData }) => {
  if (!errorData) return null;

  return (
    <details>
      <summary className="cursor-pointer text-xs font-semibold">
        Error Details
      </summary>
      <pre className="mt-2 p-2 bg-background border rounded-md overflow-auto max-h-[200px] text-xs text-red-500">
        {typeof errorData === 'object'
          ? JSON.stringify(errorData, null, 2)
          : String(errorData)}
      </pre>
    </details>
  );
};

export default ErrorDetails;
