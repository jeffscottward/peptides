import "dotenv/config";
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("GOOGLE_GENERATIVE_AI_API_KEY:", process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "Found" : "Missing");
