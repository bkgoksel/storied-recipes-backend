import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI();

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    console.log(`Got new ${event.httpMethod} request`)
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

    const system_prompt: string = `
    Craft a lengthy, convoluted story about the recipe named ${recipe_name}. 
    Dive deep into the myriad details of how you discovered it. Let your imagination roam, 
    and craft this tale as if the recipe has woven itself intricately into your life's rich narrative. 
    And remember, always leave the story open-ended, never drawing it to a full conclusion, as the tale should always have room to grow and expand.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
	    messages: [{"role": "system", "content": system_prompt}, {"role": "user", "content": last_sentences}],
            max_tokens: 200
        });
        console.log(`Response: ${response.choices[0]["message"]["content"]}`)

        return {
            statusCode: 200,
            body: JSON.stringify({story: response.choices[0]["message"]["content"]}),
            headers: headers
        };
    } catch (error) {
        console.log(`Error in OpenAI request: ${error.message}`)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
            headers: headers
        };
    }
};

export { handler };
