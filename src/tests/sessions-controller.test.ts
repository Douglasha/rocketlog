import request from "supertest"
import { prisma } from "@/database/prisma"
import { app } from "@/app"

describe("SessionsController", () => {
  let user_id: string

  it("should authenticate a and get acces token", async () => {
      const userResponse = await request(app).post("/users").send({
        name: "Test User2",
        email: "testuser2@example.com",
        password: "password123",
      })

      user_id = userResponse.body.id

      const sessionResponse = await request(app).post("/sessions").send({
        email: "testuser2@example.com",
        password: "password123",
      })

      expect(sessionResponse.status).toBe(200)
      expect(sessionResponse.body.token).toEqual(expect.any(String))


  })
})