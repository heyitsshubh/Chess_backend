// ============================================================
// Socket Event Handlers
//
// Wires up Socket.IO events to the Matchmaking and GameRoom services.
// ============================================================
import { Server, Socket } from "socket.io";
import { AuthenticatedSocket } from "./middleware";
import { MatchmakingService } from "../services/MatchmakingService";
import { GameRoomService } from "../services/GameRoomService";
import { TimeControl } from "../core/types";
import { logger } from "@chess/logger";

export function registerSocketHandlers(
  io: Server,
  socket: Socket,
  matchmakingService: MatchmakingService,
  gameRoomService: GameRoomService,
) {
  const authSocket = socket as AuthenticatedSocket;
  const user = authSocket.user;

  // Track the user's active game ID so we can handle disconnects
  let activeGameId: string | null = null;
  let activeTimeControl: TimeControl | null = null;

  socket.on("matchmaking:join", async (timeControl: TimeControl) => {
    activeTimeControl = timeControl;
    const match = await matchmakingService.joinQueue({
      userId: user.sub,
      username: user.username,
      timeControl,
      socketId: socket.id,
    });

    if (match) {
      const { gameId, opponent, selfElo } = match;

      // Create the game state
      const game = await gameRoomService.createGame(
        gameId,
        {
          userId: user.sub,
          username: user.username,
          socketId: socket.id,
          elo: selfElo,
        },
        opponent,
        timeControl,
      );

      // Join the Socket.IO room for this game
      socket.join(`game:${gameId}`);
      // The opponent is connected elsewhere, tell them to join the room
      io.to(opponent.socketId).socketsJoin(`game:${gameId}`);

      activeGameId = gameId;

      // Broadcast game start to both players
      io.to(`game:${gameId}`).emit("matchmaking:matched", {
        gameId,
        white: game.white,
        black: game.black,
        fen: game.fen,
      });
    }
  });

  socket.on("matchmaking:leave", async () => {
    if (activeTimeControl) {
      await matchmakingService.leaveQueue({
        userId: user.sub,
        username: user.username,
        timeControl: activeTimeControl,
        socketId: socket.id,
      });
      activeTimeControl = null;
    }
  });

  socket.on(
    "game:move",
    async ({ gameId, move }: { gameId: string; move: number }) => {
      const result = await gameRoomService.makeMove(gameId, user.sub, move);

      if (result.valid && result.game) {
        // Broadcast the move to everyone in the room (including spectators)
        io.to(`game:${gameId}`).emit("game:move_made", {
          move,
          fen: result.game.fen,
          whiteTime: result.game.whiteTime,
          blackTime: result.game.blackTime,
        });

        // If game ended, broadcast result
        if (result.status && result.status !== "IN_PROGRESS") {
          io.to(`game:${gameId}`).emit("game:end", {
            reason: result.status,
            winner: result.winner,
          });
        }
      } else {
        socket.emit("game:error", "Invalid move");
      }
    },
  );

  socket.on("game:resign", async (gameId: string) => {
    const game = await gameRoomService.resign(gameId, user.sub);
    if (game) {
      const winner = game.white.userId === user.sub ? "BLACK" : "WHITE";
      io.to(`game:${gameId}`).emit("game:end", {
        reason: "RESIGNATION",
        winner,
      });
    }
  });

  socket.on("disconnect", async () => {
    logger.info(
      { userId: user.sub, socketId: socket.id },
      "Socket disconnected",
    );

    // Remove from matchmaking if they were in it
    if (activeTimeControl) {
      await matchmakingService.leaveQueue({
        userId: user.sub,
        username: user.username,
        timeControl: activeTimeControl,
        socketId: socket.id,
      });
    }

    // In a full production app, we would handle reconnect grace periods here
    // For now, if they disconnect during a game, they auto-resign
    if (activeGameId) {
      const game = await gameRoomService.resign(activeGameId, user.sub);
      if (game) {
        const winner = game.white.userId === user.sub ? "BLACK" : "WHITE";
        io.to(`game:${activeGameId}`).emit("game:end", {
          reason: "ABANDONED",
          winner,
        });
      }
    }
  });
}
