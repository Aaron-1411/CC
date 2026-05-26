import React, { createContext, useContext, useState, useEffect } from 'react'
import { DARK, LIGHT } from './theme.js'

const ThemeContext = createContext({ theme: DARK, dark: true, toggle: () => {} })

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('tastybot-theme') !== 'light')

  const toggle = () => setDark(d => {
    const next = !d
    localStorage.setItem('tastybot-theme', next ? 'dark' : 'light')
    return next
  })

  useEffect(() => {
    document.body.style.background = dark ? DARK.bg : LIGHT.bg
    document.body.style.margin = '0'
    document.body.style.transition = 'background 0.25s ease'
  }, [dark])

  return (
    <ThemeContext.Provider value={{ theme: dark ? DARK : LIGHT, dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
