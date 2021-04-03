import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { verify } from "jsonwebtoken";
import { hash } from "bcryptjs";

import authConfig from "../../../../config/auth";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let authenticateUserUseCase: AuthenticateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe("Authenticate User", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(
      inMemoryUsersRepository
    );
  });

  it("Should be able to authenticate a existing user and return a valid jwt token", async () => {
    const user: ICreateUserDTO = {
      email: "test@test.com",
      name: "Teste da Silva",
      password: "test",
    };

    const passwordHash = await hash(user.password, 8);

    await inMemoryUsersRepository.create({
      ...user,
      password: passwordHash,
    });

    const authenticateResponse = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    expect(authenticateResponse).toHaveProperty("token");

    expect(() => {
      verify(authenticateResponse.token, authConfig.jwt.secret);
    }).not.toThrow();
  });

  it("Should not be able to authenticate a user with nonexistentuser", async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: "test@test.com.br",
        password: "rara",
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

  it("Should not be able to authenticate a user with wrong password", async () => {
    const passwordHash = await hash("test", 8);

    await inMemoryUsersRepository.create({
      email: "test@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    expect(async () => {
      await authenticateUserUseCase.execute({
        email: "test@test.com",
        password: "wrong password",
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });
});
