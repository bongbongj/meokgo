// src/hooks/usePolling.ts
// 일정 간격 폴링 (API명세서 14장: 참여 대기, 투표 현황·대기 5초)
// - 화면 진입 시 즉시 1회 실행 후 intervalMs 간격으로 반복
// - 앱이 백그라운드로 가면 멈추고, 다시 돌아오면 즉시 1회 실행 후 재개
// - 이전 요청이 끝나기 전에는 다음 요청을 보내지 않음

import { useEffect, useRef } from "react";
import { AppState } from "react-native";

export const POLLING_INTERVAL_MS = 5000;

export default function usePolling(
  task: () => Promise<void> | void,
  intervalMs: number = POLLING_INTERVAL_MS,
  enabled: boolean = true,
) {
  // 최신 task를 참조해 매 렌더마다 타이머를 다시 만들지 않는다
  const taskRef = useRef(task);
  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    let running = false;

    const run = async () => {
      if (running) return;
      running = true;
      try {
        await taskRef.current();
      } finally {
        running = false;
      }
    };

    const start = () => {
      if (timer) return;
      run();
      timer = setInterval(run, intervalMs);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    if (AppState.currentState !== "background") start();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") start();
      else if (state === "background") stop();
    });

    return () => {
      stop();
      subscription.remove();
    };
  }, [intervalMs, enabled]);
}
