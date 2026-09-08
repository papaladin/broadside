# Broadside — PHP, Hosting, Telemetry & Feedback Plan

## Purpose

This document records the current plan for using the OVH hosting environment as a lightweight server-side companion to Broadside.

Goals:

1. Verify PHP execution on the OVH hosting account.
2. Verify that PHP can write persistent files.
3. Establish a local PHP test setup.
4. Keep GitHub Pages/static development separate from the production PHP backend.
5. Add anonymous gameplay telemetry without requiring a database.
6. Use OVH web statistics/logs for overall traffic.
7. Provide a first-party feedback form that can email the developer.
8. Preserve the option to add a database/backend later if needed.

This is a design/task document. Implementation details may change after hosting tests.

---

# 1. Current Hosting Situation

The Broadside project is a browser game using HTML/JS/JSX and Babel.

A small OVH hosting account is also being used with the domain `papal.be`.

The OVH Manager currently shows:

- Global PHP version: **8.2**
- Database allocation: **0/0 database**
- Multi-site management
- SSL certificate management
- Statistics and logs
- A Logs (beta) area
- AWStats access similar to:
  `https://logs.cluster121.hosting.ovh.net/papalbp.cluster121.hosting.ovh.net/awstats-osl/index.html`

### Current interpretation

The PHP 8.2 setting strongly suggests that PHP execution is available.

`0/0 database` strongly suggests that this particular free hosting service has no database provision.

A database is not required for useful server-side functionality. PHP can receive HTTP requests and write files without MySQL.

---

# 2. What PHP Adds

Broadside's existing JavaScript can:

- create game state;
- serialize state to JSON;
- use `fetch()` to send HTTP requests;
- read/write browser storage;
- run all client-side game logic.

Browser JavaScript cannot normally write arbitrary files into the hosting server's filesystem.

A server-side receiver is therefore needed for persistent server-side data.

Conceptually:

    Browser
       |
       | HTTPS POST
       v
    PHP endpoint
       |
       +--> write JSON file
       |
       +--> send email
       |
       +--> validate/rate-limit request
       |
       +--> return response

PHP is simply one convenient server-side mechanism available on the OVH hosting.

A database is a separate concern and is not required for the first telemetry implementation.

---

# 3. First Hosting Test — Does PHP Execute?

Create:

    test.php

with:

    <?php

    header('Content-Type: text/plain; charset=utf-8');

    echo "PHP is working.\n";
    echo "PHP version: " . PHP_VERSION . "\n";
    echo "Server time: " . date('Y-m-d H:i:s') . "\n";

Upload it to the same web directory as `index.html`.

For example:

    papal.be/
    ├── index.html
    ├── test.php
    └── ...

Open:

    https://papal.be/test.php

Expected:

    PHP is working.
    PHP version: 8.2.x
    Server time: ...

This confirms that the hosting is actually executing PHP.

## Cleanup

Remove the diagnostic script after testing, or keep it outside the public production directory.

---

# 4. Second Hosting Test — Can PHP Write a File?

Temporarily use:

    <?php

    header('Content-Type: text/plain; charset=utf-8');

    $file = __DIR__ . '/test-output.txt';

    $line = date('Y-m-d H:i:s') . " - test successful\n";

    $result = file_put_contents($file, $line, FILE_APPEND | LOCK_EX);

    if ($result === false) {
        echo "FAILED: PHP could not write the file.\n";
        exit;
    }

    echo "SUCCESS: PHP wrote to test-output.txt\n";

After uploading/replacing the test script, open:

    https://papal.be/test.php

Expected:

    SUCCESS: PHP wrote to test-output.txt

Then check the OVH file manager for `test-output.txt`.

This establishes the critical capability needed for file-based telemetry.

## Cleanup

Delete:

    test.php
    test-output.txt

after testing.

---

# 5. Local PHP Testing

VS Code Live Server does **not** execute PHP.

