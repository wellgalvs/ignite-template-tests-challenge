import { Connection, createConnection, Repository } from "typeorm";
import request from "supertest";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

import authConfig from "../../../../config/auth";
import { app } from "../../../../app";
import { User } from "../../../users/entities/User";

let connection: Connection;
let usersRepository: Repository<User>;
let user: User;
let userId: string;
let token: string;

describe("Create Statement Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    usersRepository = connection.getRepository<User>(User);

    user = usersRepository.create({
      name: "User Test",
      email: "test@test.com",
      password: await hash("123", 8)
    });

    user = await usersRepository.save(user);

    userId = (user?.id) ? user.id : "id-is-invalid";

    const { secret, expiresIn } = authConfig.jwt;

    token = sign({ user }, secret, {
      subject: user.id,
      expiresIn
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to create a new deposit statement", async () => {
    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100,
        description: "Deposit Test"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(201);
    expect(response.body.type).toEqual("deposit");
    expect(response.body).toHaveProperty("id");
    expect(response.body.amount).toBe(100);
  });

  it("Should be able to create a new withdraw statement", async () => {
    await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100,
        description: "Deposit Test"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 37,
        description: "Withdraw Test"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(201);
    expect(response.body.type).toEqual("withdraw");
    expect(response.body).toHaveProperty("id");
    expect(response.body.amount).toBe(37);
    expect(response.body.user_id).toBe(userId);
  });

  it('Should not be able to create a new withdraw if the balance is less than the withdraw', async () => {
    const response = await request(app)
      .post('/api/v1/statements/withdraw')
      .send({
        amount: 1000,
        description: 'Withdraw Sample',
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(400);
  });

  it("Should not be able to create a new statement with a non-existent user", async () => {
    await usersRepository.delete(userId);

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100,
        description: "Description Test"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(404);
  });
});
