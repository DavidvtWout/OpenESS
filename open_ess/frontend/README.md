I haven't done real frontend development before and creating a frontend from scratch was a bit
too much of a challenge for me. So I've used Claude to create most of the frontend code. I did
review most of it and changed parts that I didn't like though.
It's a bit of a mess now so if you read this and think you can do better, feel free to
contact me on GitHub or create a pull request!

In short, the frontend uses FastAPI and Pydantic models to define the api endpoints. `main.py`
runs the FastAPI stuff with `uvicorn`. Javascript definitions for the api responses and
api endpoints are generated to `src/api.js` and `npm`.
