import { Connection } from "typeorm";
import { sign } from "jsonwebtoken";
import { v4 as uuidV4 } from "uuid";
import request from "supertest";

import authConfig from "../../../../config/auth";

import createConnection from "../../../../database";
import { app } from "../../../../app";
import { UsersRepository } from "../../../users/repositories/UsersRepository";
import { hash } from "bcryptjs";
import { User } from "../../../users/entities/User";

let connection: Connection;
let token: string;
let user: User;

describe("Create Statement", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const usersRepository = new UsersRepository();

    user = await usersRepository.create({
      email: "test@test.com.br",
      name: "Test",
      password: await hash("test", 8),
    });

    const { secret, expiresIn } = authConfig.jwt;

    token = sign({ user }, secret, {
      subject: user.id,
      expiresIn,
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to create a new statement as a deposit", async () => {
    const statementData = {
      description: "Test description to deposit",
      amount: 200,
    };

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .set({ Authorization: `Beares ${token}` })
      .send({
        amount: statementData.amount,
        description: statementData.description,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      user_id: user.id,
      description: statementData.description,
      amount: statementData.amount,
      type: "deposit",
    });
  });

  it("Should be able to create a new statement as a withdraw", async () => {
    const statementData = {
      description: "Test description to withdraw",
      amount: 100,
    };

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .set({ Authorization: `Beares ${token}` })
      .send({
        amount: statementData.amount,
        description: statementData.description,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      user_id: expect.any(String),
      description: statementData.description,
      amount: statementData.amount,
      type: "withdraw",
    });
  });

  it("Should not be able to create a new statement as a withdraw with insufficient found", async () => {
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .set({ Authorization: `Beares ${token}` })
      .send({
        amount: 5000,
        description: "Test description to withdraw",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Insufficient funds",
    });
  });

  it("Should not be able to create a new statement from a nonexistent user", async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const fakeId = uuidV4();
    const fakeToken = sign({}, secret, {
      expiresIn,
      subject: fakeId,
    });

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .set({
        Authorization: `Bearer ${fakeToken}`,
      })
      .send({
        amount: 100,
        description: "Test description",
      });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "User not found",
    });
  });
});
