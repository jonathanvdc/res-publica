# Res Publica (the SimDem election website)

[SimDemocracy](https://www.reddit.com/r/SimDemocracy/) is an online community where citizens can participate in a simulated democracy, passing laws to change its nature. A key part of SimDemocracy is elections: We elect members of parliament and a president, and we also vote on referendums. Res Publica (this project) is SimDemocracy's election website. It supports the following scenarios:
  * Registered voters can cast their ballots in elections and see past election results.
  * Admins can set up elections, register voters and unregister voters.

## Build Instructions

### Dependencies

To build Res Publica, you will need a recent version of `npm` (e.g., 6.14.4) and a recent version of Python 3 (e.g., 3.8.5). Make sure you also have pip3. Res Publica's server is designed to run on Linux systems but may run on other operating systems too.

### Change the homepage URL (Optional)

If you intend to host Res Publica at a non-root URL, go to the `front-end` directory. Change the `"homepage": "/"` field in `package.json` to the URL at which you mean to host the website. For instance, if you want to host at `/sdvote/` instead of at `/`, put `"homepage": "/sdvote/"`.

### Configure Res Publica

Navigate to the `back-end` directory. Create a file called `config.json` that contains your credentials for hosting the site. The contents of a `config.json` should look like the example below, with real web app credentials and bot credentials.

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
    },
    "host": {
        "debug": false,
        "port": 5000
    },
    "voter-requirements": [
        {
            "operator": ">=",
            "lhs": "redditor.age",
            "rhs": 60
        },
        {
            "operator": ">=",
            "lhs": "redditor.total_karma",
            "rhs": 25
        }
    ],
    "optional-apis": {
        "authenticated": ["registered-voters"],
        "authenticated-admin": ["registered-voters", "add-registered-voter", "remove-registered-voter"],
        "authenticated-developer": ["registered-voters", "add-registered-voter", "remove-registered-voter", "upgrade-server"]
    },
    "login_expiry": 2592000,
    "flask-logs": false
}
```

With the server configured, the only thing left for us to do is to appoint an admin (that's us!). Create a directory called `data/votes` and in that directory create a file called `device-index.json` containing the following text, where `your-reddit-account` is your Reddit account name. If your Reddit account is, e.g., u/spez, then the Reddit account name you should enter is just "spez".

```json
{
    "devices": {},
    "admins": [
        "your-reddit-account"
    ],
    "developers": [
        "your-reddit-account"
    ],
    "registered-voters": [
        "your-reddit-account"
    ]
}
```

### Run the server

With the `config.json` in place, run the server like so:
```
python3 ./server-manager.py config.json
```

Congratulations! If all went well, you should now have your very own instance of Res Publica.
