import * as grpc from '@grpc/grpc-js';
import { userProto } from '@chess/grpc';
import { logger } from '@chess/logger';

export class AuthClient {
  private client: any;

  constructor() {
    // Connect to the gRPC port exposed by auth-service
    // In a Docker environment, 'auth-service' should be used. For local dev, 'localhost'
    const authServiceUrl = process.env.AUTH_SERVICE_GRPC_URL || 'localhost:50051';
    
    this.client = new userProto.UserService(
      authServiceUrl,
      grpc.credentials.createInsecure()
    );
  }

  public getUserInfo(userId: string): Promise<{ user_id: string; username: string; elo: number } | null> {
    return new Promise((resolve, reject) => {
      this.client.GetUserInfo({ user_id: userId }, (err: any, response: any) => {
        if (err) {
          logger.error({ err, userId }, 'Failed to fetch user info via gRPC');
          return resolve(null); // Fallback or reject depending on business logic
        }
        resolve(response);
      });
    });
  }
}

export const authClient = new AuthClient();
