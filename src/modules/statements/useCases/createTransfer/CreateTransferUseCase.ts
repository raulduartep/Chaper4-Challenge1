import { inject, injectable } from "tsyringe";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { Statement } from "../../entities/Statement";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { ITransferRepository } from "../../repositories/ITransfersRepository";
import { CreateTransferError } from "./CreateTransferError";

type IRequest = {
  sender_id: string;
  receiver_id: string;
  amount: number;
  description: string;
};

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

@injectable()
export class CreateTransferUseCase {
  constructor(
    @inject("UsersRepository")
    private usersRepository: IUsersRepository,

    @inject("StatementRepository")
    private statementsRepository: IStatementsRepository,

    @inject("TransfersRepository")
    private transfersRepository: ITransferRepository
  ) {}

  async execute({
    sender_id,
    receiver_id,
    amount,
    description,
  }: IRequest): Promise<Statement> {
    if (sender_id === receiver_id) {
      throw new CreateTransferError.SenderUserEqualtoReceiverUser();
    }

    const senderUser = await this.usersRepository.findById(sender_id);

    if (!senderUser) {
      throw new CreateTransferError.SenderUserNotFound();
    }

    const receiverUser = await this.usersRepository.findById(receiver_id);

    if (!receiverUser) {
      throw new CreateTransferError.ReceiverUserNotFound();
    }

    const { balance } = await this.statementsRepository.getUserBalance({
      user_id: sender_id,
    });

    if (balance < amount) {
      throw new CreateTransferError.InsuffientFunds();
    }

    const transfer = await this.transfersRepository.create({
      sender_id,
      receiver_id,
    });

    const statementSender = await this.statementsRepository.create({
      amount,
      description,
      type: OperationType.WITHDRAW,
      user_id: sender_id,
      transfer_id: transfer.id,
    });

    await this.statementsRepository.create({
      amount,
      description,
      type: OperationType.DEPOSIT,
      user_id: receiver_id,
      transfer_id: transfer.id,
    });

    return statementSender;
  }
}
