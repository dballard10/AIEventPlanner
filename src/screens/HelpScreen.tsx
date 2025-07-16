import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { RootStackParamList } from "../navigation/AppNavigator";

type HelpScreenNavigationProp = StackNavigationProp<RootStackParamList, "Help">;

interface HelpScreenProps {
  navigation: HelpScreenNavigationProp;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={20} color={theme.text} />
          <Text style={[styles.backButtonText, { color: theme.text }]}>
            Back
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          About AI Event Planner
        </Text>

        <Text style={[styles.description, { color: theme.textSecondary }]}>
          AI Event Planner is your intelligent companion for creating amazing
          events. Let our AI help you plan every detail with personalized
          suggestions and comprehensive planning tools.
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            ✨ Key Features
          </Text>

          <View style={styles.featureItem}>
            <MaterialIcons
              name="auto-awesome"
              size={20}
              color={theme.primary}
            />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                AI-Powered Planning
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { color: theme.textSecondary },
                ]}
              >
                Get intelligent suggestions for activities, logistics, and event
                structure based on your requirements.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <MaterialIcons name="event-note" size={20} color={theme.primary} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                Detailed Organization
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { color: theme.textSecondary },
                ]}
              >
                Organize every aspect of your event including activities,
                timeline, materials, and recommendations.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <MaterialIcons name="history" size={20} color={theme.primary} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                Event History
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { color: theme.textSecondary },
                ]}
              >
                Keep track of all your past events with searchable history and
                easy editing capabilities.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <MaterialIcons name="tune" size={20} color={theme.primary} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                Customizable Details
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { color: theme.textSecondary },
                ]}
              >
                Tailor every event to your specific needs with flexible
                scheduling, activities, and custom questions for AI.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            🚀 Getting Started
          </Text>

          <View style={styles.stepItem}>
            <View
              style={[styles.stepNumber, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={[styles.stepText, { color: theme.textSecondary }]}>
              Tap "Plan New Event" to create your first event
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View
              style={[styles.stepNumber, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={[styles.stepText, { color: theme.textSecondary }]}>
              Fill in event details like name, description, and goals
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View
              style={[styles.stepNumber, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: theme.textSecondary }]}>
              Add activities and ask specific questions for AI assistance
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View
              style={[styles.stepNumber, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={[styles.stepText, { color: theme.textSecondary }]}>
              Let AI generate a comprehensive event plan for you
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.tipsHeader}>
            <MaterialIcons name="lightbulb" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Pro Tips
            </Text>
          </View>
          <Text style={[styles.tipItem, { color: theme.textSecondary }]}>
            • The more details you provide, the better your AI-generated plan
            will be
          </Text>
          <Text style={[styles.tipItem, { color: theme.textSecondary }]}>
            • Use the questions feature to get specific advice from AI
          </Text>
          <Text style={[styles.tipItem, { color: theme.textSecondary }]}>
            • Regenerate AI plans multiple times to explore different ideas
          </Text>
          <Text style={[styles.tipItem, { color: theme.textSecondary }]}>
            • Save events as templates by copying successful formats
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  tipItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
});
