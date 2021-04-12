import { hash } from "bcryptjs";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryTransfersRepository } from "../../repositories/in-memory/InMemoryTransfersRepository";
import { CreateTransferUseCase } from "../createTransfer/CreateTransferUseCase";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let inMemoryStatementRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryTransfersRepository: InMemoryTransfersRepository;
let getStatementOperationUseCase: GetStatementOperationUseCase;
let createTransferUseCase: CreateTransferUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Get Statement Operation", () => {
  beforeEach(() => {
    inMemoryTransfersRepository = new InMemoryTransfersRepository();
    inMemoryStatementRepository = new InMemoryStatementsRepository(
      inMemoryTransfersRepository
    );
    inMemoryUsersRepository = new InMemoryUsersRepository();
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      inMemoryUsersRepository,
      inMemoryStatementRepository
    );
    createTransferUseCase = new CreateTransferUseCase(
      inMemoryUsersRepository,
      inMemoryStatementRepository,
      inMemoryTransfersRepository
    );
  });

  it("Should be able to get a statement with type statement", async () => {
    const passwordHash = await hash("test", 8);

    const senderUser = await inMemoryUsersRepository.create({
      email: "test@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    const receiverUser = await inMemoryUsersRepository.create({
      email: "test3@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    const statement = await inMemoryStatementRepository.create({
      user_id: senderUser.id || "",
      amount: 200,
      description: "Test Description",
      type: "deposit" as OperationType,
    });

    const getStatement = await getStatementOperationUseCase.execute({
      user_id: senderUser.id || "",
      statement_id: statement.id || "",
    });

    expect(getStatement).toEqual(statement);
  });

  it("Should be able to get a statement with type transfer", async () => {
    const passwordHash = await hash("test", 8);

    const senderUser = await inMemoryUsersRepository.create({
      email: "test@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    const receiverUser = await inMemoryUsersRepository.create({
      email: "test3@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    await inMemoryStatementRepository.create({
      user_id: senderUser.id || "",
      amount: 200,
      description: "Test Description",
      type: "deposit" as OperationType,
    });

    const transfer = await createTransferUseCase.execute({
      amount: 100,
      description: "test transfer",
      sender_id: senderUser.id || "",
      receiver_id: receiverUser.id || "",
    });

    const getStatement = await getStatementOperationUseCase.execute({
      user_id: senderUser.id || "",
      statement_id: transfer.id || "",
    });

    expect(getStatement).toEqual(transfer);
  });

  it("Should not be able to get a statement from a nonexistent user", async () => {
    const passwordHash = await hash("test", 8);

    const user = await inMemoryUsersRepository.create({
      email: "test@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    const statement = await inMemoryStatementRepository.create({
      user_id: user.id || "",
      amount: 200,
      description: "Test Description",
      type: "deposit" as OperationType,
    });

    expect(async () => {
      await getStatementOperationUseCase.execute({
        user_id: "nonexistent user",
        statement_id: statement.id || "",
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
  });

  it("Should not be able to get a nonexistent statement", async () => {
    const passwordHash = await hash("test", 8);

    const user = await inMemoryUsersRepository.create({
      email: "test@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    expect(async () => {
      await getStatementOperationUseCase.execute({
        user_id: user.id || "",
        statement_id: "nonexistent statement",
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
  });
});
