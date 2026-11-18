# Card effects are LLM-translated once into a cached schema, then executed deterministically

Commander decks use hundreds of distinct card effects, which is too many to hand-code. We have an LLM translate each card's oracle text once into a structured effect description, validated against a fixed schema and cached per card. The rules engine executes only that description, so games stay reproducible and cheap. Cards that do not fit the schema, or whose translation fails validation, become unsupported cards and are reported with a reason.

## Considered Options

- **Hand-coded effects per card.** Fully deterministic, but the per-card table grows slowly and most decks would be mostly unsupported at first.
- **Player agent narrates effect outcomes at play time.** Rejected: outcomes would not be reproducible or trustworthy, and every game would pay LLM cost for rules resolution.

## Consequences

- The effect schema is the core contract. Supporting a new kind of card means extending the schema, not patching the engine.
- Translations must be validated and cached, and a wrong translation is worse than an unsupported card, so failures are left unsupported.
