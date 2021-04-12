import { container } from "tsyringe";

import { IUsersRepository } from "../../modules/users/repositories/IUsersRepository";
import { UsersRepository } from "../../modules/users/repositories/UsersRepository";

import { IStatementsRepository } from "../../modules/statements/repositories/IStatementsRepository";
import { StatementsRepository } from "../../modules/statements/repositories/StatementsRepository";
import { ITransferRepository } from "../../modules/statements/repositories/ITransfersRepository";
import { TransfersRepository } from "../../modules/statements/repositories/TransfersRepository";

container.registerSingleton<IUsersRepository>(
  "UsersRepository",
  UsersRepository
);

container.registerSingleton<IStatementsRepository>(
  "StatementsRepository",
  StatementsRepository
);

container.registerSingleton<ITransferRepository>(
  "TransfersRepository",
  TransfersRepository
);
