import { inject, injectable } from "tsyringe";

import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { Statement } from "../../entities/Statement";
import { BalanceMap } from "../../mappers/BalanceMap";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { StatementTransform } from "../../transformers/StatementTransform";
import { TransferTransform } from "../../transformers/TransferTransform";
import { GetBalanceError } from "./GetBalanceError";

interface IRequest {
  user_id: string;
}

interface IResponse {
  statement: (TransferTransform | StatementTransform)[];
  balance: number;
}

@injectable()
export class GetBalanceUseCase {
  constructor(
    @inject("StatementsRepository")
    private statementsRepository: IStatementsRepository,

    @inject("UsersRepository")
    private usersRepository: IUsersRepository
  ) {}

  async execute({ user_id }: IRequest): Promise<IResponse> {
    const user = await this.usersRepository.findById(user_id);

    if (!user) {
      throw new GetBalanceError();
    }

    const {
      balance,
      statement,
    } = (await this.statementsRepository.getUserBalance({
      user_id,
      with_statement: true,
    })) as { balance: number; statement: Statement[] };

    return BalanceMap.toDTO({ balance, statement });
  }
}
