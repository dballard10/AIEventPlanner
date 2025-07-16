import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Event } from "../types/Event";
import { EventService } from "../services/EventService";
import { OpenAIService } from "../services/OpenAIService";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export const HistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEventPlan, setSelectedEventPlan] = useState<{
    eventName: string;
    plan: string;
  } | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const loadedEvents = await EventService.getAllEvents();
      setEvents(loadedEvents);
    } catch (error) {
      console.log("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const editEvent = (event: Event) => {
    navigation.navigate("EventPlanning", { editEvent: event });
  };

  const deleteEvent = async (eventId: string) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await EventService.deleteEvent(eventId);
            setEvents((prev) => prev.filter((event) => event.id !== eventId));
          } catch (error) {
            console.log("Error deleting event:", error);
          }
        },
      },
    ]);
  };

  const generateAIPlan = async (eventId: string) => {
    setGeneratingAI(eventId);
    try {
      const updatedEvent = await EventService.generateAIPlanForEvent(eventId);
      if (updatedEvent) {
        setEvents((prev) =>
          prev.map((event) => (event.id === eventId ? updatedEvent : event))
        );
        Alert.alert("Success!", "AI plan has been generated successfully!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to generate AI plan. Please try again.");
    } finally {
      setGeneratingAI(null);
    }
  };

  const viewFullAIPlan = (eventName: string, plan: string) => {
    setSelectedEventPlan({ eventName, plan });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEventPlan(null);
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <View
      style={[
        styles.eventCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.eventHeader}>
        <Text style={[styles.eventName, { color: theme.text }]}>
          {item.name}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => editEvent(item)}
            style={[styles.actionButton, styles.editButton]}
          >
            <Text style={[styles.editButtonText, { color: theme.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteEvent(item.id)}
            style={[styles.actionButton, styles.deleteButton]}
          >
            <Text style={[styles.deleteButtonText, { color: "#ff4444" }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.eventDescription, { color: theme.textSecondary }]}>
        {item.description}
      </Text>

      {item.location && (
        <Text style={[styles.eventDetail, { color: theme.textSecondary }]}>
          📍 {item.location}
        </Text>
      )}

      {item.selectedDates && item.selectedDates.length > 0 && (
        <Text style={[styles.eventDetail, { color: theme.textSecondary }]}>
          📅{" "}
          {item.selectedDates.length === 1
            ? item.selectedDates[0]
            : `${item.selectedDates.length} dates selected`}
        </Text>
      )}

      {item.startTime && (
        <Text style={[styles.eventDetail, { color: theme.textSecondary }]}>
          🕐 {item.startTime}
          {item.endTime && ` - ${item.endTime}`}
        </Text>
      )}

      {item.numberOfPeople && (
        <Text style={[styles.eventDetail, { color: theme.textSecondary }]}>
          👥 {item.numberOfPeople} people
        </Text>
      )}

      {item.isRecurring && (
        <Text style={[styles.eventDetail, { color: theme.textSecondary }]}>
          🔄 Recurring: {item.recurringFrequency}
        </Text>
      )}

      {item.activities && item.activities.length > 0 && (
        <View style={styles.activitiesSection}>
          <Text
            style={[styles.activitiesTitle, { color: theme.textSecondary }]}
          >
            🎯 Planned Activities ({item.activities.length}):
          </Text>
          {item.activities.slice(0, 3).map((activity, index) => (
            <Text
              key={activity.id}
              style={[styles.activityItem, { color: theme.textSecondary }]}
            >
              • {activity.name}
            </Text>
          ))}
          {item.activities.length > 3 && (
            <Text
              style={[styles.moreActivities, { color: theme.textSecondary }]}
            >
              ... and {item.activities.length - 3} more
            </Text>
          )}
        </View>
      )}

      {/* AI Plan Section */}
      {item.aiGeneratedPlan ? (
        <View
          style={[
            styles.aiPlanSection,
            { backgroundColor: theme.surface, borderLeftColor: theme.primary },
          ]}
        >
          <Text style={[styles.aiPlanTitle, { color: theme.text }]}>
            🤖 AI Generated Plan:
          </Text>
          <Text
            style={[styles.aiPlanPreview, { color: theme.textSecondary }]}
            numberOfLines={3}
          >
            {item.aiGeneratedPlan}
          </Text>
          <View style={styles.aiPlanButtons}>
            <TouchableOpacity
              style={[
                styles.viewFullPlanButton,
                { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => viewFullAIPlan(item.name, item.aiGeneratedPlan!)}
            >
              <Text
                style={[
                  styles.viewFullPlanButtonText,
                  { color: theme.primary },
                ]}
              >
                View Full Plan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.regenerateAIButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={() => generateAIPlan(item.id)}
              disabled={generatingAI === item.id}
            >
              <Text style={styles.regenerateAIButtonText}>
                {generatingAI === item.id
                  ? "Regenerating..."
                  : "Regenerate AI Plan"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.noAIPlanSection}>
          <TouchableOpacity
            style={[
              styles.generateAIButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={() => generateAIPlan(item.id)}
            disabled={generatingAI === item.id}
          >
            <Text style={styles.generateAIButtonText}>
              {generatingAI === item.id
                ? "🤖 Generating..."
                : "🤖 Generate AI Plan"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.eventDate, { color: theme.textSecondary }]}>
        Created: {item.createdAt.toLocaleDateString()}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
        No events planned yet!
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
        Start planning your first event from the Home tab.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading events...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* AI Plan Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                🤖 AI Generated Plan
              </Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: theme.background },
                ]}
                onPress={closeModal}
              >
                <Text style={[styles.closeButtonText, { color: theme.text }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            {selectedEventPlan && (
              <>
                <Text style={[styles.modalEventName, { color: theme.primary }]}>
                  {selectedEventPlan.eventName}
                </Text>
                <ScrollView style={styles.modalScrollView}>
                  {(() => {
                    // Handle edge cases with better user feedback
                    if (!selectedEventPlan.plan) {
                      return (
                        <View style={styles.noPlanContainer}>
                          <Text
                            style={[
                              styles.noPlanIcon,
                              { color: theme.textSecondary },
                            ]}
                          >
                            🤖❌
                          </Text>
                          <Text
                            style={[styles.noPlanTitle, { color: theme.text }]}
                          >
                            No AI Plan Available
                          </Text>
                          <Text
                            style={[
                              styles.noPlanText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            The AI plan for this event is missing. This could
                            happen if the plan generation failed during event
                            creation.
                          </Text>
                          <Text
                            style={[
                              styles.noPlanSuggestion,
                              { color: theme.textSecondary },
                            ]}
                          >
                            Try using the "Regenerate AI Plan" button to create
                            a new plan.
                          </Text>
                        </View>
                      );
                    }

                    if (typeof selectedEventPlan.plan !== "string") {
                      return (
                        <View style={styles.noPlanContainer}>
                          <Text
                            style={[
                              styles.noPlanIcon,
                              { color: theme.textSecondary },
                            ]}
                          >
                            ⚠️
                          </Text>
                          <Text
                            style={[styles.noPlanTitle, { color: theme.text }]}
                          >
                            Invalid Plan Format
                          </Text>
                          <Text
                            style={[
                              styles.noPlanText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            The AI plan data is in an unexpected format.
                          </Text>
                          <Text
                            style={[
                              styles.noPlanSuggestion,
                              { color: theme.textSecondary },
                            ]}
                          >
                            Please try regenerating the AI plan.
                          </Text>
                        </View>
                      );
                    }

                    if (selectedEventPlan.plan.trim().length === 0) {
                      return (
                        <View style={styles.noPlanContainer}>
                          <Text
                            style={[
                              styles.noPlanIcon,
                              { color: theme.textSecondary },
                            ]}
                          >
                            📝❌
                          </Text>
                          <Text
                            style={[styles.noPlanTitle, { color: theme.text }]}
                          >
                            Empty AI Plan
                          </Text>
                          <Text
                            style={[
                              styles.noPlanText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            The AI plan exists but appears to be empty.
                          </Text>
                          <Text
                            style={[
                              styles.noPlanSuggestion,
                              { color: theme.textSecondary },
                            ]}
                          >
                            Try regenerating the AI plan to get a complete plan.
                          </Text>
                        </View>
                      );
                    }

                    // If we get here, the plan should be valid
                    return (
                      <Text
                        style={[styles.modalPlanText, { color: theme.text }]}
                      >
                        {selectedEventPlan.plan}
                      </Text>
                    );
                  })()}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  eventCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: "#e0e0e0",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: "#ffe0e0",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  eventDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  eventDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  activitiesSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  activitiesTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  activityItem: {
    fontSize: 13,
    marginLeft: 8,
    marginBottom: 2,
  },
  moreActivities: {
    fontSize: 13,
    marginLeft: 8,
    fontStyle: "italic",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  loadingText: {
    fontSize: 16,
  },
  aiPlanSection: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  aiPlanTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  aiPlanPreview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  aiPlanButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  viewFullPlanButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  viewFullPlanButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  regenerateAIButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  regenerateAIButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  noAIPlanSection: {
    marginTop: 12,
    alignItems: "center",
  },
  generateAIButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  generateAIButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalEventName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalScrollView: {
    flex: 1,
  },
  modalPlanText: {
    fontSize: 14,
    lineHeight: 20,
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
});
