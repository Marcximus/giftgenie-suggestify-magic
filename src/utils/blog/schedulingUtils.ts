import { supabase } from "@/integrations/supabase/client";

export interface ScheduledPost {
  title: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
}

export const getRandomTimeForDate = async (dateStr: string, existingTimes: string[]) => {
  const { data: timeSlots, error: timeSlotsError } = await supabase
    .rpc('get_random_daily_times');
  
  if (timeSlotsError) throw timeSlotsError;
  
  // Shuffle the time slots array
  const shuffledSlots = timeSlots.sort(() => Math.random() - 0.5);
  
  // Find an available time slot
  for (const slot of shuffledSlots) {
    const timeStr = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}:00`;
    if (!existingTimes.includes(timeStr)) {
      return timeStr;
    }
  }
  
  return null;
};

export const findNextAvailableDate = async (startDate: Date, existingSchedules: any[]) => {
  let currentDate = new Date(startDate);
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const postsOnDate = existingSchedules.filter(
      item => item.scheduled_date === dateStr
    ).length;

    if (postsOnDate < 3) {
      return dateStr;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
};

export const schedulePostBatch = async (titleList: string[]) => {
  // First, get all existing schedules
  const { data: existingSchedules, error: countError } = await supabase
    .from("blog_post_queue")
    .select("scheduled_date, scheduled_time")
    .order("scheduled_date", { ascending: true });

  if (countError) throw countError;

  // Process each title and find available slots
  const scheduledPosts: ScheduledPost[] = [];
  let currentDate = new Date();
  const existingScheduleMap = new Map<string, string[]>();

  for (const title of titleList) {
    // Find the next available date that has less than 3 posts
    const dateStr = await findNextAvailableDate(currentDate, [
      ...(existingSchedules || []),
      ...scheduledPosts
    ]);
    
    // Get existing times for this date
    const existingTimesForDate = existingSchedules
      ?.filter(item => item.scheduled_date === dateStr)
      .map(item => item.scheduled_time) || [];
    
    // Add any times we've already scheduled in this batch
    const batchTimesForDate = existingScheduleMap.get(dateStr) || [];
    const allExistingTimes = [...existingTimesForDate, ...batchTimesForDate];
    
    // Get a random available time
    const scheduledTime = await getRandomTimeForDate(dateStr, allExistingTimes);
    
    if (scheduledTime) {
      // Update our tracking of scheduled times
      if (!existingScheduleMap.has(dateStr)) {
        existingScheduleMap.set(dateStr, []);
      }
      existingScheduleMap.get(dateStr)?.push(scheduledTime);
      
      scheduledPosts.push({
        title,
        status: "pending",
        scheduled_date: dateStr,
        scheduled_time: scheduledTime
      });
      
      // Update currentDate to the next day to try spreading out posts
      currentDate = new Date(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return scheduledPosts;
};