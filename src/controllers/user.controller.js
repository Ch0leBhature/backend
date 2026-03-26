import {asyncHandler} from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req,res) =>{
  console.log("HITTTTT!!!!")
  return res.status(200).json({
    message:"ok"
  })
})

// const test = asyncHandler(async (req,res) => ) 


export {registerUser}
