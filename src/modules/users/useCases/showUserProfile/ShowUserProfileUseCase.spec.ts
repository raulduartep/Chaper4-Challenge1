import { hash } from "bcryptjs";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let showUserProfileUseCase: ShowUserProfileUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe("Show User Profile", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    showUserProfileUseCase = new ShowUserProfileUseCase(
      inMemoryUsersRepository
    );
  });

  it("Should be able to show user's profile", async () => {
    const passwordHash = await hash("test", 8);

    const user = await inMemoryUsersRepository.create({
      email: "test@test.com",
      name: "Teste da Silva",
      password: passwordHash,
    });

    const userProfile = await showUserProfileUseCase.execute(user.id || "");

    expect(userProfile).toEqual(user);
  });

  it("Should not be able to show the profile of a non-existent user", () => {
    expect(async () => {
      await showUserProfileUseCase.execute("nonexistent token");
    }).rejects.toBeInstanceOf(ShowUserProfileError);
  });
});
