import type { CardData, CardCache } from "../cardData/index.js";
import { resolveDecklist } from "../cardData/index.js";
import type { Decklist } from "../decklist/index.js";
import { createGameLogRecorder, type GameLog } from "../gameLog/index.js";
import type { PlayerAgent } from "../playerAgent/index.js";
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
    deps.playerAgent.chooseAction(game.view());
    recorder.record({ type: "pass", turn: game.view().turn });
    game.endTurn();
  }
  return { gameLogs: [recorder.log()] };
}
