import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryTransfersRepository } from "../../repositories/in-memory/InMemoryTransfersRepository";
import { CreateTransferUseCase } from "./CreateTransferUseCase";

let inMemoryTransfersRepository: InMemoryTransfersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let createTransferUseCase: CreateTransferUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Create Transfer", () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryTransfersRepository = new InMemoryTransfersRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createTransferUseCase = new CreateTransferUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository,
      inMemoryTransfersRepository
    );
  });

  it("Should be able to create a new transfer", async () => {
    const senderUser = await inMemoryUsersRepository.create({
      email: "sendertest@test.com.br",
      name: "Sender da Silva",
      password: "1234",
    });

    const receiverUser = await inMemoryUsersRepository.create({
      email: "receivertest@test.com.br",
      name: "Receiver da Silva",
      password: "1234",
    });

    const statement1 = await inMemoryStatementsRepository.create({
      amount: 5000,
      description: "test",
      type: OperationType.DEPOSIT,
      user_id: senderUser.id || "",
    });

    const statement2 = await inMemoryStatementsRepository.create({
      amount: 500,
      description: "test",
      type: OperationType.WITHDRAW,
      user_id: senderUser.id || "",
    });

    const transfer = await createTransferUseCase.execute({
      amount: 500,
      description: "Test transfer",
      receiver_id: receiverUser.id || "",
      sender_id: senderUser.id || "",
    });
  });
});
