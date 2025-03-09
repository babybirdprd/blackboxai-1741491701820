import React from 'react';
import { useUI } from '../../context/AppContext';
import { ThemeTransition, useTheme } from '../theme/ThemeProvider';
import { SHORTCUTS } from '../../constants';
import { useKeyboardShortcuts } from '../../hooks';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const ui = useUI();
  const { isDark, toggleTheme } = useTheme();

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    [SHORTCUTS.GENERAL.SAVE]: () => {
      // Handle save
    },
    [SHORTCUTS.GENERAL.OPEN]: () => {
      // Handle open
    },
    [SHORTCUTS.GENERAL.NEW]: () => {
      // Handle new project
    }
  });

  const handleTogglePanel = (panelId: string) => {
    ui.togglePanel(panelId as any);
  };

  return (
    <ThemeTransition>
      <div className="h-screen flex flex-col bg-background-primary text-text-primary">
        {/* Header */}
        <header className="h-12 flex items-center justify-between px-4 bg-surface-primary border-b border-border">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">Video Assembler</h1>
            <nav className="hidden md:flex space-x-4">
              <button className="text-sm hover:text-primary">File</button>
              <button className="text-sm hover:text-primary">Edit</button>
              <button className="text-sm hover:text-primary">View</button>
              <button className="text-sm hover:text-primary">Help</button>
            </nav>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-surface-secondary"
              title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Left sidebar */}
          {ui.panels.assets.visible && (
            <aside className="w-64 border-r border-border bg-surface-primary overflow-y-auto">
              <div className="p-4">
                <h2 className="text-sm font-semibold mb-4">Assets</h2>
                {/* Assets panel content */}
              </div>
            </aside>
          )}

          {/* Center content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>

          {/* Right sidebar */}
          {ui.panels.effects.visible && (
            <aside className="w-80 border-l border-border bg-surface-primary overflow-y-auto">
              <div className="p-4">
                <h2 className="text-sm font-semibold mb-4">Effects</h2>
                {/* Effects panel content */}
              </div>
            </aside>
          )}
        </main>

        {/* Status bar */}
        <footer className="h-6 flex items-center justify-between px-4 bg-surface-primary border-t border-border text-xs">
          <div className="flex items-center space-x-4">
            <span>Ready</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleTogglePanel('assets')}
              className={`px-2 py-0.5 rounded ${
                ui.panels.assets.visible ? 'bg-primary text-white' : 'hover:bg-surface-secondary'
              }`}
            >
              Assets
            </button>
            <button
              onClick={() => handleTogglePanel('effects')}
              className={`px-2 py-0.5 rounded ${
                ui.panels.effects.visible ? 'bg-primary text-white' : 'hover:bg-surface-secondary'
              }`}
            >
              Effects
            </button>
            <button
              onClick={() => handleTogglePanel('script')}
              className={`px-2 py-0.5 rounded ${
                ui.panels.script.visible ? 'bg-primary text-white' : 'hover:bg-surface-secondary'
              }`}
            >
              Script
            </button>
          </div>
        </footer>
      </div>
    </ThemeTransition>
  );
};

export default Layout;