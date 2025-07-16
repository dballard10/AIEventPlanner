export interface Activity {
  id: string;
  name: string;
  description?: string;
}

export interface Question {
  id: string;
  question: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  numberOfPeople?: number;
  location?: string;
  goal?: string;
  activities?: Activity[];
  selectedDates?: string[]; // Array of selected dates in YYYY-MM-DD format
  startTime?: string; // Optional start time in HH:MM format
  endTime?: string; // Optional end time in HH:MM format
  isRecurring?: boolean;
  recurringFrequency?: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
  aiQuestions?: Question[]; // Array of questions to ask AI for personalized advice
  aiGeneratedPlan?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Serializable version of Event for navigation params (converts Date to string)
export interface SerializableEvent
  extends Omit<Event, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  name: string;
  description: string;
  numberOfPeople?: number;
  location?: string;
  goal?: string;
  activities?: Activity[];
  selectedDates?: string[]; // Array of selected dates in YYYY-MM-DD format
  startTime?: string; // Optional start time in HH:MM format
  endTime?: string; // Optional end time in HH:MM format
  isRecurring?: boolean;
  recurringFrequency?: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
  aiQuestions?: Question[]; // Array of questions to ask AI for personalized advice
}

// New structured response interface for the refactored OpenAI API
export interface EventPlanResponse {
  overview: string;
  timeline: Array<{
    time: string;
    activity: string;
  }>;
  schedule: Array<{
    activity: string;
    details: string;
    location: string;
  }>;
  logistics: string[];
  materials: string[];
  recommendations: string[];
  tips: string[];
}
