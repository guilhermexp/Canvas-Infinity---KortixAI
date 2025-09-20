import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

type Theme = 'dark' | 'light';
interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('dark'); // Default to dark

    useEffect(() => {
        try {
            const storedTheme = localStorage.getItem('theme') as Theme | null;
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (storedTheme) {
                setTheme(storedTheme);
            } else {
                setTheme(prefersDark ? 'dark' : 'light');
            }
        } catch (error) {
            console.error("Could not access theme from localStorage or system preference.", error);
            setTheme('dark'); // Fallback to dark
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        try {
            localStorage.setItem('theme', theme);
        } catch (error) {
            console.error("Could not save theme to localStorage.", error);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

    // Fix: Replaced JSX with React.createElement to be compatible with a .ts file extension.
    return React.createElement(ThemeContext.Provider, { value }, children);
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
