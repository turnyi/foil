import type { ModelMessage } from "ai";
import type { Session } from "../../../db/schema";
import type { MessageService, SessionService } from "../../services";
import type ISessionEngine from "./isession.engine";

export default class MessageSession implements ISessionEngine {
  private sessionService: SessionService;
  private messageService: MessageService;
  private activeSession?: Session
  private activeSessionMessages?: ModelMessage[]

  constructor(sessionService: SessionService, messageService: MessageService) {
    this.sessionService = sessionService
    this.messageService = messageService
  }

  async buildContext(promptMessage: ModelMessage): Promise<ModelMessage[]> {
    if (!this.activeSession) throw Error()
    if (!this.activeSessionMessages)
      this.activeSessionMessages = []
    this.activeSessionMessages.push(promptMessage)
    await this.messageService.create({ sessionId: this.activeSession.id, role: promptMessage.role, content: promptMessage.content.toString(), })

    return this.activeSessionMessages
  }
  async createSession(sessionName: string, modelId: string): Promise<Session> {
    return await this.sessionService.create({ name: sessionName, modelId })
  }

  async loadSession(session: Session, messages: ModelMessage[]): Promise<void> {
    this.activeSession = session
    this.activeSessionMessages = messages
  }

}
