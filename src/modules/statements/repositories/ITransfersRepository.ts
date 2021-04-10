import { Transfer } from "../entities/Transfer";
import { CreateTransferDTO } from "../useCases/createTransfer/CreateTransferDTO";

export interface ITransferRepository {
  create: ({ receiver_id, sender_id }: CreateTransferDTO) => Promise<Transfer>;
}
