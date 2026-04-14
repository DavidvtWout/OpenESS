I haven't done real frontend development before and creating a frontend from scratch was a bit
too much of a challenge for me. So I've used Claude to create most of the frontend code. I did
review most of it and changed parts that I didn't like though.
It's a bit of a mess now so if you read this and think you can do better, feel free to
contact me on GitHub or create a pull request!

In short, the frontend uses FastAPI and Pydantic models to define the api endpoints. `main.py`
runs the FastAPI stuff with `uvicorn`. Typescript definitions for the api responses and
api endpoints are generated to `src/types.ts` and `npm` compiles the `.ts` files to `.js`
using `esbuild`.

And here's the long version:

`routes/api.py` defines the api using FastAPI and Pydantic. These can be used to generate
`src/types.ts` using the `generate-types` command. The script can be found at
`open_ess/scripts/generate_types.py`.

The pages themselves are also written in typescript and can also be found in
`open_ess/frontend/src`. These are then compiled to javascript and stored in
`open_ess/frontend/static`. This can be done with either;
  
  `esbuild open_ess/frontend/src/*.ts --outdir=open_ess/frontend/static --bundle --minify`

or

  `npm run build`
  
The `datatables` library is pretty small and is bundled with the `.js` files. `plotly` is very
big (5MB) and is not bundled. `plotly` is in `static/vendor` and is loaded via `base.html`.
