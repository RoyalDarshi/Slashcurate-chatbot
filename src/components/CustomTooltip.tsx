// CustomTooltip.tsx
import React, { useRef } from "react";
import { Tooltip as ReactTooltip, PlacesType } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

// Define props interface
interface CustomTooltipProps {
  title: string;
  children: React.ReactElement;
  position?: PlacesType;
  delayShow?: number;
  delayHide?: number;
  className?: string;
  disabled?: boolean;
  maxWidth?: number | string;
  variant?: "dark" | "light" | "success" | "warning" | "error" | "info";
}

// Variant styles using Tailwind with darker backgrounds
const variantStyles = {
  dark: "bg-gray-950 text-white border-gray-900",
  light: "bg-white text-gray-900 border-gray-200",
  success: "bg-green-800 text-white border-green-900",
  warning: "bg-yellow-700 text-black border-yellow-800",
  error: "bg-red-800 text-white border-red-900",
  info: "bg-blue-800 text-white border-blue-900",
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  title,
  children,
  position = "top",
  delayShow = 200,
  delayHide = 100,
  className = "",
  disabled = false,
  maxWidth = 300,
  variant = "dark",
}) => {
  const triggerRef = useRef<string>(
    `tooltip-${Math.random().toString(36).substr(2, 9)}`
  );
  const childRef = useRef<HTMLElement>(null);

  // Clone child with ref and data-tooltip-id
  const triggerElement = React.cloneElement(children, {
    ref: childRef,
    "data-tooltip-id": disabled ? undefined : triggerRef.current,
    "data-tooltip-content": title,
    "aria-describedby": disabled ? undefined : triggerRef.current,
  });

  return (
    <>
      {triggerElement}
      {!disabled && (
        <ReactTooltip
          id={triggerRef.current}
          place={position}
          delayShow={delayShow}
          delayHide={delayHide}
          className={`
            !p-2
            !rounded-md 
            !border 
            shadow-lg 
            !text-base 
            z-[9999]
            opacity-100
            ${variantStyles[variant]}
            ${className}
          `}
          style={{
            maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
          }}
        >
          <span>{title}</span>
        </ReactTooltip>
      )}
    </>
  );
};

export default CustomTooltip;
