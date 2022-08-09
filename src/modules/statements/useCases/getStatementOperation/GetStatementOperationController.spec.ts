import { Connection, createConnection, Repository } from "typeorm";
import request from "supertest";
import { hash } from "bcryptjs";
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
let statementId: string;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw"
}

describe("Get Statement Operation Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    statementsRepository = connection.getRepository<Statement>(Statement);
    usersRepository = connection.getRepository<User>(User);

    user = usersRepository.create({
      name: "Name Test",
      email: "test@email.com",
      password: await hash("123", 8)
    });

    user = await usersRepository.save(user);

    userId = (user?.id) ? user.id : "user-id-invalid";

    const { secret, expiresIn } = authConfig.jwt;

    token = sign({ user }, secret, {
      subject: user.id,
      expiresIn
    });

    const statement = statementsRepository.create({
      user_id: user.id,
      amount: 100,
      description: "Deposit Test",
      type: "deposit" as OperationType
    });

    await statementsRepository.save(statement);

    statementId = (statement?.id) ? statement.id : "statement-id-invalid";
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to show the statement operation to the user", async () => {
    const response = await request(app)
      .get(`/api/v1/statements/${statementId}`)
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toEqual(statementId);
    expect(response.body).toHaveProperty("user_id");
  });

  it("Should not be able to show the statement operation if the user not exists",
    async () => {
      await usersRepository.delete(userId);

      const response = await request(app)
        .get(`/api/v1/statements/${statementId}`)
        .set({
          Authorization: `Bearer ${token}`
        });

      expect(response.status).toBe(404);
    });

  it("Should not be able to show the statement operation if the statement not exists",
    async () => {
      await statementsRepository.delete(statementId);

      const response = await request(app)
        .get(`/api/v1/statements/${statementId}`)
        .set({
          Authorization: `Bearer ${token}`
        });

      expect(response.status).toBe(404);
    });
});
