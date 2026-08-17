import * as grpc from "@grpc/grpc-js";
import { PrismaClient } from "../generated/prisma";
import { logger } from "@chess/logger";

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  public GetUserInfo = async (
    call: grpc.ServerUnaryCall<{ user_id: string }, any>,
    callback: grpc.sendUnaryData<any>,
  ) => {
    try {
      const { user_id } = call.request;

      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
      });

      if (!user) {
        logger.warn({ user_id }, "gRPC GetUserInfo: User not found");
        return callback({
          code: grpc.status.NOT_FOUND,
          details: "User not found",
        });
      }

      callback(null, {
        user_id: user.id,
        username: user.username,
        elo: user.elo,
      });
    } catch (error: any) {
      logger.error({ err: error }, "gRPC GetUserInfo error");
      callback({
        code: grpc.status.INTERNAL,
        details: "Internal server error",
      });
    }
  };
}
