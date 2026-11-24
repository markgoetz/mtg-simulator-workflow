import type { CardData, CardCache } from "../cardData/index.js";
import { resolveDecklist } from "../cardData/index.js";
import type { Decklist } from "../decklist/index.js";
import { createGameLogRecorder, type GameLog } from "../gameLog/index.js";
import type { Action, PlayerAgent } from "../playerAgent/index.js";
import { Game } from "../rulesEngine/index.js";
import validateBatchConfig from "./validateBatchConfig.js";

export interface BatchConfig {
  seed: number;
  horizon: number;
}

export interface BatchDeps {
  cardCache: CardCache;
  playerAgent: PlayerAgent;
}

export interface BatchResult {
  gameLogs: GameLog[];
}

/** A Player agent that never passes would otherwise loop forever. */
export const MAX_ACTIONS_PER_TURN = 200;

/** Hands each action a Player agent can choose to the Rules engine; a new action will not compile without one. */
const perform: Record<Exclude<Action["type"], "pass">, (game: Game, card: string) => void> = {
  "play-land": (game, card) => game.playLand(card),
  cast: (game, card) => game.cast(card),
  attack: (game, card) => game.attack(card),
  activate: (game, card) => game.activate(card),
};

/** Plays the Batch of Games of a Decklist and returns their Game logs. One Game, for now. */
export default function runBatch(decklist: Decklist, config: BatchConfig, deps: BatchDeps): BatchResult {
  validateBatchConfig(config);
  const { commanders, cards } = resolveDecklist(decklist, deps.cardCache);
  const library: CardData[] = cards.flatMap(({ cardData, quantity }) => Array<CardData>(quantity).fill(cardData));
  const recorder = createGameLogRecorder();
  const game = new Game({ commanders, library, seed: config.seed, horizon: config.horizon, recorder });

  game.start();
  while (!game.isOver()) {
    game.startTurn();
    for (let actions = 0; ; actions++) {
      const view = game.view();
      if (actions === MAX_ACTIONS_PER_TURN)
        throw new Error(`The Player agent took ${MAX_ACTIONS_PER_TURN} actions on turn ${view.turn} without passing`);
      const action = deps.playerAgent.chooseAction(view);
      if (action.type === "pass") {
        game.pass();
        break;
      }
      recorder.record({ type: "decision", turn: view.turn, action });
      perform[action.type](game, action.card);
    }
    game.endTurn();
  }
  return { gameLogs: [recorder.log()] };
}
