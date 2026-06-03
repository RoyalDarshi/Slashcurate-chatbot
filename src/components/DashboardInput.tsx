// DashboardInput.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import { Send, Mic, MicOff, XSquare } from "lucide-react";
import { ChatInputProps as DashboardInputProps } from "../types";
import { useTheme } from "../ThemeContext";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface ExtendedDashboardInputProps extends DashboardInputProps {
  isDbExplorerOpen: boolean;
  setIsDbExplorerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onStopRequest?: () => void;
}

const DashboardInput: React.FC<ExtendedDashboardInputProps> = React.memo(
  ({
    input,
    isSubmitting,
    onInputChange,
    onSubmit,
    disabled,
    onStopRequest,
    onFocus,
    onBlur,
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

    const activePlaceholder = "Ask: 'Show total sales by product line last month'...";

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
          setMicPermissionStatus("granted");
        };

        newRecognitionInstance.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join("");
          onInputChangeRef.current(transcript);
          setVoiceInputStatus("Processing...");
        };

        newRecognitionInstance.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          if (
            event.error === "not-allowed" ||
            event.error === "permission-denied"
          ) {
            setMicPermissionStatus("denied");
          } else if (event.error === "no-speech") {
            setVoiceInputStatus("No speech detected.");
          } else {
            setVoiceInputStatus(`Error: ${event.error}`);
          }
        };

        newRecognitionInstance.onend = () => {
          setIsRecording(false);
          setVoiceInputStatus("");
          if (
            inputRef.current?.value &&
            inputRef.current.value.trim().length > 0
          ) {
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
              }
            });
        } else {
          setMicPermissionStatus("unsupported");
        }
      } else {
        setMicPermissionStatus("unsupported");
      }
      return () => {
        if (newRecognitionInstance) newRecognitionInstance.stop();
      };
    }, []);

    useEffect(() => {
      if (inputRef.current) inputRef.current.focus();
    }, []);

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

    return (
      <form
        onSubmit={onSubmit}
        className="flex-grow flex items-center m-0 p-0 bg-transparent border-none shadow-none"
      >
        <div className="flex items-center gap-2 w-full bg-transparent p-0 border-none shadow-none">
          {showMicButton &&
            recognition &&
            micPermissionStatus !== "unsupported" && (
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={handleMicToggle}
                  disabled={
                    isDisabled ||
                    !recognition ||
                    micPermissionStatus === "denied"
                  }
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
                    isRecording ? "animate-pulse" : ""
                  }`}
                  style={{
                    background: isRecording
                      ? theme.colors.error
                      : `${theme.colors.accent}15`,
                    color: isRecording ? "white" : theme.colors.accent,
                    boxShadow: isRecording
                      ? `0 4px 14px ${theme.colors.error}40`
                      : "none",
                  }}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
            )}

          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            onChange={(e) => {
              onInputChange(e.target.value);
              if (isRecording && recognition) recognition.stop();
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={voiceInputStatus || activePlaceholder}
            className="flex-grow py-2.5 px-3 text-sm border-none bg-transparent resize-none overflow-y-auto no-scrollbar focus:outline-none focus:ring-0 disabled:opacity-40 max-h-36 min-h-[36px]"
            style={{
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily,
              outline: "none",
            }}
            disabled={
              isDisabled || isRecording || micPermissionStatus === "denied"
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) onSubmit(e);
              }
            }}
          />

          {isSubmitting ? (
            <button
              type="button"
              onClick={onStopRequest}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 text-white shadow-xs"
              style={{
                background: theme.colors.error,
                boxShadow: `0 4px 14px ${theme.colors.error}40`,
              }}
            >
              <XSquare size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={
                isDisabled ||
                isRecording ||
                micPermissionStatus === "denied" ||
                !input.trim()
              }
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 text-white"
              style={{
                background:
                  !input.trim() ||
                  isDisabled ||
                  isRecording ||
                  micPermissionStatus === "denied"
                    ? `${theme.colors.text}10`
                    : theme.colors.accent,
                color:
                  !input.trim() ||
                  isDisabled ||
                  isRecording ||
                  micPermissionStatus === "denied"
                    ? theme.colors.textSecondary
                    : "white",
                boxShadow:
                  !input.trim() ||
                  isDisabled ||
                  isRecording ||
                  micPermissionStatus === "denied"
                    ? "none"
                    : `0 4px 14px ${theme.colors.accent}40`,
              }}
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </form>
    );
  },
);

const areEqual = (
  prevProps: ExtendedDashboardInputProps,
  nextProps: ExtendedDashboardInputProps,
) => {
  return (
    prevProps.input === nextProps.input &&
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.selectedConnection === nextProps.selectedConnection &&
    prevProps.onSubmit === nextProps.onSubmit &&
    prevProps.onInputChange === nextProps.onInputChange &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isDbExplorerOpen === nextProps.isDbExplorerOpen &&
    prevProps.onStopRequest === nextProps.onStopRequest
  );
};

export default React.memo(DashboardInput, areEqual);