For real PHP testing, use PHP's built-in development server if PHP is installed locally:

    php -S localhost:8000

from the project directory.

Then:

    http://localhost:8000/

runs the game and:

    http://localhost:8000/telemetry.php

can execute the PHP endpoint.

This is preferable to a JavaScript mock because the same PHP endpoint can be tested locally and deployed to OVH.

## Development environments

Static frontend development:

    VS Code Live Server
    http://127.0.0.1:5500/

PHP/backend development:

    php -S localhost:8000
    http://localhost:8000/

Telemetry failure must never prevent normal gameplay.

---

# 6. GitHub Pages and PHP

GitHub Pages is static hosting. It does not execute PHP server-side.

PHP files should therefore not be treated as part of the GitHub Pages runtime.

A useful repository organization is:

    broadside/
    ├── client/game files
    └── server/
        ├── telemetry.php
        └── feedback.php

The server source can remain in Git version control while being deployed separately to OVH.

A special YAML rule is not inherently necessary just because PHP files exist in the repository. A future GitHub Actions deployment can explicitly exclude server-side files if desired.

---

# 7. Recommended Overall Architecture

                         BROADSIDE
                             |
              +--------------+--------------+
              |                             |
         GitHub Pages                    OVH hosting
         static/testing                  production
                                            |
                                    +-------+-------+
                                    |       |       |
                                  PHP API  audio   statistics
                                    |               |
                              telemetry/feedback   AWStats/logs

The actual player save remains local:

    Browser
       |
       v
    localStorage

Telemetry is separate from save storage.

Cloud saves are not required for telemetry.

---

# 8. Telemetry Without a Database

The first implementation does not require MySQL or another database.

The browser can send JSON to:

    /api/telemetry.php

The PHP endpoint validates the request and appends/stores data as JSON.

Possible storage:

    telemetry/
        telemetry-2026-09.jsonl
        telemetry-2026-10.jsonl

or:

    telemetry/
        runs/
            random-id-1.json
            random-id-2.json

JSONL is attractive because one line can represent one event and files can later be downloaded and analysed locally.

Workflow:

1. Download telemetry files periodically.
2. Analyse them with Python.
3. Archive/delete old server files.
4. Keep long-term aggregate results locally.

No database is needed initially.

---

# 9. Storage Constraints

The free hosting appears to have a small storage allowance.

Telemetry should therefore be compact.

Do not upload the entire Broadside local save at every state change.

Prefer:

- meaningful events;
- compact session summaries;
- periodic snapshots only when useful;
- end-of-career summaries.

If telemetry becomes large enough that file management is inconvenient, consider a database or another storage service later.

---

# 10. Website Traffic Statistics

OVH Statistics/Logs/AWStats should be used for conventional website traffic.

Potential measurements include:

- visits;
- requests;
- traffic volume;
- browsers;
- operating systems;
- approximate geography;
- HTTP status/errors;
- crawlers/robots;
- access logs.

Useful questions:

- How many people visit the site?
- How much traffic is generated?
- What browsers/devices are common?
- Are there obvious server/deployment errors?

## Limitation

Web-server statistics cannot reliably measure actual game play duration.

A single-page game can load once and then run for an hour without generating additional meaningful HTTP requests.

Therefore:

    Website traffic statistics
    !=
    Game engagement telemetry

Both should be retained.

---

# 11. Measuring Game Sessions and Play Duration

The game can create an anonymous random session identifier when a session begins.

Possible lifecycle:

    session_started
    heartbeat
    heartbeat
    game_event
    game_event
    session_ended

Alternatively, the game can track active time itself:

    activeSeconds: 2214

Client-side active-time accounting is preferable to inferring duration from HTTP requests.

## PWA/iOS consideration

Installed PWAs can be backgrounded or suspended.

Where practical, distinguish:

- session started;
- game became active;
- game became hidden/backgrounded;
- game resumed;
- session ended.

Do not rely on `unload` always firing.

