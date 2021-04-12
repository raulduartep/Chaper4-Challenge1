import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuid } from "uuid";
import { app } from "../../../../app";
import authConfig from "../../../../config/auth";
import { User } from "../../../users/entities/User";
import { UsersRepository } from "../../../users/repositories/UsersRepository";
import { StatementsRepository } from "../../repositories/StatementsRepository";

let connection: Connection;
let senderUser: User;
let receiverUser: User;
let token: string;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Create Transfer", () => {
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

  it("Should be able to create a new transfer", async () => {
    const statementRepository = new StatementsRepository();

    await statementRepository.create({
      amount: 500,
      description: "test",
      type: OperationType.DEPOSIT,
      user_id: senderUser.id || "",
    });

    const transfer = {
      amount: 100,
      description: "test",
    };

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${receiverUser.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send({
        amount: transfer.amount,
        description: transfer.description,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      amount: transfer.amount,
      description: transfer.description,
      type: "transfer_sent",
      user_id: senderUser.id,
      received_id: receiverUser.id,
    });
  });

  it("Should not be able to create a new transfer if receiver user is equal to sender user", async () => {
    const response = await request(app)
      .post(`/api/v1/statements/transfers/${senderUser.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send({
        amount: 1000,
        description: "test",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Sender user equals to receiver user",
    });
  });

  it("Should not be able to create a new transfer if receiver user not exists", async () => {
    const fakeId = uuid();

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${fakeId}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send({
        amount: 1000,
        description: "test",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Receiver user not found",
    });
  });

  it("Should not be able to create a new transfer if sender user not exists", async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const fakeId = uuid();
    const fakeToken = sign({}, secret, {
      expiresIn,
      subject: fakeId,
    });

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${receiverUser.id}`)
      .set({
        Authorization: `Bearer ${fakeToken}`,
      })
      .send({
        amount: 1000,
        description: "test",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Sender user not found",
    });
  });

  it("Should not be able to create a new transfer if sender user has insufficient funds", async () => {
    const response = await request(app)
      .post(`/api/v1/statements/transfers/${receiverUser.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send({
        amount: 900,
        description: "test",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Sender user has insufficient funds",
    });
  });
});
