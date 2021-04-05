import { Connection } from "typeorm";
import request from "supertest";
import { v4 as uuidV4 } from "uuid";

import authConfig from "../../../../config/auth";
import createConnection from "../../../../database";
import { app } from "../../../../app";
import { UsersRepository } from "../../../users/repositories/UsersRepository";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

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

  it("Should be able to show user's profile", async () => {
    const usersRepository = new UsersRepository();

    const user = await usersRepository.create({
      email: "test@test.com.br",
      name: "Test",
      password: await hash("test", 8),
    });

    const { secret, expiresIn } = authConfig.jwt;

    const token = sign({ user }, secret, {
      subject: user.id,
      expiresIn,
    });

    const response = await request(app)
      .get("/api/v1/profile")
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send();

    expect(response.status).toBe(200);
    expect({
      ...response.body,
      created_at: new Date(response.body.created_at),
      updated_at: new Date(response.body.updated_at),
    }).toMatchObject({
      id: user.id,
      name: user.name,
      created_at: user.created_at,
      updated_at: user.updated_at,
      email: user.email,
    });
  });

  it("Should not be able to show the profile of a non-existent user", async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const fakeId = uuidV4();
    const fakeToken = sign({}, secret, {
      expiresIn,
      subject: fakeId,
    });

    const response = await request(app)
      .get("/api/v1/profile")
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
