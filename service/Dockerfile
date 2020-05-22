FROM hayd/alpine-deno:latest

WORKDIR /app

COPY . /app

RUN ["deno" , "cache", "./src/app.ts"]

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "./src/app.ts"]