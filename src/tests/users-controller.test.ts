import request from "supertest"
import { prisma } from "@/database/prisma"
import { app } from "@/app"



describe("UsersController", () => {
  let user_id: string

  afterAll(async () => {
    await prisma.user.delete({ where: { id: user_id}})
  })
  it("should create a new user successfully", async () => {
    const response = await request(app).post("/users").send({
      name: "Test User2",
      email: "testuser2@example.com",
      password: "password123",
    })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("id")
    expect(response.body.name).toBe("Test User2")

    user_id = response.body.id
  })

  it("should throw an error if user with same email already exists", async () => {
    const response = await request(app).post("/users").send({
      name: "Duplicate User",
      email: "testuser2@example.com",
      password: "password123",
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe("This email is already in use.")
  })
})