import prisma from "../lib/prisma.js";
import { fetchMeetingTranscriptComplete } from "../utils/googleCalendar.js";


export const getNextMeetingForUser = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const now = new Date();

    const nextMeeting = await prisma.meeting.findFirst({
      where: {
        userId,
        startTime: { gte: now },
      },
      orderBy: { startTime: "asc" },
    });

    if (!nextMeeting) {
      return res
        .status(404)
        .json({ message: "No upcoming meetings found for user" });
    }

    res.json({
      meetingId: nextMeeting.id,
      meetLink: nextMeeting.meetLink,
      startTime: nextMeeting.startTime,
      endTime: nextMeeting.endTime,
      eventId: nextMeeting.eventId,
      transcript: nextMeeting.transcript,
    });
  } catch (error) {
    console.error("Error fetching next meeting:", error);
    res.status(500).json({ error: "Failed to fetch next meeting" });
  }
};

export const fetchMeetingTranscript = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: parseInt(meetingId) },
    });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Check if transcript already exists
    if (meeting.transcript) {
      return res.json({
        success: true,
        transcript: meeting.transcript,
        message: "Transcript already exists",
      });
    }

    // Fetch transcript from Google Meet
    const result = await fetchMeetingTranscriptComplete(
      meeting.meetLink,
      meeting.startTime,
      meeting.endTime
    );

    // Save to database
    await prisma.meeting.update({
      where: { id: parseInt(meetingId) },
      data: {
        transcript: result.transcript,
        conferenceRecordId: result.conferenceRecordId,
      },
    });

    res.json({
      success: true,
      transcript: result.transcript,
      conferenceRecordId: result.conferenceRecordId,
      message: "Transcript fetched and saved successfully from Google Meet",
    });
  } catch (error) {
    console.error("Error fetching meeting transcript:", error);

    if (error.message === "Conference record not found") {
      return res.status(404).json({
        error:
          "Meeting conference record not found. The meeting may not have started/ended yet or transcript is not ready.",
      });
    }

    if (error.message === "Transcript not available") {
      return res.status(404).json({
        error:
          "Transcript not available yet. Google Meet transcripts may take 5-10 minutes after meeting ends. Please try again later.",
      });
    }

    res
      .status(500)
      .json({ error: "Failed to fetch transcript from Google Meet API" });
  }
};

// ========== MANUAL TRANSCRIPT UPLOAD (Backup) ==========
export const uploadMeetingTranscript = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    const meeting = await prisma.meeting.update({
      where: { id: parseInt(meetingId) },
      data: { transcript },
    });

    res.json({
      success: true,
      message: "Transcript saved successfully (manual upload)",
      meetingId: meeting.id,
    });
  } catch (error) {
    console.error("Error uploading transcript:", error);
    res.status(500).json({ error: "Failed to save transcript" });
  }
};

// ========== GET SAVED TRANSCRIPT ==========
export const getMeetingTranscript = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: parseInt(meetingId) },
      select: {
        id: true,
        transcript: true,
        conferenceRecordId: true,
        startTime: true,
        endTime: true,
        meetLink: true,
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.json({
      meetingId: meeting.id,
      transcript: meeting.transcript,
      conferenceRecordId: meeting.conferenceRecordId,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      meetLink: meeting.meetLink,
      hasTranscript: !!meeting.transcript,
    });
  } catch (error) {
    console.error("Error fetching transcript:", error);
    res.status(500).json({ error: "Failed to fetch transcript" });
  }
};

// ========== GET ALL MEETINGS WITH TRANSCRIPTS ==========
export const getAllMeetingsWithTranscripts = async (req, res) => {
  try {
    const { userId, advisorId } = req.query;

    const whereClause = {};
    if (userId) whereClause.userId = userId;
    if (advisorId) whereClause.advisorId = advisorId;

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      orderBy: { startTime: "desc" },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        meetLink: true,
        transcript: true,
        conferenceRecordId: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        advisor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const meetingsWithStatus = meetings.map((meeting) => ({
      ...meeting,
      hasTranscript: !!meeting.transcript,
      status: new Date() > new Date(meeting.endTime) ? "completed" : "upcoming",
    }));

    res.json({
      meetings: meetingsWithStatus,
      totalMeetings: meetings.length,
      meetingsWithTranscripts: meetings.filter((m) => m.transcript).length,
    });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
};
