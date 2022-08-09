import { Connection, createConnection } from "typeorm";
import request from "supertest";
import { compare } from "bcryptjs";

import { app } from "../../../../app";
import { ICreateUserDTO } from "./ICreateUserDTO";
import { User } from "../../entities/User";

let connection: Connection;
let createUser: ICreateUserDTO;

describe("Create User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    createUser = {
      name: "User Test",
      email: "user@test.com",
      password: "123"
    };
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to create a new user", async () => {
    const response = await request(app)
      .post("/api/v1/users")
      .send(createUser);

    const user = await connection.createQueryBuilder<User>(User, 'users')
      .where('users.email = :email', { email: createUser.email })
      .getOne();

    let userPassword = (user?.password) ? user.password : "invalid-password";

    expect(response.status).toBe(201);
    expect(user).toHaveProperty("id");
    expect(user).toBeInstanceOf(User);
    expect(await compare('123', userPassword)).toBe(true);
  });

  it("Should not be able to create a new user if email already exists", async () => {
    const response = await request(app)
      .post("/api/v1/users")
      .send(createUser);

    expect(response.status).toBe(400);
  });
});
