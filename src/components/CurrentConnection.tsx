import React from 'react';

interface CurrentConnectionProps {
  connectionName: string;
  onChangeConnection: () => void;
}

export const CurrentConnection: React.FC<CurrentConnectionProps> = ({
  connectionName,
  onChangeConnection,
}) => (
  <div className="flex items-center">
    <span className="font-semibold text-lg mr-2 text-gray-800 dark:text-gray-200 transition-colors duration-200">
      Current Connection:
    </span>
    <span className="text-lg text-gray-700 dark:text-gray-300 transition-colors duration-200">
      {connectionName}
    </span>
    <button
      className="ml-2 px-3 py-1 text-xs border rounded-full transition-all duration-200
        text-red-600 dark:text-red-400
        border-red-600 dark:border-red-400
        hover:bg-red-100 dark:hover:bg-red-900/20
        hover:text-red-700 dark:hover:text-red-300"
      onClick={onChangeConnection}
    >
      Edit
    </button>
  </div>
);