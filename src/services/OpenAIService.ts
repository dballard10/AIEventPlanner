import OpenAI from "openai";
import { OPENAI_API_KEY } from "@env";
import {
  CreateEventData,
  Event,
  EventPlanResponse,
  Question,
} from "../types/Event";

export class OpenAIService {
  private static openai: OpenAI | null = null;
  private static lastQuery: string = "";
  private static debugMode: boolean = true; // Enable debug mode

  static getLastQuery(): string {
    return this.lastQuery;
  }

  static setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  private static initializeOpenAI(): OpenAI {
    if (!this.openai) {
      if (!OPENAI_API_KEY) {
        throw new Error(
          "OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file."
        );
      }
      this.openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  static async generateEventPlan(
    eventData: CreateEventData
  ): Promise<EventPlanResponse> {
    try {
      const openai = this.initializeOpenAI();

      // Build the structured input message
      const eventInput = this.buildEventInput(eventData);
      const notSpecifiedFields = this.getNotSpecifiedFields(eventData);

      // Store the query for debugging
      this.lastQuery = eventInput;

      // Log the query if debug mode is enabled
      if (this.debugMode) {
        console.log("OpenAI Query (Event Input):", eventInput);
        console.log("Not Specified Fields:", notSpecifiedFields);
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 800,
        messages: [
          {
            role: "system",
            content: [
              "You are an expert event planner and host-coach.",
              "You produce highly structured, practical, and engaging plans.",
              "Always respect any user‑provided details and only build on them—never overwrite.",
              'If a field is missing or marked "Not specified," offer a thoughtful recommendation aligned with the event\'s theme.',
              "If the user has provided specific questions in 'Questions for AI', address these questions throughout your plan and include specific answers in the recommendations section.",
            ].join("\n"),
          },
          {
            role: "user",
            content: ["### Event Input", eventInput].join("\n"),
          },
          {
            role: "user",
            content: [
              "### Output Requirements",
              "Please return a JSON object matching this schema:",
              "```json",
              "{",
              '  "overview": "string",',
              '  "timeline": [',
              '    {"time": "H:MM AM/PM", "activity": "string"}',
              "  ],",
              '  "schedule": [',
              '    {"activity": "string", "details": "string", "location": "string"}',
              "  ],",
              '  "logistics": ["string"],',
              '  "materials": ["string"],',
              '  "recommendations": ["string"],',
              '  "tips": ["string"]',
              "}",
              "```",
              "IMPORTANT: Use 12-hour time format with AM/PM for all times (e.g., '9:00 AM', '2:30 PM', '11:45 PM').",
              "FORMAT: When converted to text, the Activity Schedule section should be formatted as a bulleted list instead of subheaders.",
              "Make the plan practical, engaging, and tailored to the provided details.",
            ].join("\n"),
          },
        ],
      });

      const generatedContent = response.choices[0]?.message?.content;

      if (!generatedContent) {
        throw new Error("Failed to generate event plan");
      }

      // Parse the JSON response with robust error handling
      try {
        const eventPlan: EventPlanResponse = JSON.parse(generatedContent);
        console.log("Successfully parsed JSON directly");
        return eventPlan;
      } catch (parseError) {
        console.log("Initial parse failed, attempting enhanced parsing...");
        if (this.debugMode) {
          console.log(
            "Raw response content (full):",
            JSON.stringify(generatedContent)
          );
          console.log("Raw response length:", generatedContent.length);
        }

        // Multiple fallback strategies to extract JSON
        let cleanedContent = generatedContent;

        // Strategy 1: Remove all markdown formatting aggressively
        // First, try to find JSON within code blocks
        let jsonMatch = cleanedContent.match(
          /```(?:json)?\s*\n?([\s\S]*?)\n?```/
        );
        if (jsonMatch) {
          cleanedContent = jsonMatch[1];
          if (this.debugMode)
            console.log("Found markdown block, extracted content");
        }

        // Strategy 2: Find the JSON object boundaries more aggressively
        const jsonStart = cleanedContent.indexOf("{");
        const jsonEnd = cleanedContent.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
          if (this.debugMode) console.log("Extracted JSON object boundaries");
        }

        // Strategy 3: Aggressive cleanup of problematic characters
        cleanedContent = cleanedContent
          .replace(/```/g, "") // Remove ALL backticks
          .replace(/`/g, "") // Remove single backticks too
          .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
          .replace(/\n\s*\n/g, "\n") // Remove empty lines
          .replace(/^\s+|\s+$/g, "") // Trim whitespace
          .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes with regular quotes
          .replace(/[\u2018\u2019]/g, "'"); // Replace smart single quotes

        if (this.debugMode) {
          console.log(
            "After aggressive cleanup, first 200 chars:",
            cleanedContent.substring(0, 200)
          );
          console.log("Cleaned content length:", cleanedContent.length);
        }

        // Strategy 4: Check for specific problematic characters
        const problematicChars = cleanedContent.match(
          /[`\u201C\u201D\u2018\u2019]/g
        );
        if (problematicChars) {
          console.warn("⚠️ Found problematic characters:", problematicChars);
          if (this.debugMode) {
            console.warn(
              "Character codes:",
              problematicChars.map((char) => char.charCodeAt(0))
            );
          }
        }

        // Additional check for any remaining backticks
        const backtickCount = (cleanedContent.match(/`/g) || []).length;
        if (backtickCount > 0) {
          console.warn(
            `⚠️ Still found ${backtickCount} backticks in cleaned content`
          );
          if (this.debugMode) {
            console.warn(
              "Positions:",
              cleanedContent
                .split("")
                .map((char, index) => (char === "`" ? index : null))
                .filter((pos) => pos !== null)
            );
          }
        }

        try {
          const eventPlan: EventPlanResponse = JSON.parse(cleanedContent);
          console.log("Successfully parsed JSON after enhanced cleanup");
          return eventPlan;
        } catch (secondParseError) {
          const errorMessage =
            secondParseError instanceof Error
              ? secondParseError.message
              : String(secondParseError);
          console.error("Enhanced parsing failed:", errorMessage);
          if (this.debugMode) {
            console.log(
              "Cleaned content that failed:",
              JSON.stringify(cleanedContent)
            );
          }

          // Last resort: return a fallback structured response
          console.warn("Using fallback structured response");
          return {
            overview:
              "Unable to parse AI response. Please regenerate the plan.",
            timeline: [],
            schedule: [],
            logistics: ["Error occurred during plan generation"],
            materials: [],
            recommendations: ["Please try regenerating the AI plan"],
            tips: [],
          };
        }
      }
    } catch (error) {
      console.error("Error generating event plan:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate event plan: ${error.message}`);
      }
      throw new Error("Failed to generate event plan: Unknown error");
    }
  }

