import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Service account configuration
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    ),
  },
  scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
});

// Calendar events endpoint
app.get("/api/calendar/events", async (req, res) => {
  try {
    console.log("Fetching calendar events...");
    console.log("Calendar ID:", process.env.GOOGLE_CALENDAR_ID);
    console.log(
      "Service Account Email:",
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    );

    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(now.getMonth() + 1);

    console.log("Time range:", {
      from: now.toISOString(),
      to: oneMonthFromNow.toISOString(),
    });

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      timeMin: now.toISOString(),
      timeMax: oneMonthFromNow.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    });

    console.log("Events found:", response.data.items?.length || 0);

    // Set proper headers
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Accept", "application/json");

    // Send the response
    res.json(response.data.items || []);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    // Set proper error response
    res.status(500).json({
      error: "Failed to fetch calendar events",
      details: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    details: err.message,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
