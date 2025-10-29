import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Form, Container } from 'react-bootstrap';

const ThemeSelector = () => {
    const { currentTheme, availableThemes, changeTheme, getThemeName } = useTheme();

    return (
        <Container className="my-4">
            <Form.Group className="d-flex align-items-center justify-content-end">
                <Form.Label className="me-3" style={{ color: 'var(--color-text)' }}>
                    Tema Actual:
                </Form.Label>
                <Form.Select 
                    value={currentTheme} 
                    onChange={(e) => changeTheme(e.target.value)}
                    // Aplicamos estilos basados en variables CSS para que el selector cambie de tema
                    style={{ 
                        backgroundColor: 'var(--color-header)', 
                        borderColor: 'var(--color-accent)',
                        color: 'var(--color-text)',
                        width: '200px'
                    }}
                >
                    {availableThemes.map(themeClass => (
                        <option key={themeClass} value={themeClass}>
                            {getThemeName(themeClass)}
                        </option>
                    ))}
                </Form.Select>
            </Form.Group>
        </Container>
    );
};

export default ThemeSelector;