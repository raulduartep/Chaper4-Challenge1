import { Transfer } from "../../entities/Transfer";
import { CreateTransferDTO } from "../../useCases/createTransfer/CreateTransferDTO";
import { ITransferRepository } from "../ITransfersRepository";

export class InMemoryTransfersRepository implements ITransferRepository {
  private transfers: Transfer[] = [];

  async create({
    receiver_id,
    sender_id,
  }: CreateTransferDTO): Promise<Transfer> {
    const transfer = new Transfer();

    Object.assign(transfer, {
      receiver_id,
      sender_id,
    });

    this.transfers.push(transfer);

    return transfer;
  }

  async findById(id: string): Promise<Transfer | undefined> {
    const transfer = this.transfers.find((transfer) => transfer.id === id);

    return transfer;
  }
}
