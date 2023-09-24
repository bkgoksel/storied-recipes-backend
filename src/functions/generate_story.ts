import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import OpenAI from "openai";

const openai = new OpenAI();

export async function generate_story(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const data = request.json()
    const recipe_name = data['recipe_name'];
    const last_sentences = data['last_sentences'];

    if (!recipe_name) {
        return {
            status: 400,
            body: "Recipe name is required",
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
        context.log(`Response: ${response.choices[0]["message"]["content"]}`)

        return {
            status: 200,
            body: JSON.stringify({story: response.choices[0]["message"]["content"]})
        };
    } catch (error) {
        context.log(`Error in OpenAI request: ${error.message}`)
        return {
            status: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

app.http('generate_story', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: generate_story
});
