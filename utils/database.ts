// lib/connectDB.ts
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Only connect if not already connected
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error(
          "MONGODB_URI environment variable is not defined. Please check your .env.local file."
        );
      }
      await mongoose.connect(mongoUri, {
        dbName: "OpticalSpaces",
      });
      if (mongoose.connection.db) {
        const dbName = mongoose.connection.db.databaseName;
        console.log(`✅ MongoDB connected successfully to database: ${dbName}`);
      } else {
        console.log(
          "✅ MongoDB connected, but database name could not be determined."
        );
      }
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error; // Re-throw to handle in the calling function
  }
};
