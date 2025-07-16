import React from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTheme } from "../contexts/ThemeContext";
import { RootStackParamList } from "../navigation/AppNavigator";

type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Settings"
>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.text }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Dark Mode
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.textSecondary },
              ]}
            >
              Switch between light and dark themes
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={isDark ? theme.surface : "#f4f3f4"}
          />
        </View>

        <Text style={[styles.version, { color: theme.textSecondary }]}>
          AI Event Planner v1.0.0
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  version: {
    textAlign: "center",
    marginTop: "auto",
    marginBottom: 40,
    fontSize: 14,
  },
});
