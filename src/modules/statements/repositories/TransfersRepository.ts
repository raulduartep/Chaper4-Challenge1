import { getRepository, Repository } from "typeorm";
import { Transfer } from "../entities/Transfer";
import { CreateTransferDTO } from "../useCases/createTransfer/CreateTransferDTO";
import { ITransferRepository } from "./ITransfersRepository";

export class TransfersRepository implements ITransferRepository {
  private repository: Repository<Transfer>;

  constructor() {
    this.repository = getRepository(Transfer);
  }

  async create({
    receiver_id,
    sender_id,
  }: CreateTransferDTO): Promise<Transfer> {
    const transfer = this.repository.create({
      receiver_id,
      sender_id,
    });

    await this.repository.save(transfer);

    return transfer;
  }
}
