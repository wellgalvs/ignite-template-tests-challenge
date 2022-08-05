import { hash } from "bcryptjs";

import { AppError } from "../../../../shared/errors/AppError";

import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let getStatementOperationUseCase: GetStatementOperationUseCase;
let createUser: ICreateUserDTO;
let userId: string;
let statementId: string;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw"
};

describe("Get Statement Operation", () => {
  beforeAll(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();

    createUser = {
      name: "User Test",
      email: "user@example.com",
      password: await hash("123", 8)
    };

    await inMemoryUsersRepository.create(createUser);

    const user = await inMemoryUsersRepository.findByEmail(createUser.email);

    userId = (user?.id) ? user.id : "id-user-is-invalid";

    const { id } = await inMemoryStatementsRepository.create({
      user_id: userId,
      amount: 100,
      description: "Description Test",
      type: "deposit" as OperationType
    });

    statementId = (id) ? id : "id-statement-is-invalid"
  });

  beforeEach(() => {
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
  });

  it("Should be able to show the statement operation to the user", async () => {
    const statement = await getStatementOperationUseCase.execute({
      user_id: userId,
      statement_id: statementId
    });

    expect(statement).toHaveProperty("id");
    expect(statement).toHaveProperty("amount");
    expect(statement.amount).toBe(100);
  });

  it("Should not be able to show the statement operation if the user not exists",
    async () => {
      expect(async () => {
        await getStatementOperationUseCase.execute({
          user_id: "id-user-is-invalid",
          statement_id: "id-statement-is-invalid"
        });
      }).rejects.toBeInstanceOf(AppError);
    });

  it("Should not be able to show the statement operation if the statement not exists",
    async () => {
      expect(async () => {
        await getStatementOperationUseCase.execute({
          user_id: userId,
          statement_id: "id-statement-is-invalid"
        });
      }).rejects.toBeInstanceOf(AppError);
    });
});
