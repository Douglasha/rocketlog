import { Request, Response } from 'express'
import { AppError } from '@/utils/AppError'
import { prisma } from '@/database/prisma'
import { z } from 'zod'

class DeliveryLogsController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      delivery_id: z.string().uuid(),
      description: z.string().min(1)
    })

    const { delivery_id, description } = bodySchema.parse(request.body)

    const delivery = await prisma.delivery.findUnique({
      where: { id: delivery_id }
    })

    if (!delivery) {
      throw new AppError("Delivery not found", 404)
    }

    if (delivery.status === "processing") {
      throw new AppError("Change status to shipped", 400)
    }

    await prisma.deliveryLog.create({
      data: {
        deliveryId: delivery_id,
        description
      }
    })


        return response.status(201).json()
  }

  async show(request: Request, response: Response) {
    const paramsSchema = z.object({
      delivery_id: z.string().uuid()
    })

    const { delivery_id } = paramsSchema.parse(request.params)

    const delivery = await prisma.delivery.findUnique({
      where: { id: delivery_id },
    })

    if (
      request.user?.role === "customer" &&
      request.user.id !== delivery?.userId
    ) {
      throw new AppError("the user can only view their deliveries", 401)
    }

    return response.json(delivery)
  }
}
export { DeliveryLogsController }