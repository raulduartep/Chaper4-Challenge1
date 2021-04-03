import { hash } from "bcryptjs";
import { rejects } from "node:assert";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { ICreateStatementDTO } from "./ICreateStatementDTO";

let inMemoryStatementRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let createStatementUseCase: CreateStatementUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Create Statement", () => {
  beforeEach(() => {
    inMemoryStatementRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementRepository
    );
  });

  it("Should be able to create a new statement as a deposit", async () => {
    const passwordHash = await hash("test", 8);

    const user = await inMemoryUsersRepository.create({
      email: "test@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    const statement: ICreateStatementDTO = {
      user_id: user.id || "",
      amount: 200,
      description: "dsadsada",
      type: "deposit" as OperationType,
    };

    const createdStatement = await createStatementUseCase.execute(statement);

    expect(createdStatement).toEqual({
      id: expect.any(String),
      ...statement,
    });
  });

  it("Should be able to create a new statement as a withdraw", async () => {
    const passwordHash = await hash("test", 8);

    const user = await inMemoryUsersRepository.create({
      email: "test@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    const depositStatement: ICreateStatementDTO = {
      user_id: user.id || "",
      amount: 500,
      description: "dsadsada",
      type: "deposit" as OperationType,
    };

    await createStatementUseCase.execute(depositStatement);

    const withdrawStatement: ICreateStatementDTO = {
      user_id: user.id || "",
      amount: 200,
      description: "dsadsada",
      type: "withdraw" as OperationType,
    };

    const createdStatement = await createStatementUseCase.execute(
      withdrawStatement
    );

    expect(createdStatement).toEqual({
      id: expect.any(String),
      ...withdrawStatement,
    });
  });

  it("Should not be able to create a new statement from a nonexistent user", () => {
    expect(async () => {
      await createStatementUseCase.execute({
        user_id: "nonexistent user",
        amount: 200,
        description: "dsadsada",
        type: "deposit" as OperationType,
      });
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it("Should not be albe to create a new statement as a withdraw with insufficient found", async () => {
    const passwordHash = await hash("test", 8);

    const user = await inMemoryUsersRepository.create({
      email: "test@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    const depositStatement: ICreateStatementDTO = {
      user_id: user.id || "",
      amount: 200,
      description: "dsadsada",
      type: "deposit" as OperationType,
    };

    await createStatementUseCase.execute(depositStatement);

    const withdrawStatement: ICreateStatementDTO = {
      user_id: user.id || "",
      amount: 500,
      description: "dsadsada",
      type: "withdraw" as OperationType,
    };

    expect(async () => {
      await createStatementUseCase.execute(withdrawStatement);
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });
});
