import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  attendance: defineTable({
    userId: v.id("users"),
    date: v.string(),
    checkIn: v.number(),
    checkOut: v.optional(v.number()),
    workingHours: v.optional(v.number()),
    overtime: v.optional(v.number()),
  }).index("by_user_and_date", ["userId", "date"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
