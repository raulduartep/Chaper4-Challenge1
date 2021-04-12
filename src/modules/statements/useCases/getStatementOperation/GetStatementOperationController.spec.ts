import { Connection } from "typeorm";
import { sign } from "jsonwebtoken";
import { v4 as uuidV4 } from "uuid";
import request from "supertest";

import authConfig from "../../../../config/auth";

import createConnection from "../../../../database";
import { app } from "../../../../app";
import { UsersRepository } from "../../../users/repositories/UsersRepository";
import { User } from "../../../users/entities/User";
import { hash } from "bcryptjs";
import { StatementsRepository } from "../../repositories/StatementsRepository";
import { container } from "tsyringe";
import { CreateTransferUseCase } from "../createTransfer/CreateTransferUseCase";

let connection: Connection;
let token: string;
let senderUser: User;
let receiverUser: User;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Get Statement Operation", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const usersRepository = new UsersRepository();

    senderUser = await usersRepository.create({
      email: "test@test.com.br",
      name: "Test",
      password: await hash("test", 8),
    });

    receiverUser = await usersRepository.create({
      email: "test3@test.com.br",
      name: "Test",
      password: await hash("test", 8),
    });

    const { secret, expiresIn } = authConfig.jwt;

    token = sign({ senderUser }, secret, {
      subject: senderUser.id,
      expiresIn,
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to get a statement with type statement ", async () => {
    const statementsRepository = new StatementsRepository();

    const statement = await statementsRepository.create({
      amount: 100,
      description: "Test 1",
      type: "deposit" as OperationType,
      user_id: senderUser.id || "",
    });

    const response = await request(app)
      .get(`/api/v1/statements/${statement.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send();

    expect(response.status).toBe(200);
    expect({
      ...response.body,
      amount: Number(response.body.amount),
      created_at: new Date(response.body.created_at),
      updated_at: new Date(response.body.updated_at),
    }).toEqual(statement);
  });

  it("Should be able to get a statement with type transfer ", async () => {
    const createTransferUseCase = container.resolve(CreateTransferUseCase);

    const transfer = await createTransferUseCase.execute({
      amount: 100,
      description: "Test 1",
      receiver_id: receiverUser.id || "",
      sender_id: senderUser.id || "",
    });

    const response = await request(app)
      .get(`/api/v1/statements/${transfer.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send();

    expect(response.status).toBe(200);
    expect({
      ...response.body,
      amount: Number(response.body.amount),
      created_at: new Date(response.body.created_at),
      updated_at: new Date(response.body.updated_at),
    }).toEqual(transfer);
  });

  it("Should not be able to get a statement from a nonexistent user", async () => {
    const statementsRepository = new StatementsRepository();

    const statement = await statementsRepository.create({
      amount: 100,
      description: "Test 1",
      type: "deposit" as OperationType,
      user_id: senderUser.id || "",
    });

    const { secret, expiresIn } = authConfig.jwt;

    const fakeId = uuidV4();
    const fakeToken = sign({}, secret, {
      expiresIn,
      subject: fakeId,
    });

    const response = await request(app)
      .get(`/api/v1/statements/${statement.id}`)
      .set({
        Authorization: `Bearer ${fakeToken}`,
      })
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "User not found",
    });
  });

  it("Should not be able to get a nonexistent statement", async () => {
    const fakeId = uuidV4();

    const response = await request(app)
      .get(`/api/v1/statements/${fakeId}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "Statement not found",
    });
  });
});
