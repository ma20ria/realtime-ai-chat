import os
import json
import asyncio
import websockets
from fastapi import FastAPI, WebSocket
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

print("API KEY FOUND:", bool(OPENAI_API_KEY))


@app.websocket("/ws")
async def websocket_endpoint(client_ws: WebSocket):
    await client_ws.accept()
    print("Frontend connected")

    openai_ws = await websockets.connect(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        extra_headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "OpenAI-Beta": "realtime=v1",
        },
    )

    print("Connected to OpenAI")

    async def receive_from_client():
        while True:
            data = await client_ws.receive_text()
            print("FROM FRONTEND:", data)

            message = json.loads(data)

            await openai_ws.send(json.dumps({
                "type": "response.create",
                "response": {
                    "modalities": ["text", "audio"],
                    "instructions": message["text"],
            },
            }))

            print("SENT TO OPENAI")

    async def receive_from_openai():
        async for message in openai_ws:
            print("FROM OPENAI:", message[:200])
            await client_ws.send_text(message)

    await asyncio.gather(
        receive_from_client(),
        receive_from_openai()
    )