import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "../contexts/ThemeContext";
import { Event } from "../types/Event";

// Import screens (we'll create these next)
import { HomeScreen } from "../screens/HomeScreen";
import { EventPlanningScreen } from "../screens/EventPlanningScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  EventPlanning: { editEvent?: Event } | undefined;
  Settings: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "AI Event Planner",
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: "Event History",
          tabBarLabel: "History",
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
          cardStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EventPlanning"
          component={EventPlanningScreen}
          options={{
            title: "Plan New Event",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
