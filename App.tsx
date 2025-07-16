import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { SplashScreen } from "./src/components/SplashScreen";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <ThemeProvider>
      {showSplash ? (
        <SplashScreen onFinish={handleSplashFinish} />
      ) : (
        <AppNavigator />
      )}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
