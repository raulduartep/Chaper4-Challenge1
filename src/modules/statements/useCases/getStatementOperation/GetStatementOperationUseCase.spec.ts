import { hash } from "bcryptjs";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let inMemoryStatementRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let getStatementOperationUseCase: GetStatementOperationUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Get Statement Operation", () => {
  beforeEach(() => {
    inMemoryStatementRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      inMemoryUsersRepository,
      inMemoryStatementRepository
    );
  });

  it("Should be able to get a statement", async () => {
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

    const getStatement = await getStatementOperationUseCase.execute({
      user_id: user.id || "",
      statement_id: statement.id || "",
    });

    expect(getStatement).toEqual(statement);
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
