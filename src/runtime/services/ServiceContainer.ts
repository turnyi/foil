import type { RepositoryContainer } from "../db/repositories/RepositoryContainer";
import { SessionService } from "./SessionService";
import { MessageService } from "./MessageService";

export class ServiceContainer {
  readonly sessionService: SessionService;
  readonly messageService: MessageService;

  constructor(repositoryContainer: RepositoryContainer) {
    this.sessionService = new SessionService(
      repositoryContainer.sessionRepository,
    );
    this.messageService = new MessageService(
      repositoryContainer.messageRepository,
    );
  }
}
