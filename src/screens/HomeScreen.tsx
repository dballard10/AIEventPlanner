import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";
import { RootStackParamList, TabParamList } from "../navigation/AppNavigator";
import { Event, SerializableEvent } from "../types/Event";
import { EventService } from "../services/EventService";

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Home">,
  StackNavigationProp<RootStackParamList>
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [recentEvent, setRecentEvent] = useState<Event | null>(null);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const events = await EventService.getAllEvents();
      setTotalEvents(events.length);

      if (events.length > 0) {
        // Get the most recent event (first in the sorted array)
        setRecentEvent(events[0]);
      } else {
        setRecentEvent(null);
      }
    } catch (error) {
      console.log("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewEventPress = () => {
    navigation.navigate("EventPlanning");
  };

  const handleSettingsPress = () => {
    navigation.navigate("Settings");
  };

  const handleViewHistoryPress = () => {
    navigation.navigate("History");
  };

  const handleEditRecentEvent = () => {
    if (!recentEvent) return;

    const serializableEvent: SerializableEvent = {
      ...recentEvent,
      createdAt: recentEvent.createdAt.toISOString(),
      updatedAt: recentEvent.updatedAt.toISOString(),
    };
    navigation.navigate("EventPlanning", { editEvent: serializableEvent });
  };

  const handleViewRecentEventPlan = () => {
    if (!recentEvent?.aiGeneratedPlan) {
      Alert.alert(
        "No AI Plan",
        "This event doesn't have an AI-generated plan yet."
      );
      return;
    }

    navigation.navigate("AIEventPlan", {
      eventName: recentEvent.name,
      aiPlan: recentEvent.aiGeneratedPlan,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.appTitle, { color: theme.text }]}>
            AI Event Planner
          </Text>
          <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>
            Your intelligent event planning companion
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.surface }]}
          onPress={handleSettingsPress}
        >
          <MaterialIcons name="settings" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={[styles.welcomeCard, { backgroundColor: theme.surface }]}>
          <View style={styles.welcomeHeader}>
            <MaterialIcons
              name="emoji-people"
              size={24}
              color={theme.primary}
            />
            <Text style={[styles.welcomeTitle, { color: theme.text }]}>
              Welcome back!
            </Text>
          </View>
          <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
            Ready to plan your next amazing event?
          </Text>

          <TouchableOpacity
            style={[styles.newEventButton, { backgroundColor: theme.primary }]}
            onPress={handleNewEventPress}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={20} color="#ffffff" />
            <Text style={styles.newEventButtonText}>Plan New Event</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <MaterialIcons name="event" size={24} color={theme.primary} />
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {totalEvents}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Events Planned
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <MaterialIcons
              name="auto-awesome"
              size={24}
              color={theme.primary}
            />
            <Text style={[styles.statNumber, { color: theme.text }]}>AI</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Powered
            </Text>
          </View>
        </View>

        {/* Recent Event Section */}
        {recentEvent && (
          <View
            style={[styles.recentEventCard, { backgroundColor: theme.surface }]}
          >
            <View style={styles.recentEventHeader}>
              <Text style={[styles.recentEventTitle, { color: theme.text }]}>
                Recent Event
              </Text>
              <TouchableOpacity onPress={handleViewHistoryPress}>
                <Text style={[styles.viewAllText, { color: theme.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.eventDetails, { borderColor: theme.border }]}>
              <View style={styles.eventInfo}>
                <Text style={[styles.eventName, { color: theme.text }]}>
                  {recentEvent.name}
                </Text>
                <Text
                  style={[
                    styles.eventDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {recentEvent.description}
                </Text>
                <Text
                  style={[styles.eventDate, { color: theme.textSecondary }]}
                >
                  Created {formatDate(recentEvent.createdAt)}
                </Text>
              </View>

              <View style={styles.eventActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={handleEditRecentEvent}
                >
                  <MaterialIcons name="edit" size={16} color={theme.primary} />
                  <Text
                    style={[styles.actionButtonText, { color: theme.primary }]}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>

                {recentEvent.aiGeneratedPlan && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: theme.primary,
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={handleViewRecentEventPlan}
                  >
                    <MaterialIcons
                      name="auto-awesome"
                      size={16}
                      color="#ffffff"
                    />
                    <Text
                      style={[styles.actionButtonText, { color: "#ffffff" }]}
                    >
                      View Plan
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[
                styles.quickActionCard,
                { backgroundColor: theme.surface },
              ]}
              onPress={handleViewHistoryPress}
            >
              <MaterialIcons name="history" size={24} color={theme.primary} />
              <Text style={[styles.quickActionText, { color: theme.text }]}>
                View History
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                { backgroundColor: theme.surface },
              ]}
              onPress={() => navigation.navigate("Help")}
            >
              <MaterialIcons
                name="help-outline"
                size={24}
                color={theme.primary}
              />
              <Text style={[styles.quickActionText, { color: theme.text }]}>
                Help & Tips
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips Section */}
        {totalEvents === 0 && (
          <View style={[styles.tipsCard, { backgroundColor: theme.surface }]}>
            <View style={styles.tipsHeader}>
              <MaterialIcons name="lightbulb" size={20} color={theme.primary} />
              <Text style={[styles.tipsTitle, { color: theme.text }]}>
                Getting Started Tips
              </Text>
            </View>
            <Text style={[styles.tipItem, { color: theme.textSecondary }]}>
              • Be specific about your event goals for better AI suggestions
            </Text>
            <Text style={[styles.tipItem, { color: theme.textSecondary }]}>
              • Add detailed activities to get comprehensive planning
            </Text>
            <Text style={[styles.tipItem, { color: theme.textSecondary }]}>
              • Use the questions feature for personalized AI advice
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
    marginRight: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    padding: 20,
  },
  welcomeCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: "center",
  },
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 8,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  newEventButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  newEventButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
  recentEventCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  recentEventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  recentEventTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  eventDetails: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
  },
  eventInfo: {
    marginBottom: 10,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
  },
  eventActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  quickActionsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickActionCard: {
    width: "45%", // Adjust as needed for grid layout
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  quickActionText: {
    fontSize: 14,
    marginTop: 8,
  },
  tipsCard: {
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  tipItem: {
    fontSize: 14,
    marginBottom: 8,
  },
});
