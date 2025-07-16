import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Question } from "../types/Event";
import { CustomNotification } from "./CustomNotification";

interface QuestionManagerProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  questions,
  onQuestionsChange,
}) => {
  const { theme } = useTheme();
  const [newQuestion, setNewQuestion] = useState("");
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false);
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  // Ensure questions is always an array
  const safeQuestions = Array.isArray(questions) ? questions : [];

  const addQuestion = () => {
    if (!newQuestion.trim()) {
      setNotification({
        visible: true,
        message: "Please enter a question.",
        type: "error",
      });
      return;
    }

    const newQuestionObj: Question = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      question: newQuestion.trim(),
    };

    onQuestionsChange([...safeQuestions, newQuestionObj]);
    setNewQuestion("");
    setShowNewQuestionForm(false);
  };

  const removeQuestion = (questionId: string) => {
    const updatedQuestions = safeQuestions.filter(
      (question) => question.id !== questionId
    );
    onQuestionsChange(updatedQuestions);
  };

  const updateQuestion = (questionId: string, value: string) => {
    onQuestionsChange(
      safeQuestions.map((question) =>
        question.id === questionId ? { ...question, question: value } : question
      )
    );
  };

  return (
    <View style={styles.container}>
      {/* Existing Questions */}
      {safeQuestions.map((question, index) => (
        <View
          key={question.id}
          style={[
            styles.questionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.questionHeader}>
            <Text
              style={[styles.questionNumber, { color: theme.textSecondary }]}
            >
              Question {index + 1}
            </Text>
            <TouchableOpacity
              onPress={() => removeQuestion(question.id)}
              style={styles.removeButton}
            >
              <Text style={[styles.removeButtonText, { color: theme.primary }]}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.questionInput,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={question.question}
            onChangeText={(value) => updateQuestion(question.id, value)}
            placeholder="Enter your question for AI..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>
      ))}

      {/* Add New Question Button or Form */}
      {!showNewQuestionForm ? (
        <TouchableOpacity
          style={[styles.addQuestionButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowNewQuestionForm(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addQuestionButtonText}>Create New Question</Text>
        </TouchableOpacity>
      ) : (
        <View
          style={[
            styles.addQuestionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.addQuestionTitle, { color: theme.text }]}>
            Add New Question
          </Text>

          <TextInput
            style={[
              styles.questionInput,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={newQuestion}
            onChangeText={setNewQuestion}
            placeholder="Ask specific questions like 'What difficulty should I set for beginners?' or 'What food should I serve?'"
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
                setShowNewQuestionForm(false);
                setNewQuestion("");
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={addQuestion}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Add Question</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {safeQuestions.length === 0 && !showNewQuestionForm && (
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No questions added yet. Create your first question to get personalized
          AI advice!
        </Text>
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
  questionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  questionNumber: {
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
  questionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 80,
  },
  addQuestionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  addQuestionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  addQuestionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  addQuestionTitle: {
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
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 8,
    paddingHorizontal: 16,
  },
});