A periodic heartbeat plus client-side active-time accounting is more robust.

---

# 12. Gameplay Telemetry

Telemetry should focus on questions that can influence Broadside design and balancing.

Potential events:

    game_started
    new_career_started
    faction_selected
    first_port_reached
    mission_accepted
    mission_completed
    mission_failed
    ship_purchased
    ship_lost
    voyage_started
    voyage_completed
    random_event
    combat_started
    combat_won
    combat_lost
    boarding_started
    boarding_won
    boarding_lost
    surrender
    escape
    plunder_taken
    crew_loss
    fame_milestone
    infamy_milestone
    career_ended

The exact event list should be finalized against the current engine/event architecture.

---

# 13. Career Summary Telemetry

A compact career/run summary is likely to be particularly useful.

Conceptually:

    {
      "version": "...",
      "sessionId": "...",
      "day": 184,
      "birthFaction": "Dutch",
      "ship": "Brigantine",
      "fame": 43,
      "infamy": 17,
      "gold": 12840,
      "crew": 31,
      "missionsCompleted": 22,
      "battles": 14,
      "battlesWon": 11,
      "boardings": 6,
      "boardingWins": 5,
      "shipLosses": 0
    }

This is an analytical snapshot, not a cloud save.

Potential additional fields:

- mission categories;
- voyage counts/durations;
- trade profit;
- mission income;
- plunder income;
- crew costs;
- provision costs;
- faction reputation;
- major events;
- final outcome;
- game version.

---

# 14. Telemetry Questions Broadside Should Eventually Answer

## Acquisition / engagement

- number of game starts;
- number of distinct anonymous sessions;
- returning sessions;
- approximate active play duration;
- session frequency;
- session length distribution.

## Progression

- percentage reaching first port;
- percentage completing first mission;
- percentage reaching first combat;
- percentage buying a second ship;
- progression by Fame milestone;
- progression by game-day milestone;
- percentage reaching late-game systems;
- where players stop playing.

## Combat

- combat frequency;
- win/loss ratio;
- boarding frequency;
- boarding success;
- escape frequency;
- surrender frequency;
- crew losses;
- ship losses.

## Economy

- gold earned/spent;
- mission income;
- trade income;
- plunder income;
- ship purchase frequency;
- average wealth by game day.

## B10 / faction identity

Potentially compare:

- birth faction selection;
- survival/progression;
- economy;
- mission selection;
- final Fame;
- final Infamy;
- ship progression;
- career duration.

---

# 15. Privacy / Data Minimization

The initial telemetry system should be anonymous and deliberately small.

Do not collect:

- player names unless explicitly supplied through feedback;
- account credentials;
- unnecessary personal information;
- full local saves unless there is a future explicit reason;
- precise location.

A random session ID is sufficient for connecting events belonging to one play session.

Whether a persistent anonymous identifier is useful is a separate future decision.

Telemetry should be treated as game analytics, not identity tracking.

---

# 16. Feedback Form

A first-party feedback form can use the same OVH hosting.

Conceptually:

    Game/site
       |
       | POST
       v
    feedback.php
       |
       +--> validate
       +--> anti-spam checks
       +--> rate limit
       +--> send email
       v
    developer mailbox

The browser must never contain SMTP credentials.

PHP is responsible for communicating with the mail system.

The exact Free-hosting mail quota and configuration should be tested on the actual account.

---

# 17. Feedback Anti-Spam

Recommended initial protections:

1. Honeypot field.
2. Minimum/maximum message length.
3. Server-side validation.
4. POST-only endpoint.
5. Request-size limit.
6. Rate limiting.
7. Server-generated filenames/identifiers.
8. No arbitrary file paths from user input.
9. CAPTCHA/Turnstile only if simple protections prove insufficient.

Client-side validation is not a security mechanism.

Important validation must happen in PHP.

---

# 18. Telemetry Endpoint Security

`telemetry.php` will be publicly reachable.

