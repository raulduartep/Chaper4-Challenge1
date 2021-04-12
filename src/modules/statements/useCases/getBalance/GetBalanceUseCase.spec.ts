import { hash } from "bcryptjs";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryTransfersRepository } from "../../repositories/in-memory/InMemoryTransfersRepository";
import { CreateTransferUseCase } from "../createTransfer/CreateTransferUseCase";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let inMemoryStatementRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryTranfersRepository: InMemoryTransfersRepository;
let getBalanceUseCase: GetBalanceUseCase;
let createTransferUseCase: CreateTransferUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Get Balance", () => {
  beforeEach(() => {
    inMemoryTranfersRepository = new InMemoryTransfersRepository();
    inMemoryStatementRepository = new InMemoryStatementsRepository(
      inMemoryTranfersRepository
    );
    inMemoryUsersRepository = new InMemoryUsersRepository();
    getBalanceUseCase = new GetBalanceUseCase(
      inMemoryStatementRepository,
      inMemoryUsersRepository
    );
    createTransferUseCase = new CreateTransferUseCase(
      inMemoryUsersRepository,
      inMemoryStatementRepository,
      inMemoryTranfersRepository
    );
  });

  it("Should be able to get a balance", async () => {
    const passwordHash = await hash("test", 8);

    const user = await inMemoryUsersRepository.create({
      email: "test@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    const user2 = await inMemoryUsersRepository.create({
      email: "test2@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    const statement1 = await inMemoryStatementRepository.create({
      user_id: user.id || "",
      amount: 500,
      description: "Test Description",
      type: "deposit" as OperationType,
    });

    const statament2 = await inMemoryStatementRepository.create({
      user_id: user.id || "",
      amount: 50,
      description: "Test Description",
      type: "withdraw" as OperationType,
    });

    const transfer = await createTransferUseCase.execute({
      amount: 300,
      description: "test",
      receiver_id: user2.id || "",
      sender_id: user.id || "",
    });

    const balanceSenderUser = await getBalanceUseCase.execute({
      user_id: user.id || "",
    });

    const balanceReceiverUser = await getBalanceUseCase.execute({
      user_id: user2.id || "",
    });

    expect(balanceSenderUser).toEqual({
      statement: expect.arrayContaining([statement1, statament2, transfer]),
      balance: 150,
    });

    expect(balanceReceiverUser.statement[0]).toMatchObject({
      amount: 300,
      description: "test",
      type: "transfer_received",
      sender_id: user.id,
      id: expect.any(String),
      created_at: undefined,
      updated_at: undefined,
    });
    expect(balanceReceiverUser.balance).toEqual(300);
  });

  it("Should not be able to get a balance from a nonexistent user", () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: "nonexistent user",
      });
    }).rejects.toBeInstanceOf(GetBalanceError);
  });
});
