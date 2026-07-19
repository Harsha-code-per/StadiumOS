"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, RotateCcw } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChatRole = "command-center" | "ground-crew" | "fan";

interface ChatMessage {
  sender: "user" | "copilot" | "error";
  text: string;
  /** If error, the original query so the retry button can re-send it */
  retryQuery?: string;
}

interface ChatWidgetProps {
  role: ChatRole;
  staffId?: string;
  /** Pre-seeded messages shown when widget first opens */
  initialMessages?: ChatMessage[];
  /** Placeholder text in the input */
  placeholder?: string;
  /** Quick-send suggestion chips */
  suggestions?: { label: string; query: string }[];
}

const renderMarkdown = (text: string) => {
  if (!text) return null;

  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("- ");
    let content = line;
    
    if (isBullet) {
      content = line.replace(/^\s*[\*\-]\s+/, "");
    }

    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
    const splitParts = content.split(regex);

    splitParts.forEach((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        parts.push(<strong key={partIdx} className="font-bold">{part.slice(2, -2)}</strong>);
      } else if (part.startsWith("*") && part.endsWith("*")) {
        parts.push(<em key={partIdx} className="italic">{part.slice(1, -1)}</em>);
      } else {
        parts.push(part);
      }
    });

    if (isBullet) {
      return (
        <li key={lineIdx} className="ml-4 list-disc pl-1 my-0.5">
          {parts}
        </li>
      );
    } else {
      return (
        <p key={lineIdx} className="min-h-[1em] mb-1 last:mb-0">
          {parts}
        </p>
      );
    }
  });
};

// ── Football SVG icon (matches the ⚽ emoji in the Header) ───────────────────

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,2 14.5,8 12,10 9.5,8" fill="currentColor" stroke="none" opacity="0.85" />
      <polygon points="12,22 9.5,16 12,14 14.5,16" fill="currentColor" stroke="none" opacity="0.85" />
      <polygon points="2,12 8,9.5 10,12 8,14.5" fill="currentColor" stroke="none" opacity="0.85" />
      <polygon points="22,12 16,14.5 14,12 16,9.5" fill="currentColor" stroke="none" opacity="0.85" />
      <polygon points="12,10 14.5,8 19,10 19,14 14.5,16 12,14 9.5,16 5,14 5,10 9.5,8" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChatWidget({
  role,
  staffId,
  initialMessages,
  placeholder = "Ask the Co-Pilot...",
  suggestions = [],
}: ChatWidgetProps) {
  const dialogId = useId();
  const titleId = `chat-title-${dialogId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [chatLog, setChatLog] = useState<ChatMessage[]>(
    initialMessages ?? [
      {
        sender: "copilot",
        text: "AI Co-Pilot is ready. Ask me anything about the live stadium situation.",
      },
    ]
  );
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (typeof logEndRef.current?.scrollIntoView === "function") {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLog, chatLoading]);

  // Focus management: when opening, move focus inside; when closing, return to FAB
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      fabRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard: Escape closes the widget
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Focus trap inside the chat panel
  useEffect(() => {
    if (!isOpen) return;
    const panel = document.getElementById(`chat-panel-${dialogId}`);
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, input, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    panel.addEventListener("keydown", trap);
    return () => panel.removeEventListener("keydown", trap);
  }, [isOpen, dialogId]);

  const sendMessage = useCallback(
    async (textToSend?: string) => {
      const text = textToSend ?? chatInput;
      if (!text.trim() || chatLoading) return;

      setChatLog(prev => [...prev, { sender: "user", text }]);
      setChatInput("");
      setChatLoading(true);

      try {
        const res = await api.copilotChat(role, text, staffId);
        setChatLog(prev => [...prev, { sender: "copilot", text: res.answer }]);
        if (!isOpen) setHasUnread(true);
      } catch (err: unknown) {
        const errorObj = err as Record<string, unknown> | null;
        const errorMessage = errorObj && typeof errorObj === "object" && "message" in errorObj ? String(errorObj.message) : "";
        const errorText =
          errorMessage.includes("timed out")
            ? "Connection timed out. The backend may be waking up from idle. Tap Retry to try again."
            : errorMessage || "Something went wrong. Please try again.";
        setChatLog(prev => [
          ...prev,
          { sender: "error", text: errorText, retryQuery: text },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [chatInput, chatLoading, role, staffId, isOpen]
  );

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  return (
    <>
      {/* ── Floating Panel ───────────────────────────────────────────── */}
      {isOpen && (
        <div
          id={`chat-panel-${dialogId}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm h-[460px] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <FootballIcon className="h-5 w-5" />
              <span id={titleId} className="font-bold text-sm">
                AI Co-Pilot
                <span className="ml-1.5 text-[10px] font-semibold opacity-75 uppercase tracking-wider">
                  {role === "command-center" ? "Command" : role === "ground-crew" ? "Field Crew" : "Fan Guide"}
                </span>
              </span>
            </div>
            <button
              ref={firstFocusRef}
              onClick={() => setIsOpen(false)}
              aria-label="Close Co-Pilot chat"
              className="rounded-full p-1 hover:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Message log */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-muted/10">
            {chatLog.map((msg, idx) => {
              if (msg.sender === "error") {
                return (
                  <div key={idx} className="mr-auto max-w-[90%] space-y-1.5">
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
                      ⚠️ {msg.text}
                    </div>
                    {msg.retryQuery && (
                      <button
                        onClick={() => {
                          setChatLog(prev => prev.filter((_, i) => i !== idx));
                          sendMessage(msg.retryQuery);
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-1"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retry
                      </button>
                    )}
                  </div>
                );
              }
              return (
                <div
                  key={idx}
                  className={`px-3 py-2.5 rounded-lg text-xs leading-relaxed max-w-[90%] ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-white border border-border text-foreground mr-auto shadow-sm"
                  }`}
                >
                  {renderMarkdown(msg.text)}
                </div>
              );
            })}
            {chatLoading && (
              <div className="mr-auto max-w-[90%] px-3 py-2.5 rounded-lg bg-white border border-border text-xs text-muted-foreground italic animate-pulse shadow-sm">
                Co-Pilot is analyzing...
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="px-3 py-2 border-t border-border bg-muted/20 flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.query)}
                  disabled={chatLoading}
                  className="text-[11px] px-2.5 py-1 border border-border bg-background hover:bg-muted text-muted-foreground font-medium rounded-full transition-colors disabled:opacity-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-border bg-background">
            <form
              onSubmit={e => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                ref={inputRef}
                placeholder={placeholder}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={chatLoading}
                className="h-9 text-sm bg-muted/30 border-border focus-visible:ring-primary"
                aria-label="Chat message input"
              />
              <Button
                type="submit"
                size="sm"
                disabled={chatLoading || !chatInput.trim()}
                aria-label="Send message"
                className="h-9 w-9 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ── Floating Action Button ───────────────────────────────────── */}
      <button
        ref={fabRef}
        onClick={handleOpen}
        aria-label="Open AI Co-Pilot chat"
        aria-expanded={isOpen}
        aria-controls={`chat-panel-${dialogId}`}
        className={`fixed bottom-6 right-4 sm:right-6 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:outline-none
          ${isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100 bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground"}`}
      >
        <FootballIcon className="h-7 w-7" />
        {/* Unread badge */}
        {hasUnread && (
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-background animate-pulse" aria-label="Unread AI response" />
        )}
      </button>
    </>
  );
}
