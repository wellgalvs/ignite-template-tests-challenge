import { Connection, createConnection, Repository } from "typeorm";
import request from "supertest";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

import authConfig from "../../../../config/auth";

import { app } from "../../../../app";
import { User } from "../../entities/User";

let connection: Connection;
let usersRepository: Repository<User>;
let user: User;
let token: string;

describe("Show User Profile Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    usersRepository = connection.getRepository<User>(User);

    user = usersRepository.create({
      name: "Name Test",
      email: "test@email.com",
      password: await hash("123", 8)
    });

    user = await usersRepository.save(user);

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

  it("Should be able to show the authenticated user profile", async () => {
    const response = await request(app)
      .get("/api/v1/profile")
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.email).toEqual(user.email);
  });

  it("Should not be able to show the profile if user is not exists", async () => {
    const { secret, expiresIn } = authConfig.jwt;

    token = sign({ name: "invalid_user" }, secret, {
      subject: "invalid-id",
      expiresIn
    });

    const response = await request(app)
      .get("/api/v1/profile")
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(500);
  });
});
