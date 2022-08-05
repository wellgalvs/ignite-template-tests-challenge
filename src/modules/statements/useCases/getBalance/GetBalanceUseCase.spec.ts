import { hash } from "bcryptjs";
import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let getBalanceUseCase: GetBalanceUseCase;
let createUser: ICreateUserDTO;

describe("Get Balance", () => {
  beforeAll(async () => {
    createUser = {
      name: "User Test",
      email: "user@example.com",
      password: await hash("123", 8)
    };
  });

  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    getBalanceUseCase = new GetBalanceUseCase(
      inMemoryStatementsRepository,
      inMemoryUsersRepository
    );
  });

  it("Should be able to show the user's balance", async () => {
    await inMemoryUsersRepository.create(createUser);

    const user = await inMemoryUsersRepository.findByEmail(createUser.email);

    let userId = user?.id;

    if (!userId) userId = "id-is-invalid"

    const getBalance = await getBalanceUseCase.execute({
      user_id: userId
    });

    expect(getBalance).toHaveProperty("statement");
    expect(getBalance).toHaveProperty("balance");
    expect(getBalance.balance).toBe(0);
  });

  it("Should not be able to show the user's balance if the user is not found",
    async () => {
      expect(async () => {
        await getBalanceUseCase.execute({
          user_id: "id-is-invalid"
        });
      }).rejects.toBeInstanceOf(AppError);
    });
});
