import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { authSchema } from "../types/auth-schema.js";
import { createToken } from "../utils/auth.js";
import { sendValidationError } from "../utils/validation.js";
import jwt from "jsonwebtoken";
let SECRET = "change-me";

export async function signup(req: Request, res: Response): Promise<void> {
  const parsedBody = authSchema.safeParse(req.body);
  if (!parsedBody.success) {
    sendValidationError(res, parsedBody.error);
    return;
  }

  const { username, password } = parsedBody.data;
  // const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        password: password,
      },
    });

    res.status(201).json({
      token: createToken({ userId: user.id }),
      userId: user.id,
      username: user.username,
    });
  } catch(e) {
    res.status(409).json({ msg : e });
  }
}

export async function signin(req: Request, res: Response): Promise<void> {
  //TODO: Implement signin logic
  const parsedBody = authSchema.safeParse(req.body);
  if (!parsedBody.success) {
    sendValidationError(res, parsedBody.error);
    return;
  }
  let userexists = await prisma.user.findFirst({
    where : {
      username : parsedBody.data.username,
      password : parsedBody.data.password
    }
  })

  if (!userexists){
    res.status(400).json({
      msg : "user_does_not_exists" 
    })
    return ;
  }
  let token = createToken({"userId" : userexists.id});
  res.status(201).json({
      success : true ,
      token : token 
  })
}

