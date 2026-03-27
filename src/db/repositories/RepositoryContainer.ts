import { SessionRepository } from "./SessionRepository";
import { MessageRepository } from "./MessageRepository";

export class RepositoryContainer {
  readonly sessionRepository: SessionRepository;
  readonly messageRepository: MessageRepository;

  constructor() {
    this.sessionRepository = new SessionRepository();
    this.messageRepository = new MessageRepository();
  }
}

export const repositoryContainer = new RepositoryContainer();
