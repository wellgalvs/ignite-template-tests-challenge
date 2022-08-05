import { create } from "domain";

import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";

import { CreateUserUseCase } from "./CreateUserUseCase";
import { ICreateUserDTO } from "./ICreateUserDTO";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let createUser: ICreateUserDTO;

describe("Create User", () => {
  beforeAll(() => {
    createUser = {
      name: "User Test",
      email: "user@example.com",
      password: "123"
    };
  });

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  });

  it("Should be able to create a new user", async () => {
    const createdUser = await createUserUseCase.execute(createUser);

    expect(createdUser).toHaveProperty("id");
  });

  it("Should not be able to create an user if inserted email already exists", async () => {
    await createUserUseCase.execute(createUser);

    expect(async () => {
      await createUserUseCase.execute(createUser);
    }).rejects.toBeInstanceOf(AppError);
  });
});
