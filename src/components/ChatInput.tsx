import React, { useRef, useEffect, useState, useCallback } from "react";
import { Send, Mic, MicOff, XSquare } from "lucide-react";
import { ChatInputProps } from "../types";
import { useTheme } from "../ThemeContext";
import CustomTooltip from "./CustomTooltip";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const ChatInput: React.FC<ChatInputProps> = React.memo(
  ({
    input,
    isSubmitting,
    onInputChange,
    onSubmit,
    disabled,
    onStopRequest,
  }) => {
    const { theme } = useTheme();
    const isDisabled = isSubmitting || disabled;
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const onInputChangeRef = useRef(onInputChange);
    const onSubmitRef = useRef(onSubmit);

    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(
      null,
    );
    const [voiceInputStatus, setVoiceInputStatus] = useState("");
    const [micPermissionStatus, setMicPermissionStatus] = useState<
      "prompt" | "granted" | "denied" | "unsupported"
    >("prompt");

    useEffect(() => {
      onInputChangeRef.current = onInputChange;
      onSubmitRef.current = onSubmit;
    });

    useEffect(() => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      let newRecognitionInstance: SpeechRecognition | null = null;

      if (SpeechRecognition) {
        newRecognitionInstance = new SpeechRecognition();
        newRecognitionInstance.continuous = false;
        newRecognitionInstance.interimResults = false;
        newRecognitionInstance.lang = "en-US";

        newRecognitionInstance.onstart = () => {
          setIsRecording(true);
          setVoiceInputStatus("Listening...");
          console.log("Voice recognition started.");
          setMicPermissionStatus("granted");
        };

        newRecognitionInstance.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join("");
          onInputChangeRef.current(transcript);
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
          if (inputRef.current?.value && inputRef.current.value.length > 0) {
            onSubmitRef.current(new Event("submit", { cancelable: true }));
          }
        };

        setRecognition(newRecognitionInstance);

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
                setMicPermissionStatus("prompt");
                console.warn(
                  "Could not determine microphone permission or other media error:",
                  err,
                );
              }
            });
        } else {
          console.warn(
            "navigator.mediaDevices is not available in this browser/context.",
          );
          setMicPermissionStatus("unsupported");
        }
      } else {
        console.warn("Speech Recognition API not supported in this browser.");
        setMicPermissionStatus("unsupported");
      }
      return () => {
        if (newRecognitionInstance) {
          newRecognitionInstance.stop();
        }
      };
    }, []);
    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);

    // Auto-grow height based on input content
    useEffect(() => {
      const textarea = inputRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(scrollHeight, 144)}px`;
      }
    }, [input]);

    const handleMicToggle = useCallback(() => {
      if (!recognition) return;

      if (isRecording) {
        recognition.stop();
      } else {
        onInputChange("");
        setVoiceInputStatus("Starting voice input...");
        recognition.start();
      }
    }, [isRecording, recognition, onInputChange]);

    const showMicButton = !input && !isSubmitting;
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
        style={{ width: "100%", position: "relative" }}
        className="flex-grow flex items-end"
      >
        <div
          className="flex items-end gap-2 w-full"
          style={{
            backgroundColor: "transparent",
            border: "none",
            boxShadow: "none",
            padding: "0px",
          }}
        >
          {showMicButton &&
            recognition &&
            micPermissionStatus !== "unsupported" && (
              <CustomTooltip
                title={isRecording ? "Stop Voice Input" : "Voice Input"}
                position="top"
              >
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    disabled={
                      isDisabled ||
                      !recognition ||
                      micPermissionStatus === "denied"
                    }
                    className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 mb-0.5 ${
                      isRecording ? "animate-pulse" : ""
                    }`}
                    style={{
                      background: isRecording
                        ? theme.colors.error
                        : theme.colors.accent,
                      color: "white",
                      boxShadow: isRecording
                        ? `0 0 15px ${theme.colors.error}60`
                        : `0 0 10px ${theme.colors.accent}40`,
                    }}
                    aria-label={
                      isRecording ? "Stop voice input" : "Start voice input"
                    }
                  >
                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>
              </CustomTooltip>
            )}

          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            onChange={(e) => {
              onInputChange(e.target.value);
              if (isRecording && recognition) {
                recognition.stop();
              }
            }}
            placeholder={voiceInputStatus || "Ask about your data..."}
            className="flex-grow py-1.5 px-3 text-base border-none resize-none overflow-y-auto placeholder-opacity-50 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "transparent",
              color: theme.colors.text,
              border: "none",
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.size.base,
              transition: "none",
              outline: "none",
              minHeight: "36px",
              maxHeight: "144px",
            }}
            disabled={
              isDisabled || isRecording || micPermissionStatus === "denied"
            }
            aria-disabled={
              isDisabled || isRecording || micPermissionStatus === "denied"
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  onSubmit(e);
                }
              }
            }}
          />

          {isSubmitting ? (
            <CustomTooltip title="Stop Request" position="top">
              <button
                type="button"
                onClick={onStopRequest}
                className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0 mb-0.5"
                style={{
                  background: theme.colors.error,
                  color: "white",
                  boxShadow: `0 0 10px ${theme.colors.error}40`,
                }}
                aria-label="Stop generating response"
              >
                <XSquare size={16} />
              </button>
            </CustomTooltip>
          ) : (
            <CustomTooltip title="Ask Question" position="top">
              <button
                type="submit"
                disabled={
                  isDisabled || isRecording || micPermissionStatus === "denied"
                }
                className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0 mb-0.5"
                style={{
                  background:
                    isDisabled ||
                    isRecording ||
                    micPermissionStatus === "denied"
                      ? `${theme.colors.text}20`
                      : theme.colors.accent,
                  color: "white",
                  boxShadow:
                    isDisabled ||
                    isRecording ||
                    micPermissionStatus === "denied"
                      ? "none"
                      : `0 0 10px ${theme.colors.accent}40`,
                }}
                aria-label="Send message"
              >
                <Send size={16} className="transition-transform duration-300" />
              </button>
            </CustomTooltip>
          )}
        </div>
      </form>
    );
  },
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
