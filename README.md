# mtg-simulator-workflow

This repository represents an agentic workflow to simulate playtesting Magic the Gathering Commander decks. The goal is to load a decklist from a local text file, iterate through hundreds of simulated games, and compile the findings of what the deck was able to do within the first six turns.

## Usage

Put Decklist text exports in the gitignored `decks/` folder, then run the CLI with the file name:

```sh
npm run decklist -- atraxa.txt                       # reads decks/atraxa.txt
npm run decklist -- atraxa.txt --commander "Atraxa"  # name the commander explicitly
npm run decklist -- ./elsewhere/atraxa.txt           # a path with a folder is used as given
```
