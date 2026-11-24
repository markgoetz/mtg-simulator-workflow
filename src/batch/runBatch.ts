import type { CardData, CardCache } from "../cardData/index.js";
import { resolveDecklist } from "../cardData/index.js";
import type { Decklist } from "../decklist/index.js";
import { createGameLogRecorder, type GameLog, type GameLogEventBody } from "../gameLog/index.js";
import type { Action, PlayerAgent } from "../playerAgent/index.js";
import { Game } from "../rulesEngine/index.js";
import playOpeningHand from "./playOpeningHand.js";
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

/** The Game log event for each action a Player agent can choose; a new action will not compile without one. */
const eventForAction: Record<Action["type"], (turn: number) => GameLogEventBody> = {
  pass: (turn) => ({ type: "pass", turn }),
};

/** Plays the Batch of Games of a Decklist and returns their Game logs. One Game, for now. */
export default function runBatch(decklist: Decklist, config: BatchConfig, deps: BatchDeps): BatchResult {
  validateBatchConfig(config);
  const { commanders, cards } = resolveDecklist(decklist, deps.cardCache);
  const library: CardData[] = cards.flatMap(({ cardData, quantity }) => Array<CardData>(quantity).fill(cardData));
  const recorder = createGameLogRecorder();
  const game = new Game({ commanders, library, seed: config.seed, horizon: config.horizon, recorder });

  playOpeningHand(game, deps.playerAgent, recorder);
  while (!game.isOver()) {
    game.startTurn();
    const view = game.view();
    const action = deps.playerAgent.chooseAction(view);
    recorder.record(eventForAction[action.type](view.turn));
    game.endTurn();
  }
  return { gameLogs: [recorder.log()] };
}
