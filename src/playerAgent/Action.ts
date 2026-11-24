/**
 * What a Player agent can choose to do at a decision. `card` is the name of a card in hand or on the battlefield.
 * The rules engine rejects an action that is not legal.
 */
type Action =
  | { type: "pass" }
  | { type: "play-land"; card: string }
  | { type: "cast"; card: string }
  | { type: "attack"; card: string }
  | { type: "activate"; card: string };

export default Action;
