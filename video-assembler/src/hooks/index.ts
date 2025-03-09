import { useEffect, useRef, useState, useCallback, RefObject } from 'react';
import { useUI, useTimeline } from '../context/AppContext';
import { SHORTCUTS } from '../constants';
import { debounce, throttle } from '../utils';

// Hook for handling keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey;
      const shift = event.shiftKey;
      
      const shortcutKey = [
        ctrl ? 'Ctrl+' : '',
        shift ? 'Shift+' : '',
        key.toUpperCase()
      ].join('');

      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        shortcuts[shortcutKey]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Hook for handling drag and drop
export const useDragAndDrop = <T extends HTMLElement>(
  onDrop: (files: FileList) => void,
  options: { accept?: string[] } = {}
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer?.files;
      if (!files) return;

      if (options.accept) {
        const validFiles = Array.from(files).filter(file =>
          options.accept?.some(ext => file.name.toLowerCase().endsWith(ext))
        );
        if (validFiles.length) {
          onDrop(files);
        }
      } else {
        onDrop(files);
      }
    };

    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);

    return () => {
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('drop', handleDrop);
    };
  }, [onDrop, options.accept]);

  return ref;
};

// Hook for handling resizable panels
export const useResizable = (
  initialWidth: number,
  options: { min?: number; max?: number; direction?: 'horizontal' | 'vertical' } = {}
) => {
  const [size, setSize] = useState(initialWidth);
  const isResizing = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    startPos.current = options.direction === 'vertical' ? e.clientY : e.clientX;
    startSize.current = size;
    document.body.style.cursor = options.direction === 'vertical' ? 'row-resize' : 'col-resize';
  }, [size, options.direction]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      const currentPos = options.direction === 'vertical' ? e.clientY : e.clientX;
      const diff = currentPos - startPos.current;
      const newSize = startSize.current + diff;

      if (
        (options.min === undefined || newSize >= options.min) &&
        (options.max === undefined || newSize <= options.max)
      ) {
        setSize(newSize);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [options.min, options.max, options.direction]);

  return { size, handleMouseDown };
};

// Hook for handling timeline zoom and scroll
export const useTimelineZoom = () => {
  const timeline = useTimeline();
  const ui = useUI();

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * 0.1;
      timeline.setZoom(timeline.zoom + delta);
    }
  }, [timeline]);

  useEffect(() => {
    const element = document.querySelector('.timeline-container');
    if (!element) return;

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return timeline.zoom;
};

// Hook for handling auto-save
export const useAutoSave = (
  save: () => Promise<void>,
  options: { interval?: number; enabled?: boolean } = {}
) => {
  const { interval = 5000, enabled = true } = options;
  const saveRef = useRef(save);
  
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (!enabled) return;

    const debouncedSave = debounce(() => saveRef.current(), interval);
    const handleChange = () => {
      debouncedSave();
    };

    window.addEventListener('beforeunload', handleChange);
    return () => window.removeEventListener('beforeunload', handleChange);
  }, [interval, enabled]);
};

// Hook for handling element measurements
export const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      setBounds({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  return [ref, bounds] as const;
};

// Hook for handling intersection observer
export const useIntersection = (
  ref: RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
};

// Hook for handling media queries
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

// Export all hooks
export const hooks = {
  useKeyboardShortcuts,
  useDragAndDrop,
  useResizable,
  useTimelineZoom,
  useAutoSave,
  useMeasure,
  useIntersection,
  useMediaQuery
};