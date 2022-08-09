import { Connection, createConnection, Repository } from "typeorm";
import request from "supertest";
import { hash } from "bcryptjs";
import { verify } from "jsonwebtoken";

import { User } from "../../entities/User";
import { UsersRepository } from "../../repositories/UsersRepository";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import authConfig from "../../../../config/auth";
import { app } from "../../../../app";

let connection: Connection;
let usersRepository: Repository<User>;
let user: User;

describe("Authenticate User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    usersRepository = connection.getRepository<User>(User);

    user = usersRepository.create({
      name: "User Test",
      email: "user@test.com",
      password: await hash("123", 8)
    });

    user = await usersRepository.save(user);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to authenticate an user", async () => {
    const response = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: user.email,
        password: "123"
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user.email).toEqual(user.email);
    expect(verify(response.body.token, authConfig.jwt.secret));
  });

  it("Should not be able to authenticate with an inexistent user", async () => {
    const response = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: 'inexistentEmail@email.com',
        password: "invalid-password"
      });

    expect(response.status).toBe(401);
  });

  it("Should not be able to authenticate user with incorrectly password", async () => {
    const response = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: user.email,
        password: "invalid-password"
      });

    expect(response.status).toBe(401);
  });

  it("Should not be able to authenticate user with incorrectly email", async () => {
    const response = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "invalid-email@email.com",
        password: user.password
      });

    expect(response.status).toBe(401);
  });
});
