import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Activity } from "../types/Event";

interface ActivityManagerProps {
  activities: Activity[];
  onActivitiesChange: (activities: Activity[]) => void;
}

export const ActivityManager: React.FC<ActivityManagerProps> = ({
  activities,
  onActivitiesChange,
}) => {
  const { theme } = useTheme();
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityDescription, setNewActivityDescription] = useState("");

  // Ensure activities is always an array
  const safeActivities = Array.isArray(activities) ? activities : [];

  const addActivity = () => {
    if (!newActivityName.trim()) {
      Alert.alert("Missing Information", "Please enter an activity name.");
      return;
    }

    const newActivity: Activity = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: newActivityName.trim(),
      description: newActivityDescription.trim() || undefined,
    };

    onActivitiesChange([...safeActivities, newActivity]);
    setNewActivityName("");
    setNewActivityDescription("");
  };

  const removeActivity = (activityId: string) => {
    const updatedActivities = safeActivities.filter(
      (activity) => activity.id !== activityId
    );
    onActivitiesChange(updatedActivities);
  };

  const updateActivity = (
    activityId: string,
    field: "name" | "description",
    value: string
  ) => {
    onActivitiesChange(
      safeActivities.map((activity) =>
        activity.id === activityId
          ? { ...activity, [field]: value || undefined }
          : activity
      )
    );
  };

  return (
    <View style={styles.container}>
      {/* Existing Activities */}
      {safeActivities.map((activity, index) => (
        <View
          key={activity.id}
          style={[
            styles.activityCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.activityHeader}>
            <Text
              style={[styles.activityNumber, { color: theme.textSecondary }]}
            >
              Activity {index + 1}
            </Text>
            <TouchableOpacity
              onPress={() => removeActivity(activity.id)}
              style={styles.removeButton}
            >
              <Text style={[styles.removeButtonText, { color: theme.primary }]}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.activityInput,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={activity.name}
            onChangeText={(value) => updateActivity(activity.id, "name", value)}
            placeholder="Activity name..."
            placeholderTextColor={theme.textSecondary}
          />

          <TextInput
            style={[
              styles.activityInput,
              styles.activityDescription,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={activity.description || ""}
            onChangeText={(value) =>
              updateActivity(activity.id, "description", value)
            }
            placeholder="Activity description (optional)..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>
      ))}

      {/* Add New Activity Section */}
      <View
        style={[
          styles.addActivityCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.addActivityTitle, { color: theme.text }]}>
          Add New Activity
        </Text>

        <TextInput
          style={[
            styles.activityInput,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          value={newActivityName}
          onChangeText={setNewActivityName}
          placeholder="Activity name..."
          placeholderTextColor={theme.textSecondary}
        />

        <TextInput
          style={[
            styles.activityInput,
            styles.activityDescription,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          value={newActivityDescription}
          onChangeText={setNewActivityDescription}
          placeholder="Activity description (optional)..."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={addActivity}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>Add Activity</Text>
        </TouchableOpacity>
      </View>

      {safeActivities.length === 0 && (
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No activities added yet. Add your first activity above!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  activityCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  activityNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activityInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  activityDescription: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  addActivityCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    borderStyle: "dashed",
  },
  addActivityTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 16,
  },
});
