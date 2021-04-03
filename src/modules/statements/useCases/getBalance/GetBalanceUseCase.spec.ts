import { hash } from "bcryptjs";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let inMemoryStatementRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let getBalanceUseCase: GetBalanceUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Get Balance", () => {
  beforeEach(() => {
    inMemoryStatementRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    getBalanceUseCase = new GetBalanceUseCase(
      inMemoryStatementRepository,
      inMemoryUsersRepository
    );
  });

  it("Should be able to get a balance", async () => {
    const passwordHash = await hash("test", 8);

    const user = await inMemoryUsersRepository.create({
      email: "test@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    const statement1 = await inMemoryStatementRepository.create({
      user_id: user.id || "",
      amount: 200,
      description: "Test Description",
      type: "deposit" as OperationType,
    });

    const statament2 = await inMemoryStatementRepository.create({
      user_id: user.id || "",
      amount: 50,
      description: "Test Description",
      type: "withdraw" as OperationType,
    });

    const balance = await getBalanceUseCase.execute({
      user_id: user.id || "",
    });

    expect(balance).toEqual({
      statement: expect.arrayContaining([statement1, statament2]),
      balance: 150,
    });
  });

  it("Should not be able to get a balance from a nonexistent user", () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: "nonexistent user",
      });
    }).rejects.toBeInstanceOf(GetBalanceError);
  });
});
