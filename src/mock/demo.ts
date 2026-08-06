import { DemoData } from "../types";

export const demoData: DemoData = {
  user: { name: "Rajesh", joined: "January 2026", weight: 171.2 },
  priorities: [
    { id: "p1", title: "Finish React feature", meta: "Work · Today" },
    { id: "p2", title: "Chest and Triceps", meta: "Workout · 6:00 PM" },
  ],
  timeline: [
    { id: "r1", title: "Warm water", meta: "7:00 AM", done: true },
    { id: "r2", title: "Brush", meta: "7:10 AM", done: true },
    { id: "r3", title: "Shower", meta: "7:25 AM", done: true },
    { id: "r4", title: "Breakfast", meta: "8:00 AM" },
    { id: "r5", title: "Office", meta: "9:00 AM" },
    { id: "r6", title: "Lunch", meta: "12:30 PM" },
    { id: "r7", title: "Gym", meta: "6:00 PM" },
    { id: "r8", title: "Dinner", meta: "8:00 PM" },
    { id: "r9", title: "Sleep", meta: "10:45 PM" },
  ],
  tasks: [
    { id: "t1", title: "Finish React feature", meta: "Today · 4:00 PM" },
    { id: "t2", title: "Grocery shopping", meta: "Today" },
    { id: "t3", title: "Gym", meta: "Today · 6:00 PM" },
    { id: "t4", title: "Read 20 minutes", meta: "Evening" },
    { id: "t5", title: "Plan tomorrow", meta: "9:30 PM" },
  ],
  meals: [
    {
      id: "m1",
      title: "Greek yogurt, berries & oats",
      meta: "Breakfast · 430 kcal · 28g protein",
    },
    {
      id: "m2",
      title: "Chicken rice bowl",
      meta: "Lunch · 610 kcal · 48g protein",
    },
  ],
  transactions: [
    { id: "x1", title: "Lunch", meta: "Food · −$14.00" },
    { id: "x2", title: "Coffee", meta: "Food · −$5.00" },
    { id: "x3", title: "Groceries", meta: "Groceries · −$32.00" },
  ],
  notifications: [
    { id: "n1", title: "Lunch is coming up", meta: "Your plan says 12:30 PM" },
    {
      id: "n2",
      title: "Great start",
      meta: "3 morning routines completed",
      done: true,
    },
  ],
};