  private static buildEventInput(eventData: CreateEventData): string {
    return [
      `- **Title:** ${eventData.name || "Not specified"}`,
      `- **Description:** ${eventData.description || "Not specified"}`,
      `- **Attendees:** ${eventData.numberOfPeople || "Not specified"}`,
      `- **Location:** ${eventData.location || "Not specified"}`,
      `- **Purpose:** ${eventData.goal || "Not specified"}`,
      `- **Date:** ${
        eventData.selectedDates && eventData.selectedDates.length > 0
          ? eventData.selectedDates.join(", ")
          : "Not specified"
      }`,
      `- **Start Time:** ${eventData.startTime || "Not specified"}`,
      `- **End Time:** ${eventData.endTime || "Not specified"}`,
      `- **Recurring:** ${
        eventData.isRecurring
          ? `Yes (${eventData.recurringFrequency || "frequency not specified"})`
          : "No"
      }`,
      `- **Activities:** ${
        eventData.activities && eventData.activities.length > 0
          ? eventData.activities
              .map(
                (a) => `${a.name}${a.description ? ` (${a.description})` : ""}`
              )
              .join(", ")
          : "Not specified"
      }`,
      `- **Questions for AI:** ${
        eventData.aiQuestions && eventData.aiQuestions.length > 0
          ? eventData.aiQuestions.map((q) => q.question).join("; ")
          : "Not specified"
      }`,
      `- **Not specified fields:** ${this.getNotSpecifiedFields(eventData)}`,
    ].join("\n");
  }

