import json
import os
import time
from functools import wraps
from http import client as http_client

import openai

# Globals
openai.api_key = os.environ["OPENAI_API_KEY"]
RATE_LIMIT = 10  # Requests per minute
REQUEST_TIMES = []

# Rate limiting decorator
def rate_limited(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        global REQUEST_TIMES
        current_time = time.time()
        
        # Clean up old request times
        REQUEST_TIMES = [t for t in REQUEST_TIMES if current_time - t < 60]
        
        # Check if we're over the limit
        if len(REQUEST_TIMES) >= RATE_LIMIT:
            return {
                "statusCode": 429,
                "body": json.dumps({"error": "Rate limit exceeded"}),
                "headers": {
                    "Access-Control-Allow-Origin": "https://bkgoksel.github.io"
                }
            }
        
        # Record the request time and proceed
        REQUEST_TIMES.append(current_time)
        return fn(*args, **kwargs)
    return wrapper

@rate_limited
def handler(event, context):
    # Always return CORS headers for all requests, including preflight (OPTIONS) requests
    headers = {
        "Access-Control-Allow-Origin": "https://bkgoksel.github.io",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
    
    # Handle preflight OPTIONS request
    if event['httpMethod'] == 'OPTIONS':
        return {
            "statusCode": http_client.OK,
            "headers": headers
        }

    # Check for POST method
    if event['httpMethod'] != 'POST':
        return {
            "statusCode": http_client.METHOD_NOT_ALLOWED,
            "body": "Method Not Allowed",
            "headers": headers
        }

    data = json.loads(event.get("body", "{}"))
    recipe_name = data.get("recipe_name")
    last_sentences = data.get("last_sentences", "")
    
    if not recipe_name:
        return {
            "statusCode": http_client.BAD_REQUEST,
            "body": "Recipe name is required",
            "headers": headers
        }

    prompt = (
      f"Craft a lengthy, convoluted story about the recipe named {recipe_name}. "
      f"If the following sentences are given, seamlessly continue the story from there: '{last_sentences}'. "
      f"If not, start a fresh tale. Dive deep into the myriad details of how you discovered it, perhaps on a day with peculiar weather, "
      f"like a time when the forecast was off. Embellish with over-the-top "
      f"descriptions of your surroundings, such as unexpected colors in the sky or a passerby's curious attire. "
      f"Recall the roller-coaster of emotions when you first tried preparing it, and perhaps a touch of drama from opinionated relatives, "
      f"like a grandparent who believes in a unique method of preparation or a sibling with a strange substitution idea. "
      f"Hint at some light-hearted family events related to this dish. Let your imagination roam, "
      f"and craft this tale as if the recipe has woven itself intricately into your life's rich narrative. "
      f"And remember, always leave the story open-ended, never drawing it to a full conclusion, as the tale should always have room to grow and expand."
    )


    response = openai.Completion.create(
      model="gpt-3.5-turbo",
      prompt=prompt,
      max_tokens=150
    )

    return {
        "statusCode": http_client.OK,
        "body": json.dumps(response.data),
        "headers": headers
    }

