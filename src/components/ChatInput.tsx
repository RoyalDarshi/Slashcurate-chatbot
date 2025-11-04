import React, { useRef, useEffect, useState, useCallback } from "react";
import { Send, Mic, MicOff } from "lucide-react"; // Import Mic and MicOff icons
import { ChatInputProps } from "../types"; // Assuming this type exists
import { useTheme } from "../ThemeContext"; // Assuming this context exists
import MiniLoader from "./MiniLoader"; // Assuming this component exists
import CustomTooltip from "./CustomTooltip"; // Assuming this component exists

// Define the SpeechRecognition interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const ChatInput: React.FC<ChatInputProps> = React.memo(
  ({ input, isSubmitting, onInputChange, onSubmit, disabled }) => {
    const { theme } = useTheme();
    const isDisabled = isSubmitting || disabled;
    const inputRef = useRef<HTMLInputElement>(null);
    const MAX_CHARS = 500;

    // State for microphone functionality
    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(
      null
    );
    const [voiceInputStatus, setVoiceInputStatus] = useState(""); // e.g., "Listening...", "Processing..."
    const [micPermissionStatus, setMicPermissionStatus] = useState<
      "prompt" | "granted" | "denied" | "unsupported"
    >("prompt"); // New state for permission status

    // Initialize SpeechRecognition on component mount
    useEffect(() => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      let newRecognitionInstance: SpeechRecognition | null = null; // Declare outside the if block

      if (SpeechRecognition) {
        newRecognitionInstance = new SpeechRecognition(); // Assign here
        newRecognitionInstance.continuous = false; // Stop after a single utterance
        newRecognitionInstance.interimResults = false; // Only return final results
        newRecognitionInstance.lang = "en-US"; // Set language

        newRecognitionInstance.onstart = () => {
          setIsRecording(true);
          setVoiceInputStatus("Listening...");
          console.log("Voice recognition started.");
          setMicPermissionStatus("granted"); // Assume granted if it starts
        };

        newRecognitionInstance.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join("");
          onInputChange(transcript); // Update the input field with the transcript
          setVoiceInputStatus("Processing...");
          console.log("Transcript:", transcript);
        };

        newRecognitionInstance.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          setVoiceInputStatus(`Error: ${event.error}`);
          if (
            event.error === "not-allowed" ||
            event.error === "permission-denied"
          ) {
            setMicPermissionStatus("denied");
            console.error("Microphone access denied by user.");
          } else if (event.error === "no-speech") {
            setVoiceInputStatus("No speech detected. Please try again.");
          } else if (event.error === "aborted") {
            setVoiceInputStatus("Voice input aborted.");
          } else {
            setVoiceInputStatus(`Error: ${event.error}`);
          }
        };

        newRecognitionInstance.onend = () => {
          setIsRecording(false);
          setVoiceInputStatus("");
          console.log("Voice recognition ended.");
          // If there's content in the input after transcription, submit it automatically
          if (inputRef.current?.value && inputRef.current.value.length > 0) {
            onSubmit(new Event("submit", { cancelable: true }));
          }
        };

        setRecognition(newRecognitionInstance);

        // Check initial permission status (though this might not trigger a prompt)
        if (navigator.mediaDevices) {
          navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then(() => setMicPermissionStatus("granted"))
            .catch((err) => {
              if (
                err.name === "NotAllowedError" ||
                err.name === "PermissionDeniedError"
              ) {
                setMicPermissionStatus("denied");
              } else {
                setMicPermissionStatus("prompt"); // Or 'unsupported' if other errors
                console.warn(
                  "Could not determine microphone permission or other media error:",
                  err
                );
              }
            });
        } else {
          console.warn(
            "navigator.mediaDevices is not available in this browser/context."
          );
          setMicPermissionStatus("unsupported");
        }
      } else {
        console.warn("Speech Recognition API not supported in this browser.");
        setMicPermissionStatus("unsupported");
        // setVoiceInputStatus("Voice input not supported in this browser.");
      }

      // Cleanup on unmount
      return () => {
        if (newRecognitionInstance) {
          newRecognitionInstance.stop();
        }
      };
    }, [onInputChange, onSubmit]); // Depend on onInputChange and onSubmit to ensure correct closure

    // Focus input on mount
    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);

    // Handle microphone button click
    const handleMicToggle = useCallback(() => {
      if (!recognition) return;

      if (isRecording) {
        recognition.stop();
      } else {
        // Clear previous input when starting recording
        onInputChange("");
        setVoiceInputStatus("Starting voice input..."); // Provide immediate feedback
        recognition.start();
      }
    }, [isRecording, recognition, onInputChange]);

    // Determine if the mic button should be visible
    const showMicButton = !input && !isSubmitting;

    // Determine permission indicator color
    const getPermissionIndicatorColor = () => {
      switch (micPermissionStatus) {
        case "granted":
          return "bg-green-500";
        case "denied":
          return "bg-red-500";
        case "prompt":
          return "bg-orange-400";
        case "unsupported":
          return "bg-gray-500";
        default:
          return "bg-gray-300";
      }
    };

    return (
      <form
        onSubmit={onSubmit}
        style={{ background: theme.colors.background, width: "100%" }}
        className="flex-grow"
      >
        <div
          className="flex items-center gap-2 w-full"
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.pill,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: `0 2px 10px ${theme.colors.text}10`,
            padding: "5px",
          }}
        >
          {/* Microphone button */}
          {showMicButton &&
            recognition &&
            micPermissionStatus !== "unsupported" && (
              <CustomTooltip
                title={isRecording ? "Stop Voice Input" : "Voice Input"}
                position="top"
              >
                <div className="relative">
                  <button
                    type="button" // Important: type="button" to prevent form submission
                    onClick={handleMicToggle}
                    disabled={
                      isDisabled ||
                      !recognition ||
                      micPermissionStatus === "denied"
                    } // Disable if denied
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0 ${
                      isRecording ? "animate-pulse" : ""
                    }`}
                    style={{
                      background: isRecording
                        ? theme.colors.error // Use a distinct color for recording
                        : theme.colors.accent, // Changed from theme.colors.primary to theme.colors.accent for consistency
                      color: "white",
                      boxShadow: isRecording
                        ? `0 0 15px ${theme.colors.error}60`
                        : `0 0 10px ${theme.colors.accent}40`,
                    }}
                    aria-label={
                      isRecording ? "Stop voice input" : "Start voice input"
                    }
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  {/* Permission status indicator */}
                  <span
                    className={`absolute top-0 right-0 block w-3 h-3 rounded-full ring-2 ring-white ${getPermissionIndicatorColor()}`}
                    title={`Microphone status: ${micPermissionStatus}`}
                  ></span>
                </div>
              </CustomTooltip>
            )}

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                onInputChange(e.target.value);
                // If user starts typing, stop recording
                if (isRecording && recognition) {
                  recognition.stop();
                }
              }
            }}
            placeholder={voiceInputStatus || "Ask about your data..."}
            className="flex-grow h-10 px-3 text-base border-none rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder-opacity-50"
            style={{
              backgroundColor: "transparent",
              color: theme.colors.text,
              border: "none",
              borderRadius: theme.borderRadius.default,
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.size.base,
              transition: theme.transition.default,
              outline: "none",
              "--tw-ring-color": theme.colors.accent,
            }}
            disabled={
              isDisabled || isRecording || micPermissionStatus === "denied"
            } // Disable text input while recording or if denied
            aria-disabled={
              isDisabled || isRecording || micPermissionStatus === "denied"
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
          />

          {/* Send Button */}
          <CustomTooltip title="Ask Question" position="top">
            <button
              type="submit"
              disabled={
                isDisabled || isRecording || micPermissionStatus === "denied"
              } // Disable send button while recording or if denied
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0"
              style={{
                background:
                  isDisabled || isRecording || micPermissionStatus === "denied"
                    ? `${theme.colors.text}20`
                    : theme.colors.accent,
                color: "white",
                boxShadow:
                  isDisabled || isRecording || micPermissionStatus === "denied"
                    ? "none"
                    : `0 0 10px ${theme.colors.accent}40`,
              }}
              aria-label="Send message"
            >
              {isSubmitting ? (
                <MiniLoader />
              ) : (
                <Send size={18} className="transition-transform duration-300" />
              )}
            </button>
          </CustomTooltip>
        </div>
      </form>
    );
  }
);

const areEqual = (prevProps: ChatInputProps, nextProps: ChatInputProps) => {
  return (
    prevProps.input === nextProps.input &&
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.onSubmit === nextProps.onSubmit &&
    prevProps.onInputChange === nextProps.onInputChange &&
    prevProps.disabled === nextProps.disabled
  );
};

export default React.memo(ChatInput, areEqual);
