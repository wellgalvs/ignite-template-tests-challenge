import { Connection, createConnection, Repository } from "typeorm";
import { hash } from "bcryptjs";
import request from "supertest";
import { sign } from "jsonwebtoken";

import { app } from "../../../../app";
import authConfig from "../../../../config/auth";

import { User } from "../../../users/entities/User";
import { Statement } from "../../entities/Statement";

let connection: Connection;
let usersRepository: Repository<User>;
let statementsRepository: Repository<Statement>;
let user: User;
let userId: string;
let token: string;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw"
}

describe("Get Balance Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    statementsRepository = connection.getRepository<Statement>(Statement);
    usersRepository = connection.getRepository<User>(User);

    user = await usersRepository.create({
      name: "Name Test",
      email: "email@test.com",
      password: await hash("123", 8)
    });

    user = await usersRepository.save(user);

    userId = (user?.id) ? user.id : "id-is-invalid";

    const { secret, expiresIn } = await authConfig.jwt;

    token = sign({ user }, secret, {
      subject: user.id,
      expiresIn
    });

    const depositStatement = await statementsRepository.create({
      user_id: user.id,
      amount: 100,
      description: "Deposit Test",
      type: "deposit" as OperationType
    });

    await statementsRepository.save(depositStatement);

    const withdrawStatement = await statementsRepository.create({
      user_id: user.id,
      amount: 65,
      description: "Withdraw Test",
      type: "withdraw" as OperationType
    });

    await statementsRepository.save(withdrawStatement);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to get the user's balance", async () => {
    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(200);
    expect(response.body.balance).toEqual(35);
    expect(response.body).toHaveProperty("balance");
  });

  it("Should not be able to get the user's balance if the user is not found", async () => {
    await usersRepository.delete(userId);

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(404);
  });
});
