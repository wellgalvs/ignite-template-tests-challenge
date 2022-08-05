import { hash } from "bcryptjs";
import { AppError } from "../../../../shared/errors/AppError";

import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let createUser: ICreateUserDTO;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe("Create Statement", () => {
  beforeAll(async () => {
    createUser = {
      name: "User Test",
      email: "user@example.com",
      password: await hash("123", 8)
    };
  });

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
  });

  it("Should be able to create a new deposit statement", async () => {
    await inMemoryUsersRepository.create(createUser);

    const user = await inMemoryUsersRepository.findByEmail(createUser.email);

    let userId = user?.id;

    if (!userId) userId = "id-is-invalid";

    const statement = await createStatementUseCase.execute({
      user_id: userId,
      type: "deposit" as OperationType,
      amount: 100,
      description: "Deposit Test"
    });

    expect(statement).toHaveProperty("id");
    expect(statement.user_id).toEqual(userId);
  });

  it("Should be able to create a new withdraw statement", async () => {
    await inMemoryUsersRepository.create(createUser);

    const user = await inMemoryUsersRepository.findByEmail(createUser.email);

    let userId = user?.id;

    if (!userId) userId = "id-is-invalid";

    await createStatementUseCase.execute({
      user_id: userId,
      type: "deposit" as OperationType,
      amount: 100,
      description: "Deposit Test"
    });

    const statement = await createStatementUseCase.execute({
      user_id: userId,
      type: "withdraw" as OperationType,
      amount: 100,
      description: "Withdraw Test"
    });

    expect(statement).toHaveProperty("id");
    expect(statement.user_id).toBe(userId);
  });

  it("Should not be able to create a new statement with a non-existent user",
    async () => {
      expect(async () => {
        await createStatementUseCase.execute({
          user_id: "id-is-invalid",
          type: "deposit" as OperationType,
          amount: 100,
          description: "Deposit Test"
        });
      }).rejects.toBeInstanceOf(AppError);
    });

  it("Should not be able to create a new withdraw if the balance is less than the withdraw", async () => {
    expect(async () => {
      await inMemoryUsersRepository.create(createUser);

      const user = await inMemoryUsersRepository.findByEmail(createUser.email);

      let userId = user?.id;

      if (!userId) userId = "id-is-invalid";

      const withdraw = await createStatementUseCase.execute({
        user_id: userId,
        type: "withdraw" as OperationType,
        amount: 100,
        description: "Withdraw Test"
      });
    }).rejects.toBeInstanceOf(AppError);
  });
});
