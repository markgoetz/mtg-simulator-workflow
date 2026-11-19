# mtg-simulator-workflow

This repository represents an agentic workflow to simulate playtesting Magic the Gathering Commander decks. The goal is to load a decklist from a local text file, iterate through hundreds of simulated games, and compile the findings of what the deck was able to do within the first six turns.

## Usage

Run the CLI with the path to a Decklist text export. The `decks/` folder is gitignored, so it is a good place to keep your own:

```sh
npm run decklist -- decks/atraxa.txt
npm run decklist -- decks/atraxa.txt --commander "Atraxa"  # name the commander explicitly
```
