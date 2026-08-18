Filtering the full review down to what's actually roadmap-worthy — most of it is either already-covered principle or too vague to task-list as-is. Here's what I'd actually change in the roadmap document.

## New blocks to add

**Telemetry & Player Analytics** (new, position: discovery-first, similar shape to how B8 started) — genuinely absent, but this needs to open as a *discovery* block, not an implementation one, because the review's suggestion skips over a real architecture question: this is a backend-less, static, client-only game. Before scoping metrics (tutorial completion, voyage duration, mission acceptance, etc.), the actual open question is *where does the data go* — a real backend, or an opt-in local-only stats view the player can see about themselves. That decision gates everything else.

**Accessibility Pass** (new, position: near B23, alongside Audio/Visual Polish) — clean, standalone, untouched by anything in this conversation so far. Keyboard navigation, ARIA labels, colorblind-safe indicators (icon+color, not color alone). Deserves its own block rather than being folded into general UI polish.

**World Simulation / Living Caribbean** (new, position: after B19, since it depends on the same persistent-entity infrastructure) — the review's "shifting trade routes, governor replacements, epidemics, seasonal rhythms" is meaningfully bigger than what B19 currently scopes (rival captains, faction-war-adjacent encounters). I'd keep B19 as-is rather than let it quietly balloon, and give this its own later block instead.

## Scope clarifications on existing blocks

**B19** — add an explicit scope note: world-simulation depth (trade shifts, governor changes, seasonal effects) is *out* of B19's scope, lives in the new block above. Otherwise B19 risks silently absorbing a much bigger ask than originally intended.

**B21 (Endgame & Legacy)** — the review's "captain legacy across campaigns" (a retired captain appearing as a rumor/reference in your *next* playthrough) isn't actually in B21's current scope, which is victory tracks and a legend score. Worth adding as an explicit sub-item, since it's a natural extension, not a duplicate.

**B15–B18 (crew engagement)** — add a note that trait discovery should trigger a small follow-up event/decision, not just flip a hidden tag to revealed with a log line (confirmed that's literally all `revealTag` does today). Small, concrete, belongs with whichever of B15–B18 actually touches crew depth first.

**B11** — worth appending a task: pre-engagement risk transparency at the Intercept screen (qualitative Low/Medium/High risk read, "the crew believes victory is likely," matching the existing prose-first voice). This is the one idea from the whole review I'd call genuinely missing from an otherwise very deep combat design — the boarding-phase advantage bar is mid-fight, nothing currently helps the player size up a fight *before* committing to it.

## A decision to make before implementing something already planned

**B10 (starts variety)** — the review's "prefer optional investment sinks over mandatory maintenance taxes" is a direct, fair critique of the wage-upkeep and pirate-tribute mechanics just locked into the B10 task list. Since B10 isn't built yet, this is worth a genuine second look, not a dismissal — the underlying point (recurring taxes read as punishment, optional sinks read as agency) has real merit. Doesn't necessarily mean scrapping it, but I'd flag it as an open item on B10 rather than close the book on the current design.

## Two reminders this review indirectly surfaces again

Both already flagged earlier in this conversation, still unresolved: the **UI de-vibecodification work** (rough borders, mission card redesign, Panel/RoughBox) and the **onboarding coverage audit** (missing Intercept/Plunder/Event hints, the Status-screen QM gap, the trade-route QM gap) both still have no home in the B-numbered roadmap. This review's mission-card-info suggestion (§10) is itself a new piece of work that would slot naturally into wherever UI work finally gets a real block — reinforcing that this gap is actively costing tracked scope, not just a bookkeeping nitpick.

## One line worth adding to the roadmap's stated design philosophy

Alongside the existing three pillars and the "read it like a novel" vision statement: **"Prefer features that increase interaction between existing systems over introducing entirely new ones."** This has been the de facto reasoning behind sequencing B11 before B10, and behind favoring notableNPC/rival persistence over more standalone content — worth making it an explicit, named principle rather than leaving it implicit.