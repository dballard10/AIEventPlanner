export interface Activity {
  id: string;
  name: string;
  description?: string;
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
  aiGeneratedPlan?: string;
  createdAt: Date;
  updatedAt: Date;
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
