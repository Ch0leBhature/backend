import { Router } from "express";
import {registerUser} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
const router = Router();

router.route("/register").post(
  upload.fields(
  [  //this meas except 2 fields from frontend each
    {
      name:"avatar",
      maxCount:1
    },
    {
      name:"coverImage",
      maxCount:1
    }
  ]

),registerUser)

export default router
