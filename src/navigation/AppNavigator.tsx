import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MoneyScreen,
  NotificationsScreen,
  NutritionScreen,
  ProfileScreen,
  QuickAddScreen,
  SearchScreen,
  SettingsScreen,
  TimelineScreen,
  WeightScreen,
  WorkoutScreen,
} from "../screens/DetailScreens";
import {
  FocusScreen,
  LogScreen,
  PlanScreen,
  ReviewScreen,
  TodayScreen,
} from "../screens/MainScreens";
import { typography, usePOSTheme } from "../theme";

export type RootStackParamList = {
  Home: undefined;
  Timeline: undefined;
  Nutrition: undefined;
  Weight: undefined;
  Workout: undefined;
  Money: undefined;
  Notifications: undefined;
  Search: undefined;
  Profile: undefined;
  Settings: undefined;
  QuickAdd: { type?: "task" | "meal" | "transaction" } | undefined;
};
export type TabParamList = {
  Today: undefined;
  Plan: undefined;
  Log: undefined;
  Focus: undefined;
  Review: undefined;
};
const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const icons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Today: "sunny-outline",
  Plan: "calendar-outline",
  Log: "add-circle-outline",
  Focus: "timer-outline",
  Review: "stats-chart-outline",
};

function Tabs() {
  const { colors } = usePOSTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.action.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: typography.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 58 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 6),
            backgroundColor: colors.surface.primary,
            borderTopColor: colors.border.default,
          },
        ],
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Focus" component={FocusScreen} />
      <Tab.Screen name="Review" component={ReviewScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="Home" component={Tabs} />
      <Stack.Screen name="Timeline" component={TimelineScreen} />
      <Stack.Screen name="Nutrition" component={NutritionScreen} />
      <Stack.Screen name="Weight" component={WeightScreen} />
      <Stack.Screen name="Workout" component={WorkoutScreen} />
      <Stack.Screen name="Money" component={MoneyScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen
        name="QuickAdd"
        component={QuickAddScreen}
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
    </Stack.Navigator>
  );
}
const styles = StyleSheet.create({
  tabBar: { paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth },
});