Anyone can technically send it a request.

Therefore:

- never trust submitted JSON;
- enforce request-size limits;
- validate expected fields/types;
- do not allow arbitrary filenames;
- do not allow arbitrary filesystem paths;
- generate IDs server-side where appropriate;
- prevent directory traversal;
- avoid publicly browsable telemetry storage if practical;
- keep telemetry failure non-fatal to the game.

The endpoint does not need full user authentication for initial anonymous telemetry.

Basic abuse protection should still be implemented.

---

# 19. Telemetry Failure Behavior

Telemetry must never interfere with gameplay.

If:

- the player is offline;
- OVH is unavailable;
- PHP returns an error;
- a service worker is offline;
- the player blocks network requests;

the game should continue normally.

Possible future behavior:

    online
      |
      +--> send telemetry
      |
      +--> success -> discard local event

    offline
      |
      +--> queue compact telemetry locally
      |
      +--> send later when online

Whether offline queueing is worth implementing is an open decision.

The first version can simply tolerate lost telemetry.

---

# 20. PWA / Service Worker Relationship

The production PWA and telemetry system are separate concerns.

The service worker should support:

- application assets;
- locally hosted audio;
- offline game functionality.

Telemetry should generally remain a network operation.

Do not make successful telemetry delivery a requirement for the PWA to function.

A future enhancement could queue telemetry in local storage/IndexedDB while offline and submit it when connectivity returns.

Only add this if telemetry quality justifies the complexity.

---

# 21. Recommended Production Structure

Potential OVH structure:

    public/
        index.html
        manifest.json
        sw.js
        data.js
        ...
        audio/
            ...
        api/
            telemetry.php
            feedback.php

Telemetry data should ideally not be publicly browsable.

The exact OVH document-root layout still needs confirmation.

---

# 22. Recommended Repository Structure

Potential repository organization:

    broadside/
    ├── index.html
    ├── data.js
    ├── ...
    ├── audio/
    ├── server/
    │   ├── telemetry.php
    │   └── feedback.php
    ├── tests/
    └── docs/
        └── php-telemetry.md

Server files can remain version-controlled.

Production deployment copies them to OVH.

GitHub Pages does not execute them.

---

# 23. Implementation Tasks

## Phase 0 — Hosting verification

- [ ] Confirm PHP 8.2 execution with `test.php`.
- [ ] Confirm PHP can write a file.
- [ ] Confirm written files persist after subsequent requests.
- [ ] Confirm file permissions.
- [ ] Confirm OVH document root.
- [ ] Confirm whether PHP can create/use a non-public data directory.
- [ ] Confirm relevant PHP extensions if needed.
- [ ] Confirm exact Free-hosting email behavior/quota.
- [ ] Confirm SSL is active on the production domain.

## Phase 1 — Local PHP environment

- [ ] Check whether PHP is installed locally.
- [ ] Run `php -S localhost:8000`.
- [ ] Confirm `test.php` locally.
- [ ] Confirm local PHP receives POST JSON.
- [ ] Confirm local PHP writes JSON.
- [ ] Add a small local telemetry test harness.
- [ ] Keep Live Server for ordinary static frontend development.

## Phase 2 — Telemetry design

- [ ] Define anonymous session ID behavior.
- [ ] Define event naming convention.
- [ ] Define common event fields.
- [ ] Define game-version field.
- [ ] Define timestamp convention.
- [ ] Define active-play/session-duration approach.
- [ ] Define career-summary payload.
- [ ] Choose JSONL vs individual JSON files.
- [ ] Define retention/cleanup process.
- [ ] Define data that must never be collected.

## Phase 3 — PHP telemetry endpoint

- [ ] Implement POST-only endpoint.
- [ ] Parse JSON body.
- [ ] Validate payload.
- [ ] Enforce request-size limit.
- [ ] Generate safe server-side identifier.
- [ ] Write telemetry data.
- [ ] Return small JSON success/error response.
- [ ] Add basic rate limiting.
- [ ] Add abuse/error logging.
- [ ] Test malformed requests.
- [ ] Test oversized requests.
- [ ] Test repeated requests.
- [ ] Test concurrent writes.

