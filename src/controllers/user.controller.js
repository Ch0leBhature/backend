import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req,res) =>{

  //input user details - frontend

  const {fullname,username,email,password}= req.body;
  // console.log("email :",email)

  //validate
  if(
    [fullname,username,email,password].some((field) => 
      field?.trim()===""
    )
  ){
    throw new ApiError(400,"All fields are required")
  }
  
  //check if user already exists
  const userExists = await User.findOne({
    $or: [{username}, {email}]
  })
  
  if(userExists){
    throw new ApiError(409,"User's username or email already registerd")
  }
 


  //check images or videos
  const avatarLocalPath = req.files?.avatar?.[0]?.path
  console.log(req.files)
  

  const coverImageLocalPath = req.files?.coverImage?.[0]?.path
  console.log("avatarLocalPath:", avatarLocalPath);


  //upload cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const cover = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

  if(!avatar){
    throw new ApiError(400,"upload the avatar image")
  } 
 

  //create db entry
  const user=await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: cover?.url || "",
    username: username.toLowerCase(),
    email,
    password
  })

  //remove password and refresh tokens from response
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  
  //check user creation
  if(!userCreated){
    throw new ApiError(500, "Something went wrong while creating the user")
  }
  
  //return response
  return res.status(201).json(
    new ApiResponse(200, userCreated, "User Created Successfully")
  )

  
})

// const test = asyncHandler(async (req,res) => ) 

export {registerUser}
