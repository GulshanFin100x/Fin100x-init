import { google } from "googleapis";
import oauth2Client from "./googleAuth.js";

// Initialize Google Calendar and Meet APIs
const calendar = google.calendar({ version: "v3", auth: oauth2Client });
const meet = google.meet({ version: "v2", auth: oauth2Client });

// ========== EXISTING CALENDAR FUNCTIONS ==========

export async function createMeetingWithGoogleMeet({
  summary,
  description,
  startDateTime,
  endDateTime,
  attendeesEmails = [],
  timezone = "UTC",
}) {
  const event = {
    summary,
    description,
    start: { dateTime: startDateTime, timeZone: timezone },
    end: { dateTime: endDateTime, timeZone: timezone },
    attendees: attendeesEmails.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `req-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    conferenceDataVersion: 1,
  });

  return response.data;
}

export async function getAdvisorScheduleFromGoogle({
  calendarId,
  timeMin,
  timeMax,
}) {
  const response = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}

// ========== NEW TRANSCRIPT FUNCTIONS ==========

/**
 * Extract meet code from Google Meet link
 */
export function extractMeetCodeFromLink(meetLink) {
  const meetCode = meetLink.split("/").pop();
  return meetCode;
}

/**
 * Find conference record for a specific meeting
 */
export async function findConferenceRecord(meetCode, startTime, endTime) {
  try {
    const response = await meet.conferenceRecords.list({
      filter: `space.meeting_code="${meetCode}"`,
    });

    const records = response.data.conferenceRecords || [];

    for (const record of records) {
      const recordStart = new Date(record.startTime);
      const recordEnd = new Date(record.endTime);
      const meetingStart = new Date(startTime);
      const meetingEnd = new Date(endTime);

      // Check if times overlap (meeting happened within record timeframe)
      if (recordStart <= meetingEnd && recordEnd >= meetingStart) {
        return record.name; // This is the conferenceRecordId
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding conference record:", error);
    return null;
  }
}

/**
 * Get transcript entries for a conference record
 */
export async function getTranscriptEntries(conferenceRecordId) {
  try {
    // First, list transcripts for the conference
    const transcriptsResponse = await meet.conferenceRecords.transcripts.list({
      parent: conferenceRecordId,
    });

    if (!transcriptsResponse.data.transcripts?.length) {
      return null; // No transcripts available
    }

    const transcriptId = transcriptsResponse.data.transcripts[0].name;

    // Get transcript entries
    const entriesResponse =
      await meet.conferenceRecords.transcripts.entries.list({
        parent: transcriptId,
      });

    const entries = entriesResponse.data.transcriptEntries || [];

    // Combine all entries into readable transcript
    const transcript = entries
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .map((entry) => {
        const speakerName = entry.participant?.user?.displayName || "Unknown";
        const timestamp = new Date(entry.startTime).toLocaleTimeString();
        return `[${timestamp}] ${speakerName}: ${entry.text}`;
      })
      .join("\n");

    return transcript;
  } catch (error) {
    console.error("Error getting transcript:", error);
    return null;
  }
}

/**
 * Get meeting details from Google Calendar event ID
 */
export async function getMeetingDetailsFromEvent(eventId) {
  try {
    const response = await calendar.events.get({
      calendarId: "primary",
      eventId: eventId,
    });

    const event = response.data;
    const meetLink = event.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === "video"
    )?.uri;

    return {
      meetLink,
      startTime: event.start.dateTime,
      endTime: event.end.dateTime,
      summary: event.summary,
    };
  } catch (error) {
    console.error("Error getting meeting details:", error);
    return null;
  }
}

/**
 * Complete transcript fetch workflow
 * Use this function to get transcript after meeting ends
 */
export async function fetchMeetingTranscriptComplete(
  meetLink,
  startTime,
  endTime
) {
  try {
    // Extract meet code from link
    const meetCode = extractMeetCodeFromLink(meetLink);

    // Find conference record
    const conferenceRecordId = await findConferenceRecord(
      meetCode,
      startTime,
      endTime
    );

    if (!conferenceRecordId) {
      throw new Error("Conference record not found");
    }

    // Get transcript
    const transcript = await getTranscriptEntries(conferenceRecordId);

    if (!transcript) {
      throw new Error("Transcript not available");
    }

    return {
      conferenceRecordId,
      transcript,
    };
  } catch (error) {
    console.error("Error in complete transcript fetch:", error);
    throw error;
  }
}