## Phase 4 — Game integration

- [ ] Add telemetry module without coupling it to UI.
- [ ] Add production endpoint configuration.
- [ ] Disable/redirect telemetry when running on GitHub Pages.
- [ ] Use local PHP endpoint during backend development.
- [ ] Emit session start.
- [ ] Emit important gameplay events.
- [ ] Emit career summary.
- [ ] Add active-time/session accounting.
- [ ] Ensure telemetry failures never break gameplay.
- [ ] Consider offline queueing later.

## Phase 5 — Feedback

- [ ] Implement feedback form.
- [ ] Implement `feedback.php`.
- [ ] Add server-side validation.
- [ ] Add honeypot.
- [ ] Add rate limiting.
- [ ] Test email delivery.
- [ ] Test malformed/spam submissions.
- [ ] Decide whether CAPTCHA/Turnstile is necessary.

## Phase 6 — Analysis

- [ ] Download telemetry files manually.
- [ ] Build local Python analysis script.
- [ ] Produce session-duration statistics.
- [ ] Produce progression funnel.
- [ ] Produce faction comparison.
- [ ] Produce combat statistics.
- [ ] Produce economy statistics.
- [ ] Compare telemetry against simulator results.
- [ ] Establish a repeatable telemetry report.

---

# 24. Open Decisions

These are deliberately unresolved until implementation/testing.

### Storage

- JSONL versus one JSON file per run.
- Whether telemetry can safely live outside the public web root.
- How often old telemetry should be downloaded/deleted.
- Whether compressed archives are worthwhile.

### Session tracking

- Exact definition of a session.
- Heartbeat interval.
- Active-time versus wall-clock duration.
- Handling browser/PWA suspension.
- Whether anonymous IDs persist across sessions.

### Telemetry volume

- Exact event list.
- Which events justify storage.
- Whether periodic state snapshots are needed.
- Whether career-end summaries are sufficient for some systems.

### Offline telemetry

- Ignore failed events.
- Queue in local storage.
- Queue in IndexedDB.
- Whether telemetry quality justifies the complexity.

### Feedback

- PHP `mail()` versus SMTP.
- Exact OVH Free-hosting email limits.
- Honeypot/rate limiting versus CAPTCHA/Turnstile.
- Whether feedback should also be stored as JSON.

### Deployment

- Exact OVH document root.
- Whether GitHub Pages should receive `server/` source files.
- Whether GitHub Actions should deploy OVH automatically.
- Central production/development endpoint configuration.

### Database

No database is currently planned.

Consider one only if:

- telemetry files become difficult to manage;
- server-side querying becomes necessary;
- cloud saves/accounts are added;
- another concrete requirement justifies it.

---

# 25. Current Recommended Architecture

For the first production version:

    Broadside client
        |
        +--> localStorage
        |       actual game save
        |
        +--> OVH /api/telemetry.php
        |       compact anonymous telemetry
        |
        +--> OVH /api/feedback.php
        |       email to developer
        |
        +--> OVH /audio/
        |       self-hosted background music
        |
        +--> OVH web statistics
                overall website traffic

No database.

No user accounts.

No cloud saves.

No external analytics service required initially.

OVH/AWStats handles website-level traffic; Broadside telemetry handles game-level behavior.

---

# 26. Important Principle

Keep these systems independent:

    Web analytics
        = "How many people visit?"

    Game telemetry
        = "What do players do?"

    Local save
        = "How does this player's game persist?"

    Cloud save
        = "How can a player recover/play their save elsewhere?"

    Feedback
        = "What do players tell the developer?"

They can share OVH hosting but should not be architecturally conflated.

This keeps Broadside's backend small and allows capabilities to be added later without making the game server-dependent.
