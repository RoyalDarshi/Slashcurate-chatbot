import React, { useState } from "react";
import ConnectionForm from "./ConnectionForm";
import ExistingConnections from "./ExistingConnections";

const ConnectionManager: React.FC = () => {
  const [view, setView] = useState<"new" | "existing">("new");

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-full h-full overflow-hidden">
      <div className="flex justify-center space-x-4 mb-6">
        <fieldset className="relative inline-flex rounded-full shadow-sm bg-gray-200 dark:bg-gray-700 p-1 border-0">
          <div
            className={`absolute top-0 left-0 h-full w-1/2 bg-blue-600 rounded-full transition-transform duration-300 ease-in-out transform ${
              view === "existing" ? "translate-x-full" : ""
            }`}
          ></div>
          <button
            onClick={() => setView("new")}
            className={`relative px-4 py-2 w-32 rounded-full transition-all duration-300 ease-in-out ${
              view === "new" ? "text-white" : "text-blue-600"
            }`}
          >
            New Connection
          </button>
          <button
            onClick={() => setView("existing")}
            className={`relative px-4 py-2 w-32 rounded-full transition-all duration-300 ease-in-out ${
              view === "existing" ? "text-white" : "text-blue-600"
            }`}
          >
            Existing Connection
          </button>
        </fieldset>
      </div>
      <div className="w-full h-full overflow-y-auto">
        {view === "new" && <ConnectionForm />}
        {view === "existing" && <ExistingConnections />}
      </div>
    </div>
  );
};

export default ConnectionManager;
