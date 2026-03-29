import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
export const verifyJWT = asyncHandler(async(req,res,next) => {
  try {
    //get token from cookie or header(custom token in case of mobile application)
    const token=req.cookies?.accessToken  || 
    req.header("Authorization")?.replace("Bearer ", "");

    //check token
    if(!token){
      throw new ApiError(401,"Unauthorized request") ;
    }

    //verify token
    const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded?._id).select("-password -refreshToken")

    if(!user){
      throw new ApiError(401,"Invalid access Token")
    }
    //attach to request
    //req.user is a custom prop added to req object to store authenticated user data
    req.user=user;

    next()

  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid access Token") 
  }  
})
