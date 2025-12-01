const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyA0xW0SCnife_GuzqVZ0wkQcH3MFko4rlE";
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        console.log("Fetching available models...");
        // Note: The SDK might not expose listModels directly on genAI instance in all versions,
        // but typically it's on the model manager or we can try to infer from error.
        // Actually, for the Node SDK, we might need to use the REST API directly to list if the SDK doesn't expose it easily in this version.
        // Let's try a direct fetch to the API endpoint to be sure, bypassing the SDK wrapper for a moment to see raw response.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
        } else {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
}

run();
