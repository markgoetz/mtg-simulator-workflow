# mtg-simulator-workflow

This repository represents an agentic workflow to simulate playtesting Magic the Gathering Commander decks. The goal is to load a decklist from a local text file, iterate through hundreds of simulated games, and compile the findings of what the deck was able to do within the first six turns.

## Usage

Run the CLI with the path to a Decklist text export. It checks the Decklist against Commander rules, plays one Game and prints the Game log as JSON lines. The `decks/` folder is gitignored, so it is a good place to keep your own:

```sh
npm run decklist -- decks/atraxa.txt
npm run decklist -- decks/atraxa.txt --commander "Atraxa, Praetors' Voice"  # name the commander explicitly
npm run decklist -- decks/atraxa.txt --seed 42 --horizon 4  # same seed, same Game log
```

Without `--seed`, a random seed is chosen and written in the Game log's `setup` event, so any Game can be replayed. `--horizon` is the number of turns to play, six by default.
