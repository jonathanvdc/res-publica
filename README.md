# Res Publica (A proposed SimDem Voting Booth website)

## Build Instructions

Make sure you have `npm` installed. Go to the `front-end` directory. Change the `"homepage": "/"` field in `package.json` to the URL at which you mean to host the website. For instance, if you want to host at `/sdvote/` instead of at `/`, put `"homepage": "/sdvote/"`.


Run the following command.
```
npm run-script build
```

Now navigate to the `back-end` directory. Create a file called `config.json` that contains your credentials for hosting the site. The contents of a `config.json` should look like this:

```json
{
    "webapp-credentials": {
        "client_id": "client ID",
        "client_secret": "client secret",
        "redirect_uri": "https://www.your-web-page.com/reddit-auth",
        "user_agent": "simdem-voting-booth-v0.0.1"
    },
    "bot-credentials": {
        "client_id": "client ID",
        "client_secret": "client secret",
        "username": "your-bot-for-scraping-CFCs",
        "password": "password",
        "user_agent": "simdem-voting-booth-bot-v0.0.1"
    }
}
```

With the `config.json` in place, run the server like so:
```
python3 ./server.py config.json
```
