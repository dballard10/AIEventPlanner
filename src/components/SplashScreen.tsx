import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../contexts/ThemeContext";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { theme } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Auto transition after 2 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.isDark ? ["#000000", "#1a1a1a"] : ["#ffffff", "#f8f9fa"]}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            AI Event Planner
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Plan Amazing Events with AI
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "300",
  },
});
