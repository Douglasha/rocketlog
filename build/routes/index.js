"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/index.ts
var routes_exports = {};
__export(routes_exports, {
  routes: () => routes
});
module.exports = __toCommonJS(routes_exports);
var import_express5 = require("express");

// src/routes/users-routes.ts
var import_express = require("express");

// src/database/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: process.env.NODE_ENV === "production" ? [] : ["query"]
});

// src/utils/AppError.ts
var AppError = class {
  message;
  statusCode;
  constructor(message, statusCode = 400) {
    this.message = message;
    this.statusCode = statusCode;
  }
};

// src/controllers/users-controller.ts
var import_bcrypt = require("bcrypt");
var import_zod = require("zod");
var UsersController = class {
  async create(request, response) {
    const bodySchema = import_zod.z.object({
      name: import_zod.z.string().trim().min(3),
      email: import_zod.z.string().email(),
      password: import_zod.z.string().min(6)
    });
    const { name, email, password } = bodySchema.parse(request.body);
    const userWithSameEmail = await prisma.user.findFirst({
      where: { email }
    });
    if (userWithSameEmail) {
      throw new AppError("This email is already in use.");
    }
    const hashedPassword = await (0, import_bcrypt.hash)(password, 8);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });
    const { password: _, ...userWithoutPassword } = user;
    return response.status(201).json(userWithoutPassword);
  }
};

// src/routes/users-routes.ts
var usersRoutes = (0, import_express.Router)();
var usersController = new UsersController();
usersRoutes.post("/", usersController.create);

// src/routes/sessions-routes.ts
var import_express2 = require("express");

// src/env.ts
var import_zod2 = require("zod");
var envSchema = import_zod2.z.object({
  DATABASE_URL: import_zod2.z.string().url(),
  JWT_SECRET: import_zod2.z.string(),
  PORT: import_zod2.z.coerce.number().default(3333)
});
var env = envSchema.parse(process.env);

// src/configs/auth.ts
var authConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: "1d"
  }
};

// src/controllers/sessions-controller.ts
var import_jsonwebtoken = require("jsonwebtoken");
var import_bcrypt2 = require("bcrypt");
var import_zod3 = require("zod");
var SessionsController = class {
  async create(request, response) {
    const bodySchema = import_zod3.z.object({
      email: import_zod3.z.string().email(),
      password: import_zod3.z.string().min(6)
    });
    const { email, password } = bodySchema.parse(request.body);
    const user = await prisma.user.findFirst({
      where: { email }
    });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }
    const passwordMatch = await (0, import_bcrypt2.compare)(password, user.password);
    if (!passwordMatch) {
      throw new AppError("Invalid email or password", 401);
    }
    const { secret, expiresIn } = authConfig.jwt;
    const token = (0, import_jsonwebtoken.sign)({ role: user.role ?? "customer" }, secret, {
      subject: user.id,
      expiresIn
    });
    const { password: hashedPassword, ...userWithoutPassword } = user;
    return response.json({ token, user: userWithoutPassword });
  }
};

// src/routes/sessions-routes.ts
var sessionsRoutes = (0, import_express2.Router)();
var sessionsController = new SessionsController();
sessionsRoutes.post("/", sessionsController.create);

// src/routes/deliveries-routes.ts
var import_express3 = require("express");

// src/controllers/deliveries-controller.ts
var import_zod4 = require("zod");
var DeliveriesController = class {
  async create(request, response) {
    const bodySchema = import_zod4.z.object({
      user_id: import_zod4.z.string(),
      description: import_zod4.z.string()
    });
    const { user_id, description } = bodySchema.parse(request.body);
    await prisma.delivery.create({
      data: {
        userId: user_id,
        description
      }
    });
    return response.status(201).json();
  }
  async index(request, response) {
    const deliveries = await prisma.delivery.findMany({
      include: {
        user: { select: { name: true, email: true } }
      }
    });
    return response.json(deliveries);
  }
};