  private static getNotSpecifiedFields(eventData: CreateEventData): string {
    const notSpecified: string[] = [];

    if (!eventData.name) notSpecified.push("Title");
    if (!eventData.description) notSpecified.push("Description");
    if (!eventData.numberOfPeople) notSpecified.push("Attendees");
    if (!eventData.location) notSpecified.push("Location");
    if (!eventData.goal) notSpecified.push("Purpose");
    if (!eventData.selectedDates || eventData.selectedDates.length === 0)
      notSpecified.push("Date");
    if (!eventData.startTime) notSpecified.push("Start Time");
    if (!eventData.endTime) notSpecified.push("End Time");
    if (!eventData.activities || eventData.activities.length === 0)
      notSpecified.push("Activities");
    if (!eventData.aiQuestions || eventData.aiQuestions.length === 0)
      notSpecified.push("Questions for AI");

    return notSpecified.length > 0 ? notSpecified.join(", ") : "None";
  }

  // Legacy method that returns formatted string (for backward compatibility)
  static async generateEventPlanString(
    eventData: CreateEventData
  ): Promise<string> {
    const structuredPlan = await this.generateEventPlan(eventData);

    // Convert structured response back to formatted string
    let formattedPlan = `## Event Overview\n${structuredPlan.overview}\n\n`;

    if (structuredPlan.timeline.length > 0) {
      formattedPlan += `## Timeline\n`;
      structuredPlan.timeline.forEach((item) => {
        formattedPlan += `- **${item.time}:** ${item.activity}\n`;
      });
      formattedPlan += `\n`;
    }

    if (structuredPlan.schedule.length > 0) {
      formattedPlan += `## Activity Schedule\n`;
      structuredPlan.schedule.forEach((item) => {
        formattedPlan += `- **${item.activity}** - ${item.details} (Location: ${item.location})\n`;
      });
      formattedPlan += `\n`;
    }

    if (structuredPlan.logistics.length > 0) {
      formattedPlan += `## Logistics\n`;
      structuredPlan.logistics.forEach((item) => {
        formattedPlan += `- ${item}\n`;
      });
      formattedPlan += `\n`;
    }

    if (structuredPlan.materials.length > 0) {
      formattedPlan += `## Materials Needed\n`;
      structuredPlan.materials.forEach((item) => {
        formattedPlan += `- ${item}\n`;
      });
      formattedPlan += `\n`;
    }

    if (structuredPlan.recommendations.length > 0) {
      formattedPlan += `## Recommendations\n`;
      structuredPlan.recommendations.forEach((item) => {
        formattedPlan += `- ${item}\n`;
      });
      formattedPlan += `\n`;
    }

    if (structuredPlan.tips.length > 0) {
      formattedPlan += `## Tips for Success\n`;
      structuredPlan.tips.forEach((item) => {
        formattedPlan += `- ${item}\n`;
      });
    }

    return formattedPlan;
  }

  static async enhanceExistingPlan(
    event: Event,
    userRequest: string
  ): Promise<string> {
    try {
      const openai = this.initializeOpenAI();

      const prompt = `Here is an existing event plan:

Event: ${event.name}
Current Plan: ${event.aiGeneratedPlan || "No existing plan"}

User Request: ${userRequest}

Please provide an enhanced or modified version of this event plan based on the user's request. Keep the good parts of the existing plan and improve upon them.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert event planner helping to enhance and improve existing event plans based on user feedback and requests.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const enhancedPlan = completion.choices[0]?.message?.content;

      if (!enhancedPlan) {
        throw new Error("Failed to enhance event plan");
      }

      return enhancedPlan;
    } catch (error) {
      console.error("Error enhancing event plan:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to enhance event plan: ${error.message}`);
      }
      throw new Error("Failed to enhance event plan: Unknown error");
    }
  }

  static async generateActivitySuggestions(
    eventType: string,
    numberOfPeople?: number,
    location?: string
  ): Promise<string[]> {
    try {
      const openai = this.initializeOpenAI();

      let prompt = `Suggest 5-10 creative and engaging activities for a ${eventType}`;

      if (numberOfPeople) {
        prompt += ` with ${numberOfPeople} people`;
      }

      if (location) {
        prompt += ` at ${location}`;
      }

      prompt += ". Provide just the activity names, one per line.";

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert event planner. Suggest creative, practical activities that are appropriate for the given context.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.8,
      });

      const suggestions = completion.choices[0]?.message?.content;

      if (!suggestions) {
        return [];
      }

      return suggestions
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => line.trim());
    } catch (error) {
      console.error("Error generating activity suggestions:", error);
      return [];
    }
  }
}
