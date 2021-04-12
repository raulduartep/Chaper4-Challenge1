import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryTransfersRepository } from "../../repositories/in-memory/InMemoryTransfersRepository";
import { GetBalanceUseCase } from "../getBalance/GetBalanceUseCase";
import { CreateTransferError } from "./CreateTransferError";
import { CreateTransferUseCase } from "./CreateTransferUseCase";

let inMemoryTransfersRepository: InMemoryTransfersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let createTransferUseCase: CreateTransferUseCase;
let getBalanceUseCase: GetBalanceUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Create Transfer", () => {
  beforeEach(() => {
    inMemoryTransfersRepository = new InMemoryTransfersRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository(
      inMemoryTransfersRepository
    );
    createTransferUseCase = new CreateTransferUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository,
      inMemoryTransfersRepository
    );
    getBalanceUseCase = new GetBalanceUseCase(
      inMemoryStatementsRepository,
      inMemoryUsersRepository
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

    await inMemoryStatementsRepository.create({
      amount: 5000,
      description: "test",
      type: OperationType.DEPOSIT,
      user_id: senderUser.id || "",
    });

    const transfer = await createTransferUseCase.execute({
      amount: 500,
      description: "Test transfer",
      receiver_id: receiverUser.id || "",
      sender_id: senderUser.id || "",
    });

    expect(transfer).toEqual({
      id: expect.any(String),
      amount: 500,
      description: "Test transfer",
      type: "transfer_sent",
      user_id: senderUser.id,
      received_id: receiverUser.id,
    });
  });

  it("Should not be able to create a new transfer if receiver user is equal to sender user", async () => {
    const user = await inMemoryUsersRepository.create({
      email: "sendertest@test.com.br",
      name: "Sender da Silva",
      password: "1234",
    });

    await inMemoryStatementsRepository.create({
      amount: 5000,
      description: "test",
      type: OperationType.DEPOSIT,
      user_id: user.id || "",
    });

    await expect(
      createTransferUseCase.execute({
        amount: 500,
        description: "Test",
        receiver_id: user.id || "",
        sender_id: user.id || "",
      })
    ).rejects.toBeInstanceOf(CreateTransferError.SenderUserEqualtoReceiverUser);
  });

  it("Should not be able to create a new transfer if receiver user not exists", async () => {
    const senderUser = await inMemoryUsersRepository.create({
      email: "receivertest@test.com.br",
      name: "Receiver da Silva",
      password: "1234",
    });

    await inMemoryStatementsRepository.create({
      amount: 5000,
      description: "test",
      type: OperationType.DEPOSIT,
      user_id: senderUser.id || "",
    });

    await expect(
      createTransferUseCase.execute({
        amount: 500,
        description: "Test",
        receiver_id: "nonexistent user",
        sender_id: senderUser.id || "",
      })
    ).rejects.toBeInstanceOf(CreateTransferError.ReceiverUserNotFound);
  });

  it("Should not be able to create a new transfer if sender user not exists", async () => {
    const receiverUser = await inMemoryUsersRepository.create({
      email: "receivertest@test.com.br",
      name: "Receiver da Silva",
      password: "1234",
    });

    await inMemoryStatementsRepository.create({
      amount: 5000,
      description: "test",
      type: OperationType.DEPOSIT,
      user_id: receiverUser.id || "",
    });

    await expect(
      createTransferUseCase.execute({
        amount: 500,
        description: "Test",
        receiver_id: receiverUser.id || "",
        sender_id: "nonexistent user",
      })
    ).rejects.toBeInstanceOf(CreateTransferError.SenderUserNotFound);
  });

  it("Should not be able to create a new transfer if sender user has insufficient funds", async () => {
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

    await expect(
      createTransferUseCase.execute({
        amount: 500,
        description: "Test",
        receiver_id: receiverUser.id || "",
        sender_id: senderUser.id || "",
      })
    ).rejects.toBeInstanceOf(CreateTransferError.InsuffientFunds);
  });
});
