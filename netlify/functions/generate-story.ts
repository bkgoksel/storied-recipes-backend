import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI();

let REQUEST_TIMES: number[] = [];
const RATE_LIMIT = 10;  // Requests per minute


const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const current_time = Date.now();
    const headers = {
        "Access-Control-Allow-Origin": "https://bkgoksel.github.io",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: headers
        };
    }

    // Check for POST method
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: "Method Not Allowed",
            headers: headers
        };
    }

    // Rate limiting
    REQUEST_TIMES = REQUEST_TIMES.filter(t => current_time - t < 60 * 1000);
    if (REQUEST_TIMES.length >= RATE_LIMIT) {
        return {
            statusCode: 429,
            body: JSON.stringify({ error: "Rate limit exceeded" }),
            headers: headers
        };
    }
    REQUEST_TIMES.push(current_time);

    // Parse the body
    const data = JSON.parse(event.body || "{}");
    const recipe_name = data.recipe_name;
    const last_sentences = data.last_sentences || "";

    if (!recipe_name) {
        return {
            statusCode: 400,
            body: "Recipe name is required",
            headers: headers
        };
    }

    const prompt = `Write a story about the recipe named ${recipe_name}. ${last_sentences}`;

    try {
        const response = await openai.completions.create({
            model: "gpt-3.5-turbo",
            prompt: prompt,
            max_tokens: 150
        });

        return {
            statusCode: 200,
            body: JSON.stringify({story: response.choices[0]["text"]}),
            headers: headers
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to generate story" }),
            headers: headers
        };
    }
};

export { handler };
