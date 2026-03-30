import { RepositoryContainer, repositoryContainer } from "../../db/repositories";
import { ServiceContainer } from "./ServiceContainer";

export class AppContainer {
  readonly repositories: RepositoryContainer;
  readonly services: ServiceContainer;

  constructor(repositories: RepositoryContainer = repositoryContainer) {
    this.repositories = repositories;
    this.services = new ServiceContainer(repositories);
  }
}

export const appContainer = new AppContainer();
