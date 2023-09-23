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

    const prompt: string = `
    Craft a lengthy, convoluted story about the recipe named ${recipe_name}. 
    If the following sentences are given, seamlessly continue the story from there: '${last_sentences}'. 
    If not, start a fresh tale. Dive deep into the myriad details of how you discovered it, perhaps on a day with peculiar weather, 
    like a time when the forecast was off. Embellish with over-the-top 
    descriptions of your surroundings, such as unexpected colors in the sky or a passerby's curious attire. 
    Recall the roller-coaster of emotions when you first tried preparing it, and perhaps a touch of drama from opinionated relatives, 
    like a grandparent who believes in a unique method of preparation or a sibling with a strange substitution idea. 
    Hint at some light-hearted family events related to this dish. Let your imagination roam, 
    and craft this tale as if the recipe has woven itself intricately into your life's rich narrative. 
    And remember, always leave the story open-ended, never drawing it to a full conclusion, as the tale should always have room to grow and expand.
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
	    messages: [{"role": "user", "content": prompt}],
            max_tokens: 150
        });

        return {
            statusCode: 200,
            body: JSON.stringify({story: response.choices[0]["message"]["content"]}),
            headers: headers
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
            headers: headers
        };
    }
};

export { handler };
