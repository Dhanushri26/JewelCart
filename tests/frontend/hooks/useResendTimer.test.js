import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useResendTimer } from "../../../frontend/src/hooks/useResendTimer";

describe("useResendTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initialises with canResend=true and seconds=0", () => {
    const { result } = renderHook(() => useResendTimer(30));
    expect(result.current.seconds).toBe(0);
    expect(result.current.canResend).toBe(true);
  });

  it("start() sets seconds to initialSeconds and canResend to false", () => {
    const { result } = renderHook(() => useResendTimer(30));
    act(() => {
      result.current.start();
    });
    expect(result.current.seconds).toBe(30);
    expect(result.current.canResend).toBe(false);
  });

  it("counts down by 1 after 1 second", () => {
    const { result } = renderHook(() => useResendTimer(5));
    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.seconds).toBe(4);
  });

  it("reaches 0 and canResend becomes true after full countdown", async () => {
    const { result } = renderHook(() => useResendTimer(3));
    act(() => {
      result.current.start();
    });
    // Advance one tick at a time so React can re-render between each state update
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }
    expect(result.current.seconds).toBe(0);
    expect(result.current.canResend).toBe(true);
  });

  it("uses default of 30 seconds when no argument supplied", () => {
    const { result } = renderHook(() => useResendTimer());
    act(() => {
      result.current.start();
    });
    expect(result.current.seconds).toBe(30);
  });
});
