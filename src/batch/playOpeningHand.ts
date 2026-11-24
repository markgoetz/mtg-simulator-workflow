import type { GameLogRecorder } from "../gameLog/index.js";
import type { PlayerAgent } from "../playerAgent/index.js";
import type { Game } from "../rulesEngine/index.js";

/** Asks the Player agent to keep or mulligan until it keeps, then has it bottom the cards owed. */
export default function playOpeningHand(game: Game, agent: PlayerAgent, recorder: GameLogRecorder): void {
  game.start();
  while (game.canMulligan() && agent.chooseMulligan(game.view()) === "mulligan") {
    recorder.record({ type: "mulligan", turn: 0, mulligansTaken: game.view().mulligansTaken });
    game.mulligan();
  }
  recorder.record({ type: "keep", turn: 0, mulligansTaken: game.view().mulligansTaken });
  const count = game.cardsToBottom();
  if (count > 0) game.bottom(agent.chooseBottom(game.view(), count));
}
