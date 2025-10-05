import { useState, useCallback } from "react";
import type { KeyboardEvent } from "react";

interface RovingFocusOptions {
  loop?: boolean;
}

interface RovingFocusItemProps {
  tabIndex: 0 | -1;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

export function useRovingFocus(length: number, options: RovingFocusOptions = {}) {
  const { loop = true } = options;
  const [activeIndex, setActiveIndex] = useState(0);

  const move = useCallback(
    (next: number) => {
      if (length === 0) {
        return;
      }

      const lastIndex = length - 1;
      let target = next;

      if (next < 0) {
        target = loop ? lastIndex : 0;
      } else if (next > lastIndex) {
        target = loop ? 0 : lastIndex;
      }

      setActiveIndex(target);
    },
    [length, loop],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (length === 0) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          move(activeIndex + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          move(activeIndex - 1);
          break;
        case "Home":
          event.preventDefault();
          move(0);
          break;
        case "End":
          event.preventDefault();
          move(length - 1);
          break;
        default:
          break;
      }
    },
    [activeIndex, length, move],
  );

  const getRovingProps = useCallback(
    (index: number): RovingFocusItemProps => ({
      tabIndex: index === activeIndex ? 0 : -1,
      onFocus: () => setActiveIndex(index),
      onKeyDown: handleKeyDown,
    }),
    [activeIndex, handleKeyDown],
  );

  return {
    activeIndex,
    setActiveIndex,
    getRovingProps,
  };
}

