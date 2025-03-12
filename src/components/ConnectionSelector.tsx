import React from 'react';
import Select from 'react-select';
import { ConnectionSelectorProps } from '../types';

export const ConnectionSelector: React.FC<ConnectionSelectorProps> = ({
  connections,
  onSelect,
  onCreateConSelected,
}) => {
  const options = [
    { value: "create-con", label: "Create Connection" },
    ...connections.map((connection) => ({
      value: connection,
      label: connection.connectionName,
    })),
  ];

  return (
    <div className="flex items-center">
      <label
        htmlFor="connectionSelect"
        className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Select Connection:
      </label>
      <div className="w-64">
        <Select
          options={options}
          onChange={onSelect}
          isClearable
          placeholder="Select a connection"
          classNamePrefix="react-select"
          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary: '#3b82f6',
              neutral0: '#ffffff',
              neutral20: '#d1d5db',
              neutral30: '#9ca3af',
            },
          })}
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              backgroundColor: 'var(--tw-bg-opacity, 1) rgb(255 255 255 / var(--tw-bg-opacity))',
              borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
              boxShadow: 'none',
              '&:hover': { borderColor: '#9ca3af' },
              '@media (prefers-color-scheme: dark)': {
                backgroundColor: '#1f2937',
                borderColor: state.isFocused ? '#3b82f6' : '#4b5563',
              },
            }),
            // ... other style overrides
          }}
        />
      </div>
    </div>
  );
};