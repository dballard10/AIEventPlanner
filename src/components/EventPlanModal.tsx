import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

interface EventPlanModalProps {
  visible: boolean;
  onClose: () => void;
  eventName: string;
  plan: string | null;
  mode?: "view" | "success"; // Different modes for different contexts
  onViewHistory?: () => void; // Only used in success mode
}

export const EventPlanModal: React.FC<EventPlanModalProps> = ({
  visible,
  onClose,
  eventName,
  plan,
  mode = "view",
  onViewHistory,
}) => {
  const { theme } = useTheme();

  // Log the full response when modal is opened and plan exists
  React.useEffect(() => {
    if (visible && plan) {
      console.log("[EventPlanModal] === DEBUG ===");
      console.log("Event Name:", eventName);
      console.log("Mode:", mode);
      console.log("Plan Type:", typeof plan);
      console.log("Plan Length:", plan.length);
      console.log("=== FULL AI RESPONSE START ===");
      console.log(plan);
      console.log("=== FULL AI RESPONSE END ===");
    }
  }, [visible, plan, eventName, mode]);

  const planContent = React.useMemo(() => {
    console.log("[EventPlanModal] renderPlanContent called");
    console.log("Plan value:", plan);
    console.log("Plan type:", typeof plan);
    console.log("Plan length:", plan?.length);

    // Handle edge cases with better user feedback
    if (!plan) {
      console.log("No plan - showing no plan message");
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
            Try using the "Regenerate AI Plan" button to create a new plan.
          </Text>
        </View>
      );
    }

    if (typeof plan !== "string") {
      console.log("Invalid plan type:", typeof plan);
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

    if (plan.trim().length === 0) {
      console.log("Empty plan");
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

    // If we get here, the plan should be valid
    console.log("Rendering valid plan content");
    console.log("Plan preview:", plan.substring(0, 100) + "...");
    return <Text style={[styles.planText, { color: theme.text }]}>{plan}</Text>;
  }, [plan, theme.text, theme.textSecondary]);

  const renderButtons = () => {
    if (mode === "success" && onViewHistory) {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.viewHistoryButton,
              {
                backgroundColor: theme.background,
                borderColor: theme.primary,
              },
            ]}
            onPress={onViewHistory}
          >
            <Text
              style={[styles.viewHistoryButtonText, { color: theme.primary }]}
            >
              View in History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.doneButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null; // No buttons for "view" mode, just the close X
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {visible && (
        <>
          {console.log(
            "[EventPlanModal] Modal is rendering, visible:",
            visible
          )}
          {console.log("[EventPlanModal] Event name:", eventName)}
          {console.log("[EventPlanModal] Plan exists:", !!plan)}
          {console.log("[EventPlanModal] Mode:", mode)}
        </>
      )}
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            {mode === "success" ? (
              <View style={styles.titleContainer}>
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Event Created Successfully!
                </Text>
              </View>
            ) : (
              <View style={styles.titleContainer}>
                <MaterialIcons
                  name="smart-toy"
                  size={24}
                  color={theme.primary}
                />
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  AI Generated Plan
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: theme.background },
              ]}
              onPress={onClose}
            >
              <MaterialIcons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.eventName, { color: theme.primary }]}>
            {eventName}
          </Text>

          {mode === "success" && (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Here's your AI-generated event plan:
            </Text>
          )}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {planContent}
          </ScrollView>

          {renderButtons()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "85%",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  eventName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
    maxHeight: 400,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  planText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "left",
  },
  noPlanContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noPlanIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  noPlanIconContainer: {
    position: "relative",
    alignItems: "center",
    marginBottom: 10,
  },
  overlayIcon: {
    position: "absolute",
    top: -2,
    right: -4,
  },
  noPlanTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noPlanText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 20,
  },
  noPlanSuggestion: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  viewHistoryButton: {
    borderWidth: 1,
  },
  viewHistoryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  doneButton: {},
  doneButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
