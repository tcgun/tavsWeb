const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyA0xW0SCnife_GuzqVZ0wkQcH3MFko4rlE";
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    const modelsToTest = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-pro"];

    for (const modelName of modelsToTest) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Merhaba");
            console.log(`SUCCESS: ${modelName} responded:`, result.response.text());
            return; // Stop after first success
        } catch (error) {
            console.error(`FAILED: ${modelName} -`, error.message);
        }
    }
}

run();
