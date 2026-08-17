import { MoveFlags } from "../core/Move";

export interface GameStateRecord {
  move: number; // 0 if none (start)
  castlingRights: number;
  enPassantSquare: number;
  halfMoveClock: number;
  hashKey: bigint;
  capturedPiece: number; // -1 if none
}

export class History {
  private stack: GameStateRecord[] = [];

  public push(record: GameStateRecord) {
    this.stack.push(record);
  }

  public pop(): GameStateRecord | undefined {
    return this.stack.pop();
  }

  public peek(): GameStateRecord | undefined {
    return this.stack.length > 0
      ? this.stack[this.stack.length - 1]
      : undefined;
  }

  public clear() {
    this.stack = [];
  }

  public get length(): number {
    return this.stack.length;
  }
}
