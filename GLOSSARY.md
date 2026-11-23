# MTG Simulator Workflow

Playtesting Magic: the Gathering Commander decks by simulating many solitaire games and summarising what the deck did in its early turns.

## Language

**Goldfish**:
A game played by one player alone, with no opponents and no outside interaction. The only kind of game this project simulates.
_Avoid_: Playtest game, full game, match

**Game**:
One goldfish played from opening hand through the end of the horizon.
_Avoid_: Simulation, iteration, trial

**Horizon**:
The number of turns a game is played, set in the batch's configuration and six by default.
_Avoid_: Game length, turn limit

**Batch**:
A set of many games of one decklist, with a seed, a player agent, a horizon and a budget, whose findings are reported together.
_Avoid_: Run, experiment, job

**Decklist**:
The 100 cards being tested, including its one or two commanders, loaded from a local text export.
_Avoid_: Deck file, list

**Commander**:
A card that leads the deck and starts in the command zone. A decklist has one or two.
_Avoid_: General, co-commander, second commander

**Partner**:
The ability that lets a decklist have two commanders. Which pairings are legal is decided from card data, not from the decklist text.
_Avoid_: Dual commander, pair

**Game log**:
The full record of one game: shuffle outcomes, player agent decisions and rules engine events. Findings are computed from game logs.
_Avoid_: Trace, transcript

**Player agent**:
The decision-maker that chooses what to play each turn in a game. It may be an LLM or a scripted heuristic.
_Avoid_: Bot, AI, pilot

**Rules engine**:
The deterministic part that keeps a game legal: zones, mana, land drops and turn structure. It decides what is allowed; the player agent decides what to do.
_Avoid_: Judge, referee

**Game view**:
What the player agent is allowed to see of a game at a decision: its own hand, the cards it has played, the command zone, the turn and the size of the library. The rules engine builds it; the player agent only reads it.
_Avoid_: Game state, snapshot, observation

**Card data**:
The details of one card as the project uses them: name, mana cost, type line, oracle text, color identity and per-face data. Taken from Scryfall's Oracle data.
_Avoid_: Card record, card object

**Card cache**:
The list of card data for every card, stored on disk as a download of Scryfall's Oracle bulk file and refreshed on demand. Decklist names are resolved against it; a name it lacks is an unsupported card.
_Avoid_: Card database, card DB, card source

**Unsupported card**:
A card the rules engine cannot play correctly, reported with a reason: the effect does not fit the effect schema, its translation failed validation, or it could not be found in the card cache. It is flagged in results rather than guessed at. A name missing from the card cache is also called an **Unknown card** in Decklist validation errors.
_Avoid_: Broken card

**Opponent-facing card**:
A card whose effect only matters with opponents present, such as "each opponent discards a card". It is noted in the report but is not an unsupported card; in a goldfish its opponent-facing part does nothing.
_Avoid_: Interaction card, unsupported interaction

**Finding**:
A deck-agnostic metric reported as a distribution across many games, such as the turn the commander is cast or mana spent per turn.
_Avoid_: Stat, result, insight

**Stumble**:
A game in which the deck casts nothing relevant by the end of the observed turns.
_Avoid_: Dud, brick
