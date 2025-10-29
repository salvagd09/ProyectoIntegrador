import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// Lista de clases
const THEME_CLASSES = [
    'theme-classic',
    'theme-tropical',
    'theme-dark',
    'theme-coral',
    'theme-deep-ocean',
];

const STORAGE_KEY = 'user-theme';
const DEFAULT_THEME = THEME_CLASSES[0]; 

// Lista de tamaños de fuente
const FONT_SCALES = {
    small: '87.5%', // ~14px base
    medium: '100%', // 16px base
    large: '112.5%', // ~18px base
};

const FONT_STORAGE_KEY = 'user-font-scale';
const DEFAULT_FONT_SCALE = FONT_SCALES.medium;

// Creación del contexto
const ThemeContext = createContext();

// Hook para acceder al contexto
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Inicializa el estado con el valor guardado en localStorage, o el valor por defecto
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    });

    const [fontScale, setFontScale] = useState(() => {
        const savedScale = localStorage.getItem(FONT_STORAGE_KEY);
        return FONT_SCALES[savedScale] ? savedScale : 'medium';
    });

    useEffect(() => {
        // Obtenemos el elemento html
        const rootElement = document.documentElement;
        
        // Limpiamos las clases de tema anteriores
        THEME_CLASSES.forEach(t => rootElement.classList.remove(t));
        
        // Aplicamos la nueva clase de tema
        rootElement.classList.add(theme);
        rootElement.style.setProperty('--font-scale-base', FONT_SCALES[fontScale]);
        
        // Guardamos la preferencia del usuario en el navegador
        localStorage.setItem(STORAGE_KEY, theme);
        localStorage.setItem(FONT_STORAGE_KEY, fontScale);
    }, [theme, fontScale]);

    // Función para hacer el cambio de tema
    const changeTheme = (newThemeClass) => {
        if (THEME_CLASSES.includes(newThemeClass)) {
            setTheme(newThemeClass);
        }
    };

    // Función para cambiar el tamaño de fuente
    const changeFontScale = (scaleKey) => {
        if (FONT_SCALES[scaleKey]) {
            setFontScale(scaleKey);
        }
    };

    // Optimizamos el valor del contexto para evitar re-renders innecesarios
    const contextValue = useMemo(() => ({
        currentTheme: theme,
        availableThemes: THEME_CLASSES,
        changeTheme,
        currentFontScale: fontScale,
        availableFontScales: FONT_SCALES,
        changeFontScale,
        // Helper para obtener el nombre legible (ej: "theme-dark" -> "Dark")
        getThemeName: (className) => className.replace('theme-', '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    }), [theme, fontScale]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};