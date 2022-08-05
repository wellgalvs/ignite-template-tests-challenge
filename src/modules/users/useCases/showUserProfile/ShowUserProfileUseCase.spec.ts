import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let showUserProfileUseCase: ShowUserProfileUseCase;
let createUser: ICreateUserDTO;

describe("Show User Profile", () => {
  beforeAll(async () => {
    createUser = {
      name: "User Test",
      email: "user@example.com",
      password: "123"
    };
  });

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    showUserProfileUseCase = new ShowUserProfileUseCase(
      inMemoryUsersRepository
    );
  });

  it("Should be able to show an existent user", async () => {
    await inMemoryUsersRepository.create(createUser);

    const user = await inMemoryUsersRepository.findByEmail(createUser.email);

    let userId = user?.id;

    if (!userId) userId = "id-is-invalid";

    const response = await showUserProfileUseCase.execute(userId);

    expect(response).toHaveProperty("id");
    expect(response.email).toEqual(createUser.email);
  });

  it("Should not be able to show an inexistent user", async () => {
    expect(async () => {
      await showUserProfileUseCase.execute("id-is-invalid");
    }).rejects.toBeInstanceOf(AppError);
  });
});
