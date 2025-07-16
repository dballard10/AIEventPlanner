import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTheme } from "../contexts/ThemeContext";
import { RootStackParamList } from "../navigation/AppNavigator";

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();

  const handleNewEventPress = () => {
    navigation.navigate("EventPlanning");
  };

  const handleSettingsPress = () => {
    navigation.navigate("Settings");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.surface }]}
          onPress={handleSettingsPress}
        >
          <Text style={[styles.settingsButtonText, { color: theme.text }]}>
            ⚙️ Settings
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.welcomeText, { color: theme.text }]}>
          Welcome to AI Event Planner
        </Text>
        <Text style={[styles.subtitleText, { color: theme.textSecondary }]}>
          Let AI help you plan amazing events with personalized suggestions and
          detailed planning.
        </Text>

        <TouchableOpacity
          style={[styles.newEventButton, { backgroundColor: theme.primary }]}
          onPress={handleNewEventPress}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Plan New Event</Text>
        </TouchableOpacity>

        <View style={styles.featureList}>
          <Text style={[styles.featureTitle, { color: theme.text }]}>
            Features:
          </Text>
          <Text style={[styles.featureItem, { color: theme.textSecondary }]}>
            • AI-powered event planning suggestions
          </Text>
          <Text style={[styles.featureItem, { color: theme.textSecondary }]}>
            • Detailed event organization
          </Text>
          <Text style={[styles.featureItem, { color: theme.textSecondary }]}>
            • Event history tracking
          </Text>
          <Text style={[styles.featureItem, { color: theme.textSecondary }]}>
            • Customizable event details
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 100,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  newEventButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 40,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  featureList: {
    alignItems: "flex-start",
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  featureItem: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 20,
  },
  settingsButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
