import AsyncStorage from "@react-native-async-storage/async-storage";
import { Event, CreateEventData } from "../types/Event";
import { OpenAIService } from "./OpenAIService";

export class EventService {
  private static readonly EVENTS_KEY = "events";

  static async saveEvent(
    eventData: CreateEventData,
    generateAIPlan: boolean = true
  ): Promise<Event> {
    try {
      const newEvent: Event = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...eventData,
        aiGeneratedPlan: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generate AI plan if requested
      if (generateAIPlan) {
        try {
          const aiPlan = await OpenAIService.generateEventPlanString(eventData);
          newEvent.aiGeneratedPlan = aiPlan;
        } catch (aiError) {
          console.warn("Failed to generate AI plan:", aiError);
          // Continue saving the event even if AI generation fails
        }
      }

      const existingEvents = await this.getAllEvents();
      const updatedEvents = [newEvent, ...existingEvents];

      await AsyncStorage.setItem(
        this.EVENTS_KEY,
        JSON.stringify(updatedEvents)
      );
      return newEvent;
    } catch (error) {
      console.error("Error saving event:", error);
      throw new Error("Failed to save event");
    }
  }

  static async getAllEvents(): Promise<Event[]> {
    try {
      const storedEvents = await AsyncStorage.getItem(this.EVENTS_KEY);
      if (!storedEvents) return [];

      const parsedEvents = JSON.parse(storedEvents).map((event: any) => ({
        ...event,
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt),
      }));

      return parsedEvents;
    } catch (error) {
      console.error("Error loading events:", error);
      return [];
    }
  }

  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const existingEvents = await this.getAllEvents();
      const updatedEvents = existingEvents.filter(
        (event) => event.id !== eventId
      );
      await AsyncStorage.setItem(
        this.EVENTS_KEY,
        JSON.stringify(updatedEvents)
      );
    } catch (error) {
      console.error("Error deleting event:", error);
      throw new Error("Failed to delete event");
    }
  }

  static async updateEvent(
    eventId: string,
    updates: Partial<Event>
  ): Promise<Event | null> {
    try {
      const existingEvents = await this.getAllEvents();
      const eventIndex = existingEvents.findIndex(
        (event) => event.id === eventId
      );

      if (eventIndex === -1) return null;

      const updatedEvent = {
        ...existingEvents[eventIndex],
        ...updates,
        updatedAt: new Date(),
      };

      existingEvents[eventIndex] = updatedEvent;
      await AsyncStorage.setItem(
        this.EVENTS_KEY,
        JSON.stringify(existingEvents)
      );
      return updatedEvent;
    } catch (error) {
      console.error("Error updating event:", error);
      throw new Error("Failed to update event");
    }
  }

  static async generateAIPlanForEvent(eventId: string): Promise<Event | null> {
    try {
      const existingEvents = await this.getAllEvents();
      const event = existingEvents.find((e) => e.id === eventId);

      if (!event) return null;

      const eventData: CreateEventData = {
        name: event.name,
        description: event.description,
        numberOfPeople: event.numberOfPeople,
        location: event.location,
        goal: event.goal,
        activities: event.activities,
        selectedDates: event.selectedDates,
        startTime: event.startTime,
        endTime: event.endTime,
        isRecurring: event.isRecurring,
        recurringFrequency: event.recurringFrequency,
        aiQuestions: event.aiQuestions, // Fixed: Include aiQuestions when regenerating
      };

      const aiPlan = await OpenAIService.generateEventPlanString(eventData);

      return await this.updateEvent(eventId, { aiGeneratedPlan: aiPlan });
    } catch (error) {
      console.error("Error generating AI plan for event:", error);
      throw new Error("Failed to generate AI plan");
    }
  }

  static async enhanceEventPlan(
    eventId: string,
    userRequest: string
  ): Promise<Event | null> {
    try {
      const existingEvents = await this.getAllEvents();
      const event = existingEvents.find((e) => e.id === eventId);

      if (!event) return null;

      const enhancedPlan = await OpenAIService.enhanceExistingPlan(
        event,
        userRequest
      );

      return await this.updateEvent(eventId, { aiGeneratedPlan: enhancedPlan });
    } catch (error) {
      console.error("Error enhancing event plan:", error);
      throw new Error("Failed to enhance event plan");
    }
  }

  static async getActivitySuggestions(
    eventType: string,
    numberOfPeople?: number,
    location?: string
  ): Promise<string[]> {
    try {
      return await OpenAIService.generateActivitySuggestions(
        eventType,
        numberOfPeople,
        location
      );
    } catch (error) {
      console.error("Error getting activity suggestions:", error);
      return [];
    }
  }
}
