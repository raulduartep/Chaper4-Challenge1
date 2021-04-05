import { Connection } from "typeorm";
import request from "supertest";

import authConfig from "../../../../config/auth";
import createConnection from "../../../../database";
import { app } from "../../../../app";
import { UsersRepository } from "../../../users/repositories/UsersRepository";
import { hash } from "bcryptjs";
import { verify } from "jsonwebtoken";

let connection: Connection;

describe("Authenticate User", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to authenticate a existing user ans return a valid jwt token", async () => {
    const usersRepository = new UsersRepository();

    const user = await usersRepository.create({
      email: "test@test.com.br",
      name: "Test",
      password: await hash("test", 8),
    });

    const response = await request(app).post("/api/v1/sessions").send({
      email: "test@test.com.br",
      password: "test",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: expect.any(String),
    });

    expect(() => {
      verify(response.body.token, authConfig.jwt.secret);
    }).not.toThrowError();
  });

  it("Should not be able to authenticate a nonexistent user", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "nonexistent@user.com.br",
      password: "nonexistentuser",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      message: "Incorrect email or password",
    });
  });

  it("Should not be able to authenticate a user with wrong password", async () => {
    const usersRepository = new UsersRepository();

    await usersRepository.create({
      email: "test2@test.com.br",
      name: "Test",
      password: await hash("test", 8),
    });

    const response = await request(app).post("/api/v1/sessions").send({
      email: "test2@test.com.br",
      password: "wrong password",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      message: "Incorrect email or password",
    });
  });
});
