import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Theme {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string; // Blue for buttons
  border: string;
  shadow: string;
  isDark: boolean;
}

const lightTheme: Theme = {
  background: "#ffffff",
  surface: "#f8f9fa",
  text: "#000000",
  textSecondary: "#666666",
  primary: "#007AFF", // iOS Blue
  border: "#e1e1e1",
  shadow: "#00000020",
  isDark: false,
};

const darkTheme: Theme = {
  background: "#000000",
  surface: "#1a1a1a",
  text: "#ffffff",
  textSecondary: "#999999",
  primary: "#007AFF", // Same blue for consistency
  border: "#333333",
  shadow: "#ffffff20",
  isDark: true,
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("theme");
      if (savedTheme !== null) {
        setIsDark(savedTheme === "dark");
      }
    } catch (error) {
      console.log("Error loading theme preference:", error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");
    } catch (error) {
      console.log("Error saving theme preference:", error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
