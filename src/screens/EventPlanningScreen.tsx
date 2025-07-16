import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Calendar, DateData } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  CreateEventData,
  Activity,
  Question,
  SerializableEvent,
} from "../types/Event";
import { EventService } from "../services/EventService";
import { OpenAIService } from "../services/OpenAIService";
import { ActivityManager } from "../components/ActivityManager";
import { QuestionManager } from "../components/QuestionManager";
import { EventPlanModal } from "../components/EventPlanModal";
import { CustomNotification } from "../components/CustomNotification";
import { RouteProp } from "@react-navigation/native";

type EventPlanningScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "EventPlanning"
>;

type EventPlanningScreenRouteProp = RouteProp<
  RootStackParamList,
  "EventPlanning"
>;

interface FormField {
  key: string;
  label: string;
  required: boolean;
  multiline: boolean;
  keyboardType?: "numeric" | "default";
  placeholder?: string;
}

interface EventPlanningScreenProps {
  navigation: EventPlanningScreenNavigationProp;
  route: EventPlanningScreenRouteProp;
}

export const EventPlanningScreen: React.FC<EventPlanningScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const editEvent = route.params?.editEvent;

  // Helper function to migrate old string questions to new array format
  const migrateQuestionsData = (editEvent?: SerializableEvent): Question[] => {
    if (!editEvent?.aiQuestions) return [];

    // If it's already an array, return it
    if (Array.isArray(editEvent.aiQuestions)) {
      return editEvent.aiQuestions;
    }

    // If it's a string, convert it to a single question
    if (
      typeof editEvent.aiQuestions === "string" &&
      (editEvent.aiQuestions as string).trim()
    ) {
      return [
        {
          id: Date.now().toString(),
          question: (editEvent.aiQuestions as string).trim(),
        },
      ];
    }

    return [];
  };

  // Ensure arrays are always defined
  const safeActivities = editEvent?.activities ? [...editEvent.activities] : [];
  const safeSelectedDates = editEvent?.selectedDates
    ? [...editEvent.selectedDates]
    : [];
  const safeQuestions = migrateQuestionsData(editEvent);

  const [eventData, setEventData] = useState<CreateEventData>({
    name: editEvent?.name || "",
    description: editEvent?.description || "",
    numberOfPeople: editEvent?.numberOfPeople || undefined,
    location: editEvent?.location || "",
    goal: editEvent?.goal || "",
    activities: safeActivities,
    selectedDates: safeSelectedDates,
    startTime: editEvent?.startTime || undefined,
    endTime: editEvent?.endTime || undefined,
    isRecurring: editEvent?.isRecurring || false,
    recurringFrequency: editEvent?.recurringFrequency || undefined,
    aiQuestions: safeQuestions,
  });

  // UI state for time pickers and calendar
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRecurringDropdown, setShowRecurringDropdown] = useState(false);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});

  // AI functionality state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPlanGenerated, setAiPlanGenerated] = useState<string | null>(null);
  const [showAIPlanModal, setShowAIPlanModal] = useState(false);
  const [createdEventName, setCreatedEventName] = useState<string>("");
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugQuery, setDebugQuery] = useState<string>("");
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  const recurringOptions = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Biweekly", value: "biweekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ];

  // Initialize marked dates when editing
  useEffect(() => {
    if (
      editEvent &&
      Array.isArray(editEvent.selectedDates) &&
      editEvent.selectedDates.length > 0
    ) {
      const initialMarkedDates: { [key: string]: any } = {};
      editEvent.selectedDates.forEach((date) => {
        initialMarkedDates[date] = {
          selected: true,
          selectedColor: theme.primary,
        };
      });
      setMarkedDates(initialMarkedDates);
    }
  }, [editEvent, theme.primary]);

  const formFields: FormField[] = [
    { key: "name", label: "Event Name", required: true, multiline: false },
    {
      key: "description",
      label: "Description",
      required: true,
      multiline: true,
    },
    {
      key: "numberOfPeople",
      label: "Number of People",
      required: false,
      multiline: false,
      keyboardType: "numeric" as const,
    },
    { key: "goal", label: "Goal for Event", required: false, multiline: true },
  ];

  const handleInputChange = (field: keyof CreateEventData, value: string) => {
    setEventData((prev) => ({
      ...prev,
      [field]:
        field === "numberOfPeople"
          ? value
            ? parseInt(value)
            : undefined
          : value,
    }));
  };

  const handleActivitiesChange = (activities: Activity[]) => {
    setEventData((prev) => ({
      ...prev,
      activities: Array.isArray(activities) ? activities : [],
    }));
  };

  const handleQuestionsChange = (questions: Question[]) => {
    setEventData((prev) => ({
      ...prev,
      aiQuestions: Array.isArray(questions) ? questions : [],
    }));
  };

  const formatTimeToAMPM = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const parseTimeFromAMPM = (timeString: string): Date => {
    const [time, period] = timeString.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    let hour24 = hours;

    if (period === "PM" && hours !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hours === 12) {
      hour24 = 0;
    }

    date.setHours(hour24, minutes, 0, 0);
    return date;
  };

  const handleTimeChange = (
    event: any,
    selectedTime: Date | undefined,
    isStartTime: boolean
  ) => {
    if (selectedTime) {
      const timeString = formatTimeToAMPM(selectedTime);
      setEventData((prev) => ({
        ...prev,
        [isStartTime ? "startTime" : "endTime"]: timeString,
      }));
    }
  };

  const handleDateSelect = (day: DateData) => {
    const dateString = day.dateString;
    const currentDates = Array.isArray(eventData.selectedDates)
      ? eventData.selectedDates
      : [];

    let newDates: string[];
    let newMarkedDates: { [key: string]: any } = {};

    if (currentDates.includes(dateString)) {
      // Remove date if already selected
      newDates = currentDates.filter((date) => date !== dateString);
    } else {
      // Add date
      newDates = [...currentDates, dateString].sort();
    }

    // Update marked dates for visual feedback
    newDates.forEach((date) => {
      newMarkedDates[date] = {
        selected: true,
        selectedColor: theme.primary,
      };
    });

    setMarkedDates(newMarkedDates);
    setEventData((prev) => ({
      ...prev,
      selectedDates: newDates,
    }));
  };

  const handleRecurringToggle = () => {
    setEventData((prev) => ({
      ...prev,
      isRecurring: !prev.isRecurring,
      recurringFrequency: !prev.isRecurring
        ? undefined
        : prev.recurringFrequency,
    }));
  };

  const handleRecurringFrequencySelect = (
    frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly"
  ) => {
    setEventData((prev) => ({
      ...prev,
      recurringFrequency: frequency,
    }));
    setShowRecurringDropdown(false);
  };

  const formatSelectedDates = () => {
    const dates = Array.isArray(eventData.selectedDates)
      ? eventData.selectedDates
      : [];
    if (dates.length === 0) {
      return "No dates selected";
    }
    if (dates.length === 1) {
      return dates[0];
    }
    return `${dates.length} dates selected`;
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!eventData.name.trim() || !eventData.description.trim()) {
      setNotification({
        visible: true,
        message: "Please fill in both Event Name and Description.",
        type: "error",
      });
      return;
    }

    setIsGeneratingAI(true);

    try {
      if (editEvent) {
        // Update existing event
        await EventService.updateEvent(editEvent.id, eventData);
        setNotification({
          visible: true,
          message: "Event updated successfully!",
          type: "success",
        });
        // Navigate back after a short delay to show the notification
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        // Create new event with AI plan
        const savedEvent = await EventService.saveEvent(eventData, true);
        setAiPlanGenerated(savedEvent.aiGeneratedPlan || null);
        setCreatedEventName(savedEvent.name);

        if (savedEvent.aiGeneratedPlan) {
          // Show the AI plan in a modal
          setShowAIPlanModal(true);
        } else {
          setNotification({
            visible: true,
            message:
              "Event saved! AI plan generation failed - you can try generating it again later.",
            type: "error",
          });
          // Navigate back after a short delay to show the notification
          setTimeout(() => navigation.goBack(), 2000);
        }
      }
    } catch (error) {
      setNotification({
        visible: true,
        message: "Failed to save event. Please try again.",
        type: "error",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleRegenerateAI = async () => {
    if (!eventData.name.trim() || !eventData.description.trim()) {
      setNotification({
        visible: true,
        message: "Please fill in both Event Name and Description.",
        type: "error",
      });
      return;
    }

    setIsGeneratingAI(true);
    setAiPlanGenerated(null);

    try {
      const aiPlan = await OpenAIService.generateEventPlanString(eventData);
      setAiPlanGenerated(aiPlan);
      setNotification({
        visible: true,
        message: "AI plan regenerated successfully!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        visible: true,
        message: "Failed to generate AI plan. Please try again.",
        type: "error",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCloseAIPlanModal = () => {
    setShowAIPlanModal(false);
    setAiPlanGenerated(null);
    setCreatedEventName("");
    navigation.goBack();
  };

  const showOpenAIQuery = () => {
    const query = OpenAIService.getLastQuery();
    setDebugQuery(query);
    setShowDebugModal(true);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          {editEvent ? "Edit Your Event" : "Plan Your Event"}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {editEvent
            ? "Update the details below to modify your event."
            : "Fill in the details below and let AI help you create an amazing event plan!"}
        </Text>

        {formFields.map((field) => (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>
              {field.label} {field.required && "*"}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                field.multiline && styles.textInputMultiline,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={
                field.key === "numberOfPeople"
                  ? eventData[field.key]?.toString() || ""
                  : (eventData[field.key as keyof CreateEventData] as string) ||
                    ""
              }
              onChangeText={(value) =>
                handleInputChange(field.key as keyof CreateEventData, value)
              }
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}...`
              }
              placeholderTextColor={theme.textSecondary}
              multiline={field.multiline}
              numberOfLines={field.multiline ? 4 : 1}
              keyboardType={field.keyboardType || "default"}
            />
          </View>
        ))}

        {/* Location */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>
            Location
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={eventData.location}
            onChangeText={(text) =>
              setEventData((prev) => ({
                ...prev,
                location: text,
              }))
            }
            placeholder="Enter location..."
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Date Selection */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>
            Select Date(s)
          </Text>
          <TouchableOpacity
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                justifyContent: "center",
              },
            ]}
            onPress={() => setShowCalendar(true)}
          >
            <Text style={[styles.dateText, { color: theme.text }]}>
              {formatSelectedDates()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Selection */}
        <View style={styles.timeContainer}>
          <View style={[styles.fieldContainer, { flex: 1, marginRight: 10 }]}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>
              Start Time
            </Text>
            <TouchableOpacity
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  justifyContent: "center",
                },
              ]}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={[styles.dateText, { color: theme.text }]}>
                {eventData.startTime || "Select time"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.fieldContainer, { flex: 1, marginLeft: 10 }]}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>
              End Time
            </Text>
            <TouchableOpacity
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  justifyContent: "center",
                },
              ]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={[styles.dateText, { color: theme.text }]}>
                {eventData.endTime || "Select time"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recurring Event */}
        <View style={styles.fieldContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={handleRecurringToggle}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: theme.border,
                  backgroundColor: eventData.isRecurring
                    ? theme.primary
                    : "transparent",
                },
              ]}
            >
              {eventData.isRecurring && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.text }]}>
              Recurring Event
            </Text>
          </TouchableOpacity>

          {eventData.isRecurring && (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>
                Frequency
              </Text>
              <TouchableOpacity
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    justifyContent: "center",
                  },
                ]}
                onPress={() => setShowRecurringDropdown(true)}
              >
                <Text style={[styles.dateText, { color: theme.text }]}>
                  {eventData.recurringFrequency
                    ? recurringOptions.find(
                        (opt) => opt.value === eventData.recurringFrequency
                      )?.label
                    : "Select frequency"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Activities Section */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>
            Planned Activities
          </Text>
          <ActivityManager
            activities={
              Array.isArray(eventData.activities) ? eventData.activities : []
            }
            onActivitiesChange={handleActivitiesChange}
          />
        </View>

        {/* Questions Section */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>
            Questions for AI Assistant
          </Text>
          <QuestionManager
            questions={
              Array.isArray(eventData.aiQuestions) ? eventData.aiQuestions : []
            }
            onQuestionsChange={handleQuestionsChange}
          />
        </View>

        {/* AI Plan Display */}
        {(aiPlanGenerated || isGeneratingAI) && (
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>
              AI Generated Plan
            </Text>
            {isGeneratingAI ? (
              <View
                style={[
                  styles.aiPlanContainer,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text
                  style={[styles.aiPlanLoading, { color: theme.textSecondary }]}
                >
                  Generating your perfect event plan...
                </Text>
              </View>
            ) : aiPlanGenerated ? (
              <View
                style={[
                  styles.aiPlanContainer,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <ScrollView style={styles.aiPlanScroll} nestedScrollEnabled>
                  <Text style={[styles.aiPlanText, { color: theme.text }]}>
                    {aiPlanGenerated}
                  </Text>
                </ScrollView>
                <View style={styles.aiPlanActions}>
                  <TouchableOpacity
                    style={[
                      styles.debugButton,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={showOpenAIQuery}
                  >
                    <Text
                      style={[
                        styles.debugButtonText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      View Query
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.regenerateButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={handleRegenerateAI}
                    disabled={isGeneratingAI}
                  >
                    <Text style={styles.regenerateButtonText}>
                      Regenerate Plan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: isGeneratingAI
                ? theme.textSecondary
                : theme.primary,
            },
          ]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={isGeneratingAI}
        >
          <Text style={styles.submitButtonText}>
            {isGeneratingAI
              ? "Generating..."
              : editEvent
              ? "Update Event"
              : "Generate AI Event Plan"}
          </Text>
        </TouchableOpacity>

        {/* Calendar Modal */}
        <Modal
          visible={showCalendar}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCalendar(false)}
        >
          <View style={styles.modalContainer}>
            <View
              style={[styles.modalContent, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Select Date(s)
              </Text>
              <Calendar
                onDayPress={handleDateSelect}
                markedDates={markedDates}
                theme={{
                  backgroundColor: theme.surface,
                  calendarBackground: theme.surface,
                  textSectionTitleColor: theme.text,
                  selectedDayBackgroundColor: theme.primary,
                  selectedDayTextColor: "#ffffff",
                  todayTextColor: theme.primary,
                  dayTextColor: theme.text,
                  textDisabledColor: theme.textSecondary,
                  arrowColor: theme.primary,
                  monthTextColor: theme.text,
                }}
              />
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Recurring Frequency Modal */}
        <Modal
          visible={showRecurringDropdown}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowRecurringDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            onPress={() => setShowRecurringDropdown(false)}
          >
            <View
              style={[
                styles.dropdownContent,
                { backgroundColor: theme.surface },
              ]}
            >
              {recurringOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownItem,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() =>
                    handleRecurringFrequencySelect(option.value as any)
                  }
                >
                  <Text
                    style={[styles.dropdownItemText, { color: theme.text }]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Time Picker Modals */}
        <Modal
          visible={showStartTimePicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowStartTimePicker(false)}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.timePickerModalContent,
                { backgroundColor: theme.surface },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Select Start Time
              </Text>
              <DateTimePicker
                value={
                  eventData.startTime
                    ? parseTimeFromAMPM(eventData.startTime)
                    : new Date()
                }
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={(event, selectedTime) =>
                  handleTimeChange(event, selectedTime, true)
                }
                style={{
                  width: "100%",
                  backgroundColor: theme.surface,
                }}
                textColor={theme.text}
                accentColor={theme.primary}
                themeVariant={theme.isDark ? "dark" : "light"}
              />
              <View style={styles.timePickerButtons}>
                <TouchableOpacity
                  style={[
                    styles.timePickerButton,
                    { backgroundColor: theme.border },
                  ]}
                  onPress={() => setShowStartTimePicker(false)}
                >
                  <Text
                    style={[styles.timePickerButtonText, { color: theme.text }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.timePickerButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setShowStartTimePicker(false)}
                >
                  <Text style={styles.timePickerButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showEndTimePicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEndTimePicker(false)}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.timePickerModalContent,
                { backgroundColor: theme.surface },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Select End Time
              </Text>
              <DateTimePicker
                value={
                  eventData.endTime
                    ? parseTimeFromAMPM(eventData.endTime)
                    : new Date()
                }
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={(event, selectedTime) =>
                  handleTimeChange(event, selectedTime, false)
                }
                style={{
                  width: "100%",
                  backgroundColor: theme.surface,
                }}
                textColor={theme.text}
                accentColor={theme.primary}
                themeVariant={theme.isDark ? "dark" : "light"}
              />
              <View style={styles.timePickerButtons}>
                <TouchableOpacity
                  style={[
                    styles.timePickerButton,
                    { backgroundColor: theme.border },
                  ]}
                  onPress={() => setShowEndTimePicker(false)}
                >
                  <Text
                    style={[styles.timePickerButtonText, { color: theme.text }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.timePickerButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setShowEndTimePicker(false)}
                >
                  <Text style={styles.timePickerButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* AI Plan Success Modal */}
        <EventPlanModal
          visible={showAIPlanModal}
          onClose={handleCloseAIPlanModal}
          eventName={createdEventName}
          plan={aiPlanGenerated}
          mode="success"
          onViewHistory={() => {
            setShowAIPlanModal(false);
            navigation.navigate("MainTabs");
          }}
        />

        {/* Debug Query Modal */}
        <Modal
          visible={showDebugModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDebugModal(false)}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.surface, maxHeight: "80%" },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  OpenAI Query
                </Text>
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    { backgroundColor: theme.background },
                  ]}
                  onPress={() => setShowDebugModal(false)}
                >
                  <MaterialIcons name="close" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.debugQueryText,
                    { color: theme.text, fontFamily: "monospace" },
                  ]}
                >
                  {debugQuery}
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowDebugModal(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
      <CustomNotification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification({ ...notification, visible: false })}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  timeContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: "center",
  },
  modalButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  dropdownContent: {
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 200,
  },
  dropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  timePickerModalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: "90%",
    maxWidth: 400,
  },
  timePickerButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  timePickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 80,
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#ffffff",
  },
  aiPlanContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  aiPlanLoading: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  aiPlanScroll: {
    maxHeight: 300,
    marginBottom: 12,
  },
  aiPlanText: {
    fontSize: 14,
    lineHeight: 20,
  },
  regenerateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-end",
    flex: 1,
  },
  aiPlanActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  debugButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  regenerateButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  debugQueryText: {
    fontSize: 12,
    lineHeight: 16,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
});
