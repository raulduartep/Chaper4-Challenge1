import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";
import { ICreateUserDTO } from "./ICreateUserDTO";

let createUserUseCase: CreateUserUseCase;
let inMemoryUserRepository: InMemoryUsersRepository;

describe("Create User", () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUserRepository);
  });

  it("Should be able to create a new user", async () => {
    const user: ICreateUserDTO = {
      email: "test@test.com",
      name: "Teste da Silva",
      password: "test",
    };

    const createdUser = await createUserUseCase.execute(user);

    expect(createdUser).toMatchObject({
      ...user,
      id: expect.any(String),
      password: expect.any(String),
    });
  });

  it("Should not be able to create a new user with existent email", () => {
    const user: ICreateUserDTO = {
      email: "test@test.com",
      name: "Teste da Silva",
      password: "test",
    };

    expect(async () => {
      await createUserUseCase.execute(user);
      await createUserUseCase.execute(user);
    }).rejects.toBeInstanceOf(CreateUserError);
  });
});
