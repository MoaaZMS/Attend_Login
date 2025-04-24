import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const checkIn = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    // Check if already checked in today
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", userId).eq("date", today)
      )
      .unique();

    if (existing) {
      throw new Error("Already checked in today");
    }

    await ctx.db.insert("attendance", {
      userId,
      date: today,
      checkIn: now,
    });
  },
});

export const checkOut = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    const record = await ctx.db
      .query("attendance")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", userId).eq("date", today)
      )
      .unique();

    if (!record) {
      throw new Error("No check-in found for today");
    }

    if (record.checkOut) {
      throw new Error("Already checked out today");
    }

    const workingHours = (now - record.checkIn) / (1000 * 60 * 60);
    const overtime = Math.max(0, workingHours - 8);

    await ctx.db.patch(record._id, {
      checkOut: now,
      workingHours,
      overtime,
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .collect();

    const totalDays = records.length;
    const totalWorkingHours = records.reduce((sum, r) => sum + (r.workingHours ?? 0), 0);
    const totalOvertime = records.reduce((sum, r) => sum + (r.overtime ?? 0), 0);
    const compensatoryDays = Math.floor(totalOvertime / 8);

    return {
      totalDays,
      averageHours: totalDays ? totalWorkingHours / totalDays : 0,
      totalOvertime,
      compensatoryDays,
    };
  },
});

export const getTodayStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const today = new Date().toISOString().split('T')[0];
    return await ctx.db
      .query("attendance")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", userId).eq("date", today)
      )
      .unique();
  },
});

export const resetSpecificStats = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .collect();

    // Update each record to reset overtime while keeping working hours
    for (const record of records) {
      if (record.overtime) {
        await ctx.db.patch(record._id, {
          overtime: 0
        });
      }
    }

    return null;
  },
});

export const getAllAttendanceRecords = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return records.map(record => ({
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      workingHours: record.workingHours,
      overtime: record.overtime
    }));
  },
});
