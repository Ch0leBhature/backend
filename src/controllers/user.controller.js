import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
//refresh access tokens generated
const  generateAccessAndRefreshTokens = async (userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    //turned off validation as it will check if all the fields are valid like password which are not necessary here only generating tokens
    await user.save({validateBeforeSave: false})
    return {accessToken,refreshToken};

  } catch (error) {
    throw new ApiError(500,"Something Went Wrong While Generating access or refresh token")
  }
  }

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
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
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

const loginUser = asyncHandler(async(req,res)=>{
  //take in various fields from the data from req.body
  console.log(req.body)
  const {username,email,password}=req.body
  //check for username or email
  if(!username && !email){
    throw new ApiError(400,"username or email fields are required")
  }
  //find the user
  const userfound = await User.findOne({
    $or: [{username},{email}]
  })

  if(!userfound){
    throw new ApiError(404,"user does not exists");
  }
  //password check

  const passwordValid=await userfound.isPasswordCorrect(password);

  if(!passwordValid){
    throw new ApiError(404,"Invalid credentials")
  }

  //access and refresh token generate
  
  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(userfound._id)
  
  const loggedInUser = await User.findById(userfound._id).select("-password -refreshToken")
  
  

  //send cookies

  const options={
    httpOnly:true,
    
  }
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "user logged in Successfully"
      )
  )

})

const logoutUser = asyncHandler(async (req,res) =>{
  //find req.user , and update it
  
  //remove access and refreshtokens
  
  await User.findByIdAndUpdate(
    req.user._id,
    {//update via set 
      $set:{
        refreshToken:undefined
      }
    },
    {
      new: true
    }
  )
  
  const options={
    httpOnly:true,
    secure:true
  }

  //clear cookies

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,"usr logged out"))


})

const refreshAccessToken= asyncHandler(async(req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  
  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")

  }

  const decodedObject = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  //user will have complete user data username fullname pass avatar etc 
  const user = await User.findById(decodedObject?._id)

  if(!user){
    throw new ApiError(401,"Invalid refresh Token")
  }

  if(incomingRefreshToken != user?.refreshToken){
    throw new ApiError(401,"refresh token is expired or used")
  }

  const options = {
    httpOnly:true,
    // secure:true
  }

  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken},
        "access token is refreshed"
      )
    )

})

// const test = asyncHandler(async (req,res) => ) 

export {registerUser, loginUser,logoutUser,refreshAccessToken}
