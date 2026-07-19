/**
 * ChatWidget retry behavior test.
 * Verifies that when the copilotChat API returns a timeout error,
 * the retry button is rendered in the chat panel.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ChatWidget from "@/components/ChatWidget";
import * as apiModule from "@/lib/api";

// Mock the api module
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof apiModule>("@/lib/api");
  return {
    ...actual,
    api: {
      ...actual.api,
      copilotChat: vi.fn(),
    },
  };
});

describe("ChatWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the FAB (floating action button)", () => {
    render(<ChatWidget role="fan" />);
    const fab = screen.getByRole("button", { name: /open ai co-pilot chat/i });
    expect(fab).toBeTruthy();
  });

  it("opens the chat panel on FAB click", async () => {
    render(<ChatWidget role="fan" />);
    const fab = screen.getByRole("button", { name: /open ai co-pilot chat/i });
    fireEvent.click(fab);
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });
  });

  it("shows retry button when API times out", async () => {
    // Mock copilotChat to throw a timeout error
    vi.mocked(apiModule.api.copilotChat).mockRejectedValueOnce(
      new Error("Request timed out. The backend may be waking up from idle.")
    );

    render(<ChatWidget role="ground-crew" />);

    // Open widget
    const fab = screen.getByRole("button", { name: /open ai co-pilot chat/i });
    fireEvent.click(fab);
    await waitFor(() => screen.getByRole("dialog"));

    // Type and submit a message
    const input = screen.getByRole("textbox");
    await act(async () => {
      fireEvent.change(input, { target: { value: "What is the medical protocol?" } });
    });
    const sendBtn = screen.getByRole("button", { name: /send message/i });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    // The Retry button should appear in the error bubble
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
    });
  });

  it("closes on Escape key", async () => {
    render(<ChatWidget role="command-center" />);

    // Open
    const fab = screen.getByRole("button", { name: /open ai co-pilot chat/i });
    fireEvent.click(fab);
    await waitFor(() => screen.getByRole("dialog"));

    // Press Escape
    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeFalsy();
    });
  });
});
