import { GoogleGenAI } from "@google/genai";
import { api } from "./api";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeAttendanceWithAI = async (query: string) => {
  const ai = getClient();
  if (!ai) return "AI Service Unavailable: Missing API Key.";

  try {
    // Fetch data asynchronously
    const [users, sessions, allAttendance] = await Promise.all([
      api.getUsers(),
      api.getActiveSessions(), // Just getting some sessions context
      api.getAllAttendance()
    ]);

    // Create a simplified data summary for the model to consume token-efficiently
    const dataContext = {
      totalStudents: users.filter(u => u.role === 'STUDENT').length,
      totalSessions: sessions.length,
      attendanceRecords: allAttendance.map(a => ({
        student: a.studentName,
        status: a.status,
        date: a.timestamp
      }))
    };

    const prompt = `
      You are an intelligent assistant for a Classroom Attendance System.
      
      Current Database Context:
      ${JSON.stringify(dataContext, null, 2)}

      User Query: "${query}"

      Instructions:
      1. Analyze the provided JSON data to answer the query.
      2. If asked for "low attendance", calculate percentage: (present / total_sessions) * 100.
      3. Provide concise, helpful insights.
      4. If the query is unrelated to attendance, politely decline.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error analyzing the data.";
  }
};