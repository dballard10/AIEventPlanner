import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { RootStackParamList, TabParamList } from "../navigation/AppNavigator";
import { Event, SerializableEvent, Question } from "../types/Event";
import { EventService } from "../services/EventService";
import { CustomNotification } from "../components/CustomNotification";
import { ConfirmationModal } from "../components/ConfirmationModal";

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type HistoryScreenRouteProp = RouteProp<TabParamList, "History">;

type SortOption = "newest" | "oldest";

interface DateFilter {
  startDate?: Date;
  endDate?: Date;
}

export const HistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const route = useRoute<HistoryScreenRouteProp>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [dateFilter, setDateFilter] = useState<DateFilter>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSearchFilters, setShowSearchFilters] = useState(false);

  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    message: "",
    type: "success",
  });
  const [confirmationModal, setConfirmationModal] = useState<{
    visible: boolean;
    eventId: string;
    eventName: string;
  }>({
    visible: false,
    eventId: "",
    eventName: "",
  });

  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, [])
  );

  // Listen for navigation params to toggle search filters
  useEffect(() => {
    if (route.params?.toggleSearch) {
      setShowSearchFilters((prev) => !prev);
    }
  }, [route.params?.toggleSearch]);

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
    // Create a serializable version of the event by converting Date objects to strings
    const serializableEvent: SerializableEvent = {
      ...event,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
    navigation.navigate("EventPlanning", { editEvent: serializableEvent });
  };

  const deleteEvent = (eventId: string, eventName: string) => {
    setConfirmationModal({
      visible: true,
      eventId,
      eventName,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await EventService.deleteEvent(confirmationModal.eventId);
      setEvents((prev) =>
        prev.filter((event) => event.id !== confirmationModal.eventId)
      );
      setNotification({
        visible: true,
        message: "Event deleted successfully!",
        type: "success",
      });
    } catch (error) {
      console.log("Error deleting event:", error);
      setNotification({
        visible: true,
        message: "Failed to delete event. Please try again.",
        type: "error",
      });
    } finally {
      setConfirmationModal({ visible: false, eventId: "", eventName: "" });
    }
  };

  const generateAIPlan = async (eventId: string) => {
    setGeneratingAI(eventId);
    try {
      const updatedEvent = await EventService.generateAIPlanForEvent(eventId);
      if (updatedEvent) {
        setEvents((prev) =>
          prev.map((event) => (event.id === eventId ? updatedEvent : event))
        );
        setNotification({
          visible: true,
          message: "AI event plan generated successfully!",
          type: "success",
        });
      }
    } catch (error) {
      setNotification({
        visible: true,
        message: "Failed to generate AI plan. Please try again.",
        type: "error",
      });
    } finally {
      setGeneratingAI(null);
    }
  };

  // Search, filter, and sort logic
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((event) => {
        // Search in event name, description, goal, location
        const searchableText = [
          event.name,
          event.description,
          event.goal,
          event.location,
          // Search in activities
          ...(event.activities?.map((a) =>
            [a.name, a.description].filter(Boolean).join(" ")
          ) || []),
          // Search in questions
          ...(Array.isArray(event.aiQuestions)
            ? event.aiQuestions.map((q) => q.question)
            : typeof event.aiQuestions === "string" &&
              (event.aiQuestions as string).trim()
            ? [event.aiQuestions as string]
            : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    // Apply date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.createdAt);

        if (dateFilter.startDate && eventDate < dateFilter.startDate) {
          return false;
        }

        if (dateFilter.endDate) {
          // Set end date to end of day for inclusive filtering
          const endOfDay = new Date(dateFilter.endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (eventDate > endOfDay) {
            return false;
          }
        }

        return true;
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [events, searchQuery, dateFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter({});
    setSortBy("newest");
    setShowSearchFilters(false);
  };

  const hasActiveFilters =
    searchQuery.trim() ||
    dateFilter.startDate ||
    dateFilter.endDate ||
    sortBy !== "newest";

  const renderEventItem = ({ item }: { item: Event }) => {
    // Helper function to display questions with backward compatibility
    const getDisplayQuestions = (
      aiQuestions?: string | Question[]
    ): Question[] => {
      if (!aiQuestions) return [];

      // If it's already an array, return it
      if (Array.isArray(aiQuestions)) {
        return aiQuestions;
      }

      // If it's a string, convert it to a single question
      if (typeof aiQuestions === "string" && aiQuestions.trim()) {
        return [
          {
            id: "legacy-question",
            question: aiQuestions.trim(),
          },
        ];
      }

      return [];
    };

    const displayQuestions = getDisplayQuestions(item.aiQuestions);

    return (
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
              onPress={() => deleteEvent(item.id, item.name)}
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

        {/* Event Details Section */}
        <View style={styles.detailsSection}>
          {item.goal && (
            <View style={styles.detailRow}>
              <MaterialIcons
                name="flag"
                size={16}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.detailHeader, { color: theme.textSecondary }]}
              >
                Goal:
              </Text>
              <Text
                style={[styles.detailValue, { color: theme.textSecondary }]}
              >
                {item.goal}
              </Text>
            </View>
          )}

          {item.location && (
            <View style={styles.detailRow}>
              <MaterialIcons
                name="location-on"
                size={16}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.detailHeader, { color: theme.textSecondary }]}
              >
                Location:
              </Text>
              <Text
                style={[styles.detailValue, { color: theme.textSecondary }]}
              >
                {item.location}
              </Text>
            </View>
          )}

          {item.selectedDates && item.selectedDates.length > 0 && (
            <View style={styles.dateTimeContainer}>
              <View style={styles.detailRow}>
                <MaterialIcons
                  name="event"
                  size={16}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.detailHeader, { color: theme.textSecondary }]}
                >
                  Schedule:
                </Text>
              </View>
              {item.selectedDates.map((date, index) => (
                <View
                  key={index}
                  style={[
                    styles.scheduleItem,
                    {
                      backgroundColor:
                        theme.surface === "#ffffff"
                          ? "rgba(0,0,0,0.03)"
                          : "rgba(255,255,255,0.05)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scheduleDate,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  {item.startTime && (
                    <Text
                      style={[
                        styles.scheduleTime,
                        {
                          color: theme.textSecondary,
                          opacity: 0.8,
                        },
                      ]}
                    >
                      {item.startTime}
                      {item.endTime && ` - ${item.endTime}`}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {item.numberOfPeople && (
            <View style={styles.detailRow}>
              <MaterialIcons
                name="group"
                size={16}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.detailHeader, { color: theme.textSecondary }]}
              >
                Attendees:
              </Text>
              <Text
                style={[styles.detailValue, { color: theme.textSecondary }]}
              >
                {item.numberOfPeople} people
              </Text>
            </View>
          )}

          {item.isRecurring && (
            <View style={styles.detailRow}>
              <MaterialIcons
                name="repeat"
                size={16}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.detailHeader, { color: theme.textSecondary }]}
              >
                Recurring:
              </Text>
              <Text
                style={[styles.detailValue, { color: theme.textSecondary }]}
              >
                {item.recurringFrequency}
              </Text>
            </View>
          )}
        </View>

        {/* Activities Section */}
        {item.activities && item.activities.length > 0 && (
          <View style={styles.activitiesSection}>
            <View style={styles.detailRow}>
              <MaterialIcons
                name="assignment"
                size={16}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.detailHeader, { color: theme.textSecondary }]}
              >
                Planned Activities ({item.activities.length}):
              </Text>
            </View>
            {item.activities.map((activity, index) => (
              <View key={activity.id} style={styles.activityContainer}>
                <Text
                  style={[styles.activityName, { color: theme.textSecondary }]}
                >
                  • {activity.name}
                </Text>
                {activity.description && (
                  <Text
                    style={[
                      styles.activityDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {activity.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Questions Section */}
        {displayQuestions.length > 0 && (
          <View style={styles.questionsSection}>
            <View style={styles.detailRow}>
              <MaterialIcons
                name="help-outline"
                size={16}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.detailHeader, { color: theme.textSecondary }]}
              >
                AI Questions ({displayQuestions.length}):
              </Text>
            </View>
            {displayQuestions.map((question, index) => (
              <View key={question.id} style={styles.questionContainer}>
                <Text
                  style={[styles.questionText, { color: theme.textSecondary }]}
                >
                  • {question.question}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Plan Action Buttons Only */}
        {item.aiGeneratedPlan ? (
          <View style={styles.aiActionsSection}>
            <View style={styles.aiPlanButtons}>
              <TouchableOpacity
                style={[
                  styles.viewFullPlanButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => {
                  console.log("[HistoryScreen] Navigating to AI Plan Screen");
                  console.log("Event:", item.name);
                  console.log("Plan Length:", item.aiGeneratedPlan?.length);
                  navigation.navigate("AIEventPlan", {
                    eventName: item.name,
                    aiPlan: item.aiGeneratedPlan!,
                  });
                }}
              >
                <Text style={styles.viewFullPlanButtonText}>
                  View Full AI Plan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.regenerateAIButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => generateAIPlan(item.id)}
                disabled={generatingAI === item.id}
              >
                <Text
                  style={[
                    styles.regenerateAIButtonText,
                    { color: theme.primary },
                  ]}
                >
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
                  ? "Generating..."
                  : "Generate AI Plan"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.eventDate, { color: theme.textSecondary }]}>
          Created: {item.createdAt.toLocaleDateString()}
        </Text>
      </View>
    );
  };

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
      {/* Collapsible Search and Filter Section */}
      {showSearchFilters && (
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          {/* Search Bar */}
          <View
            style={[
              styles.searchInputContainer,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <MaterialIcons
              name="search"
              size={20}
              color={theme.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search events, activities, questions..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons
                  name="clear"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter and Sort Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    dateFilter.startDate ||
                    dateFilter.endDate ||
                    sortBy !== "newest"
                      ? theme.primary
                      : theme.background,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setShowFilterModal(true)}
            >
              <MaterialIcons
                name="filter-list"
                size={18}
                color={
                  dateFilter.startDate ||
                  dateFilter.endDate ||
                  sortBy !== "newest"
                    ? "#ffffff"
                    : theme.textSecondary
                }
              />
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color:
                      dateFilter.startDate ||
                      dateFilter.endDate ||
                      sortBy !== "newest"
                        ? "#ffffff"
                        : theme.textSecondary,
                  },
                ]}
              >
                Filter & Sort
              </Text>
            </TouchableOpacity>

            {(searchQuery.trim() ||
              dateFilter.startDate ||
              dateFilter.endDate ||
              sortBy !== "newest") && (
              <TouchableOpacity
                style={[
                  styles.clearButton,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
                onPress={clearFilters}
              >
                <Text
                  style={[styles.clearButtonText, { color: theme.primary }]}
                >
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Results Count */}
          <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
            {filteredAndSortedEvents.length}{" "}
            {filteredAndSortedEvents.length === 1 ? "event" : "events"} found
          </Text>
        </View>
      )}

      <FlatList
        data={filteredAndSortedEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilterModal}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Filter & Sort Events
              </Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: theme.background },
                ]}
                onPress={() => setShowFilterModal(false)}
              >
                <MaterialIcons name="close" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Date Filter Section */}
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Filter by Date Created
              </Text>

              <View style={styles.dateFilterContainer}>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    // Simple date presets for now
                    const today = new Date();
                    const lastWeek = new Date(
                      today.getTime() - 7 * 24 * 60 * 60 * 1000
                    );
                    setDateFilter({ startDate: lastWeek, endDate: today });
                  }}
                >
                  <Text style={[styles.dateButtonText, { color: theme.text }]}>
                    Last 7 days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    const today = new Date();
                    const lastMonth = new Date(
                      today.getTime() - 30 * 24 * 60 * 60 * 1000
                    );
                    setDateFilter({ startDate: lastMonth, endDate: today });
                  }}
                >
                  <Text style={[styles.dateButtonText, { color: theme.text }]}>
                    Last 30 days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    const today = new Date();
                    const lastYear = new Date(
                      today.getTime() - 365 * 24 * 60 * 60 * 1000
                    );
                    setDateFilter({ startDate: lastYear, endDate: today });
                  }}
                >
                  <Text style={[styles.dateButtonText, { color: theme.text }]}>
                    Last year
                  </Text>
                </TouchableOpacity>
              </View>

              {(dateFilter.startDate || dateFilter.endDate) && (
                <View
                  style={[
                    styles.activeDateFilter,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.activeDateFilterText, { color: theme.text }]}
                  >
                    {dateFilter.startDate
                      ? dateFilter.startDate.toLocaleDateString()
                      : "Any"}{" "}
                    -{" "}
                    {dateFilter.endDate
                      ? dateFilter.endDate.toLocaleDateString()
                      : "Any"}
                  </Text>
                  <TouchableOpacity onPress={() => setDateFilter({})}>
                    <MaterialIcons
                      name="clear"
                      size={18}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Sort Section */}
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, marginTop: 20 },
                ]}
              >
                Sort Order
              </Text>

              <View style={styles.sortContainer}>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    {
                      backgroundColor:
                        sortBy === "newest" ? theme.primary : theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setSortBy("newest")}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      { color: sortBy === "newest" ? "#ffffff" : theme.text },
                    ]}
                  >
                    Newest First
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    {
                      backgroundColor:
                        sortBy === "oldest" ? theme.primary : theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setSortBy("oldest")}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      { color: sortBy === "oldest" ? "#ffffff" : theme.text },
                    ]}
                  >
                    Oldest First
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.clearAllButton,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  clearFilters();
                  setShowFilterModal(false);
                }}
              >
                <Text
                  style={[styles.clearAllButtonText, { color: theme.primary }]}
                >
                  Clear All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomNotification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification({ ...notification, visible: false })}
      />
      <ConfirmationModal
        visible={confirmationModal.visible}
        title="Delete Event"
        message={`Are you sure you want to delete "${confirmationModal.eventName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setConfirmationModal({ visible: false, eventId: "", eventName: "" })
        }
      />
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
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 8,
    flexWrap: "wrap",
  },
  detailHeader: {
    fontSize: 14,
    fontWeight: "bold",
    minWidth: 70,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
  },
  eventDate: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  detailsSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  dateTimeContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 24,
    marginBottom: 3,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  scheduleDate: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  scheduleTime: {
    fontSize: 13,
    fontWeight: "400",
  },
  activitiesSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  activityContainer: {
    marginBottom: 4,
  },
  activityName: {
    fontSize: 13,
    marginLeft: 24,
    marginBottom: 2,
    fontWeight: "500",
  },
  activityDescription: {
    fontSize: 12,
    marginLeft: 32,
    fontStyle: "italic",
  },
  questionsSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  questionContainer: {
    marginBottom: 3,
    marginLeft: 24,
  },
  questionText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  aiActionsSection: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50", // A green color for AI actions
  },
  aiPlanButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 8,
  },
  regenerateAIButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  regenerateAIButtonText: {
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
  viewFullPlanButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginRight: 8,
  },
  viewFullPlanButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
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
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    marginLeft: 8,
  },
  resultsCount: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    borderRadius: 15,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  modalBody: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  dateFilterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  dateButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeDateFilter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginTop: 8,
  },
  activeDateFilterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sortContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  clearAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  applyButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  applyButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
