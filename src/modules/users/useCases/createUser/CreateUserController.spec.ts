import { Connection } from "typeorm";
import request from "supertest";

import createConnection from "../../../../database";
import { app } from "../../../../app";

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

  it("Should be able to create a new user", async () => {
    const response = await request(app).post("/api/v1/users").send({
      email: "test@test.com.br",
      name: "Test",
      password: "test",
    });

    expect(response.status).toBe(201);
  });

  it("Should not be able to create a new user with existent email", async () => {
    const response = await request(app).post("/api/v1/users").send({
      email: "test@test.com.br",
      name: "Another Test",
      password: "anothertest",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "User already exists",
    });
  });
});
