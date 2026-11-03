// src/hooks/usePolling.ts

import { useEffect, useRef } from "react";
import { AppState } from "react-native";

/**
 * 화면 진입 시 1회 호출 + 이후 interval 간격 폴링
 * 앱이 백그라운드로 가면 중단, 포그라운드로 돌아오면 즉시 1회 호출 후 재개
 */
export function usePolling(task: () => void, interval: number, enabled = true) {
  const taskRef = useRef(task);

  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      taskRef.current();
      timer = setInterval(() => taskRef.current(), interval);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    start();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        if (!timer) start();
      } else {
        stop();
      }
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [interval, enabled]);
}