// src/controllers/deliveries-status-controller.ts
var import_zod5 = require("zod");
var DeliveriesStatusController = class {
  async update(request, response) {
    const paramsSchema = import_zod5.z.object({
      id: import_zod5.z.string().uuid()
    });
    const bodySchema = import_zod5.z.object({
      status: import_zod5.z.enum(["processing", "shipped", "delivered"])
    });
    const { id } = paramsSchema.parse(request.params);
    const { status } = bodySchema.parse(request.body);
    await prisma.delivery.update({
      data: {
        status
      },
      where: {
        id
      }
    });
    await prisma.deliveryLog.create({
      data: {
        deliveryId: id,
        description: `Status changed to ${status}`
      }
    });
    return response.json();
  }
};

// src/middlewares/ensure-authenticated.ts
var import_jsonwebtoken2 = require("jsonwebtoken");
function ensureAuthenticated(request, response, next) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new AppError("JWT token is missing", 401);
    }
    const [, token] = authHeader.split(" ");
    const { role, sub: user_id } = (0, import_jsonwebtoken2.verify)(token, authConfig.jwt.secret);
    request.user = {
      id: user_id,
      role
    };
    return next();
  } catch {
    throw new AppError("Invalid JWT token", 401);
  }
}

// src/middlewares/verifyUserAuthorization.ts
function verifyUserAuthorization(role) {
  return (request, response, next) => {
    if (!request.user) {
      throw new AppError("User not authenticated", 401);
    }
    if (!role.includes(request.user.role)) {
      throw new AppError("User not authorized", 403);
    }
    return next();
  };
}

// src/routes/deliveries-routes.ts
var deliveriesRoutes = (0, import_express3.Router)();
var deliveriesController = new DeliveriesController();
var deliveriesStatusController = new DeliveriesStatusController();
deliveriesRoutes.use(ensureAuthenticated, verifyUserAuthorization(["sale"]));
deliveriesRoutes.post("/", deliveriesController.create);
deliveriesRoutes.get("/", deliveriesController.index);
deliveriesRoutes.patch(
  "/:id/status",
  deliveriesStatusController.update
);

// src/routes/delivery-logs-routes.ts
var import_express4 = require("express");

// src/controllers/delivery-logs-controller.ts
var import_zod6 = require("zod");
var DeliveryLogsController = class {
  async create(request, response) {
    const bodySchema = import_zod6.z.object({
      delivery_id: import_zod6.z.string().uuid(),
      description: import_zod6.z.string().min(1)
    });
    const { delivery_id, description } = bodySchema.parse(request.body);
    const delivery = await prisma.delivery.findUnique({
      where: { id: delivery_id }
    });
    if (!delivery) {
      throw new AppError("Delivery not found", 404);
    }
    if (delivery.status === "delivered") {
      throw new AppError("This order has already been delivered");
    }
    if (delivery.status === "processing") {
      throw new AppError("Change status to shipped", 400);
    }
    await prisma.deliveryLog.create({
      data: {
        deliveryId: delivery_id,
        description
      }
    });
    return response.status(201).json();
  }
  async show(request, response) {
    const paramsSchema = import_zod6.z.object({
      delivery_id: import_zod6.z.string().uuid()
    });
    const { delivery_id } = paramsSchema.parse(request.params);
    const delivery = await prisma.delivery.findUnique({
      where: { id: delivery_id },
      include: {
        user: true,
        logs: true
      }
    });
    if (request.user?.role === "customer" && request.user.id !== delivery?.userId) {
      throw new AppError("the user can only view their deliveries", 401);
    }
    return response.json(delivery);
  }
};

// src/routes/delivery-logs-routes.ts
var deliveryLogsRoutes = (0, import_express4.Router)();
var deliveryLogsController = new DeliveryLogsController();
deliveryLogsRoutes.post(
  "/",
  ensureAuthenticated,
  verifyUserAuthorization(["sale"]),
  deliveryLogsController.create
);
deliveryLogsRoutes.get(
  "/:delivery_id",
  ensureAuthenticated,
  verifyUserAuthorization(["sale", "customer"]),
  deliveryLogsController.show
);

// src/routes/index.ts
var routes = (0, import_express5.Router)();
routes.use("/users", usersRoutes);
routes.use("/sessions", sessionsRoutes);
routes.use("/deliveries", deliveriesRoutes);
routes.use("/delivery-logs", deliveryLogsRoutes);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  routes
});
