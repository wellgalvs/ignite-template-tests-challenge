import { hash } from 'bcryptjs';
import { verify } from 'jsonwebtoken';

import authConfig from '../../../../config/auth';

import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createUser: ICreateUserDTO;

describe('Authenticate User', () => {
  beforeAll(async () => {
    createUser = {
      name: 'Name Test',
      email: 'test@email.com',
      password: await hash('123', 8)
    }
  })

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
  })

  it('should be able to authenticate an user', async () => {
    await inMemoryUsersRepository.create(createUser);

    const response = await authenticateUserUseCase.execute({
      email: createUser.email,
      password: "123"
    });

    expect(response).toHaveProperty("token");
    expect(response.user.email).toEqual(createUser.email);
    expect(verify(response.token, authConfig.jwt.secret));
  });

  it("Should not be able to authenticate with a non existent user", async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: createUser.email,
        password: createUser.password
      });
    }).rejects.toBeInstanceOf(AppError);
  });

  it("Should not be able to authenticate with a wrong email", async () => {
    expect(async () => {
      await inMemoryUsersRepository.create(createUser);

      await authenticateUserUseCase.execute({
        email: "wrongEmail@email.com",
        password: "123"
      });
    }).rejects.toBeInstanceOf(AppError);
  });

  it("Should not be able to authenticate with a wrong password", async () => {
    expect(async () => {
      await inMemoryUsersRepository.create(createUser);

      await authenticateUserUseCase.execute({
        email: createUser.email,
        password: "1234"
      });
    }).rejects.toBeInstanceOf(AppError);
  });
});
