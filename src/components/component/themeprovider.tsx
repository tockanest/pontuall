"use client"

export default function ThemeProvider() {
    if (typeof window === "undefined") return null
    
    const theme = localStorage.getItem("theme")
    
    if (!theme) {
        document.documentElement.setAttribute("data-theme", "midnight")
        localStorage.setItem("theme", "midnight")
    }
    
    document.documentElement.setAttribute("data-theme", theme as string)
    return;
}