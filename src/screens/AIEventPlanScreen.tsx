import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { RootStackParamList } from "../navigation/AppNavigator";

type AIEventPlanScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AIEventPlan"
>;

type AIEventPlanScreenRouteProp = RouteProp<RootStackParamList, "AIEventPlan">;

interface AIEventPlanScreenProps {
  navigation: AIEventPlanScreenNavigationProp;
  route: AIEventPlanScreenRouteProp;
}

export const AIEventPlanScreen: React.FC<AIEventPlanScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { eventName, aiPlan } = route.params;

  // Log the full AI response when screen loads
  React.useEffect(() => {
    console.log("[AIEventPlanScreen] === SCREEN LOADED ===");
    console.log("Event Name:", eventName);
    console.log("AI Plan Type:", typeof aiPlan);
    console.log("AI Plan Length:", aiPlan?.length || 0);
    console.log("=== FULL AI RESPONSE START ===");
    console.log(aiPlan);
    console.log("=== FULL AI RESPONSE END ===");
  }, [eventName, aiPlan]);

  // Parse markdown-like text and return styled components
  const parseMarkdownText = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("##")) {
        // Header line with ##
        const headerText = trimmedLine.replace(/^##\s*/, "");
        elements.push(
          <Text
            key={`header-${lineIndex}`}
            style={[styles.headerText, { color: theme.primary }]}
          >
            {headerText}
          </Text>
        );
        elements.push(
          <View
            key={`header-spacing-${lineIndex}`}
            style={styles.headerSpacing}
          />
        );
      } else if (trimmedLine.startsWith("#") && !trimmedLine.startsWith("##")) {
        // Header line with single # (but not ##)
        const headerText = trimmedLine.replace(/^#\s*/, "");
        elements.push(
          <Text
            key={`header-${lineIndex}`}
            style={[styles.headerText, { color: theme.primary }]}
          >
            {headerText}
          </Text>
        );
        elements.push(
          <View
            key={`header-spacing-${lineIndex}`}
            style={styles.headerSpacing}
          />
        );
      } else if (line.includes("**")) {
        // Line with bold text
        const parts = line.split("**");
        const lineElements: React.ReactNode[] = [];

        parts.forEach((part, partIndex) => {
          if (partIndex % 2 === 0) {
            // Regular text
            if (part.length > 0) {
              lineElements.push(
                <Text
                  key={`regular-${lineIndex}-${partIndex}`}
                  style={[styles.planText, { color: theme.text }]}
                >
                  {part}
                </Text>
              );
            }
          } else {
            // Bold text
            lineElements.push(
              <Text
                key={`bold-${lineIndex}-${partIndex}`}
                style={[styles.boldText, { color: theme.text }]}
              >
                {part}
              </Text>
            );
          }
        });

        if (lineElements.length > 0) {
          elements.push(
            <View key={`line-${lineIndex}`} style={styles.lineContainer}>
              {lineElements}
            </View>
          );
        }
      } else if (line.trim().length > 0) {
        // Regular text line
        elements.push(
          <Text
            key={`line-${lineIndex}`}
            style={[styles.planText, { color: theme.text }]}
          >
            {line}
          </Text>
        );
      } else {
        // Empty line - add spacing
        elements.push(
          <View key={`space-${lineIndex}`} style={styles.paragraphSpacing} />
        );
      }
    });

    return elements;
  };

  const renderPlanContent = () => {
    if (!aiPlan) {
      return (
        <View style={styles.noPlanContainer}>
          <View style={styles.noPlanIconContainer}>
            <MaterialIcons
              name="error-outline"
              size={40}
              color={theme.textSecondary}
            />
          </View>
          <Text style={[styles.noPlanTitle, { color: theme.text }]}>
            No AI Plan Available
          </Text>
          <Text style={[styles.noPlanText, { color: theme.textSecondary }]}>
            The AI plan for this event is missing. This could happen if the plan
            generation failed during event creation.
          </Text>
          <Text
            style={[styles.noPlanSuggestion, { color: theme.textSecondary }]}
          >
            Try going back and using the "Regenerate AI Plan" button.
          </Text>
        </View>
      );
    }

    if (typeof aiPlan !== "string") {
      return (
        <View style={styles.noPlanContainer}>
          <Text style={[styles.noPlanIcon, { color: theme.textSecondary }]}>
            ⚠️
          </Text>
          <Text style={[styles.noPlanTitle, { color: theme.text }]}>
            Invalid Plan Format
          </Text>
          <Text style={[styles.noPlanText, { color: theme.textSecondary }]}>
            The AI plan data is in an unexpected format.
          </Text>
          <Text
            style={[styles.noPlanSuggestion, { color: theme.textSecondary }]}
          >
            Please try regenerating the AI plan.
          </Text>
        </View>
      );
    }

    if (aiPlan.trim().length === 0) {
      return (
        <View style={styles.noPlanContainer}>
          <View style={styles.noPlanIconContainer}>
            <MaterialIcons
              name="description"
              size={32}
              color={theme.textSecondary}
            />
            <MaterialIcons
              name="error-outline"
              size={16}
              color={theme.textSecondary}
              style={styles.overlayIcon}
            />
          </View>
          <Text style={[styles.noPlanTitle, { color: theme.text }]}>
            Empty AI Plan
          </Text>
          <Text style={[styles.noPlanText, { color: theme.textSecondary }]}>
            The AI plan exists but appears to be empty.
          </Text>
          <Text
            style={[styles.noPlanSuggestion, { color: theme.textSecondary }]}
          >
            Try regenerating the AI plan to get a complete plan.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.markdownContainer}>{parseMarkdownText(aiPlan)}</View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.text }]}>
            ← Back to History
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          AI Generated Plan
        </Text>

        <Text style={[styles.eventName, { color: theme.primary }]}>
          {eventName}
        </Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={true}
        >
          {renderPlanContent()}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  eventName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  markdownContainer: {
    flex: 1,
  },
  planText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "left",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 28,
    textAlign: "left",
  },
  boldText: {
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 24,
  },
  lineContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  headerSpacing: {
    height: 12,
  },
  paragraphSpacing: {
    height: 8,
  },
  noPlanContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noPlanIcon: {
    fontSize: 50,
    marginBottom: 16,
  },
  noPlanIconContainer: {
    position: "relative",
    alignItems: "center",
    marginBottom: 16,
  },
  overlayIcon: {
    position: "absolute",
    top: -2,
    right: -4,
  },
  noPlanTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  noPlanText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  noPlanSuggestion: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
    paddingHorizontal: 20,
  },
});
