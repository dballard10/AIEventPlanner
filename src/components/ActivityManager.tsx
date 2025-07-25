import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Activity } from "../types/Event";
import { CustomNotification } from "./CustomNotification";

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
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  // Ensure activities is always an array
  const safeActivities = Array.isArray(activities) ? activities : [];

  const addActivity = () => {
    if (!newActivityName.trim()) {
      setNotification({
        visible: true,
        message: "Please enter an activity name.",
        type: "error",
      });
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
    setShowNewActivityForm(false);
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

      {/* Add New Activity Button or Form */}
      {!showNewActivityForm ? (
        <TouchableOpacity
          style={[styles.addActivityButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowNewActivityForm(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addActivityButtonText}>Create New Activity</Text>
        </TouchableOpacity>
      ) : (
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

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                setShowNewActivityForm(false);
                setNewActivityName("");
                setNewActivityDescription("");
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={addActivity}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Add Activity</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CustomNotification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification({ ...notification, visible: false })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  activityCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  activityNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#ffe0e0",
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  activityInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 14,
  },
  activityDescription: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  addActivityButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  addActivityButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  addActivityCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  addActivityTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
