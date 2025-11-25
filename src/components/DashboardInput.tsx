import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Send, Mic, MicOff, XSquare } from "lucide-react";
import { ChatInputProps as DashboardInputProps } from "../types";
import { useTheme } from "../ThemeContext";
import CustomTooltip from "./CustomTooltip";
import SchemaExplorer from "./SchemaExplorer";
import schemaSampleData from "../data/sampleSchemaData";

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
    selectedConnection,
    disabled,
    isDbExplorerOpen,
    setIsDbExplorerOpen,
    onStopRequest,
  }) => {
    const { theme } = useTheme();
    const isDisabled = isSubmitting || disabled;
    const inputRef = useRef<HTMLInputElement>(null);
    const dbExplorerRef = useRef<HTMLDivElement>(null);
    const onInputChangeRef = useRef(onInputChange);
    const onSubmitRef = useRef(onSubmit);

    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(
      null
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
                  err
                );
              }
            });
        } else {
          console.warn(
            "navigator.mediaDevices is not available in this browser/context."
          );
          setMicPermissionStatus("unsupported");
          setVoiceInputStatus("");
        }
      } else {
        console.warn("Speech Recognition API not supported in this browser.");
        setMicPermissionStatus("unsupported");
        setVoiceInputStatus("");
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

    const handleColumnClick = useCallback(
      (columnName: string) => {
        if (inputRef.current) {
          const cursorPos = inputRef.current.selectionStart || 0;
          const textBefore = input.substring(0, cursorPos);
          const textAfter = input.substring(cursorPos);
          const newText = `${textBefore}${columnName}${textAfter}`;
          onInputChange(newText);
        }
      },
      [input, onInputChange]
    );

    return (
      <form
        onSubmit={onSubmit}
        style={{ background: theme.colors.background, width: "100%" }}
        className="flex-grow"
      >
        <div className="w-full h-full flex flex-col">
          {isDbExplorerOpen && (
            <div
              ref={dbExplorerRef}
              className="schema-explorer-container mb-2"
              style={{
                position: "relative",
                zIndex: 5,
              }}
            >
              <SchemaExplorer
                schemas={schemaSampleData}
                onClose={() => setIsDbExplorerOpen(false)}
                theme={theme}
                onColumnClick={handleColumnClick}
                selectedConnection={selectedConnection}
              />
            </div>
          )}

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
            {showMicButton &&
              recognition &&
              micPermissionStatus !== "unsupported" && (
                <CustomTooltip
                  title={isRecording ? "Stop Voice Input" : "Voice Input"}
                  position="top"
                >
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleMicToggle}
                      disabled={
                        isDisabled ||
                        !recognition ||
                        micPermissionStatus === "denied"
                      }
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0 ${isRecording ? "animate-pulse" : ""
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
                      {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <span
                      className={`absolute top-0 right-0 block w-3 h-3 rounded-full ring-2 ring-white ${getPermissionIndicatorColor()}`}
                      title={`Microphone status: ${micPermissionStatus}`}
                    ></span>
                  </div>
                </CustomTooltip>
              )}

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                onInputChange(e.target.value);
                if (isRecording && recognition) {
                  recognition.stop();
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
              }
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

            {isSubmitting ? (
              <CustomTooltip title="Stop Request" position="top">
                <button
                  type="button"
                  onClick={onStopRequest}
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0"
                  style={{
                    background: theme.colors.error,
                    color: "white",
                    boxShadow: `0 0 10px ${theme.colors.error}40`,
                  }}
                  aria-label="Stop generating response"
                >
                  <XSquare size={18} />
                </button>
              </CustomTooltip>
            ) : (
              <CustomTooltip title="Ask Question" position="top">
                <button
                  type="submit"
                  disabled={
                    isDisabled ||
                    isRecording ||
                    micPermissionStatus === "denied"
                  }
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0"
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
                  <Send
                    size={18}
                    className="transition-transform duration-300"
                  />
                </button>
              </CustomTooltip>
            )}
          </div>
        </div>
      </form>
    );
  }
);

const areEqual = (
  prevProps: ExtendedDashboardInputProps,
  nextProps: ExtendedDashboardInputProps
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
