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
import { CreateTransferUseCase } from "../createTransfer/CreateTransferUseCase";
import { container } from "tsyringe";

let connection: Connection;
let token: string;
let receiverUser: User;
let senderUser: User;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Get balance", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const usersRepository = new UsersRepository();

    receiverUser = await usersRepository.create({
      email: "test@test.com.br",
      name: "Test",
      password: await hash("test", 8),
    });

    senderUser = await usersRepository.create({
      email: "test2@test.com.br",
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

  it("Should be able to get a balance", async () => {
    const statementsRepository = new StatementsRepository();

    const statement1 = await statementsRepository.create({
      amount: 100,
      description: "Test 1",
      type: "deposit" as OperationType,
      user_id: senderUser.id || "",
    });

    const statement2 = await statementsRepository.create({
      amount: 200,
      description: "Test 2",
      type: "deposit" as OperationType,
      user_id: senderUser.id || "",
    });

    const statement3 = await statementsRepository.create({
      amount: 50,
      description: "Test 3",
      type: "withdraw" as OperationType,
      user_id: senderUser.id || "",
    });

    const createTransferUseCase = container.resolve(CreateTransferUseCase);

    const transfer = await createTransferUseCase.execute({
      amount: 100,
      description: "Test Transfer",
      receiver_id: receiverUser.id || "",
      sender_id: senderUser.id || "",
    });

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send();

    expect(response.status).toBe(200);
    expect(
      response.body.statement.map((res: any) => ({
        ...res,
        created_at: new Date(res.created_at),
        updated_at: new Date(res.updated_at),
        user_id: senderUser.id,
      }))
    ).toEqual(
      expect.arrayContaining([statement1, statement2, statement3, transfer])
    );
    expect(response.body.balance).toBe(
      statement1.amount +
        statement2.amount -
        statement3.amount -
        transfer.amount
    );
  });

  it("Should not be able to get a balance from a nonexistent user", async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const fakeId = uuidV4();
    const fakeToken = sign({}, secret, {
      expiresIn,
      subject: fakeId,
    });

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${fakeToken}`,
      })
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "User not found",
    });
  });
});
