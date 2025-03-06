// GraphContent.jsx
import React from "react";
import DynamicBarGraph from "./Graphs/DynamicBarGraph";

const GraphContent = ({ data }) => {
  return (
    <div style={{ flex: 1 }}>
      <DynamicBarGraph data={data} />
    </div>
  );
};

export default GraphContent;