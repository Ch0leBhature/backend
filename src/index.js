import dotenv from "dotenv"

import express from "express";
import connectDB from "./db/index.js";
const app = express()

dotenv.config({
  path:'./env'
})

connectDB()
.then(()=>{
      const server = app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running at port: ${process.env.PORT}`);
      })
      
      server.on("error",(error)=>{
        console.log("SERVER ERR: ",error);
        process.exit(1)
      })


  })
.catch((err)=>{
    console.log("MONGO DB CONNECTION ERROR!!!",err);
  })

//can be done like this but better to keep it in db folder
// //iifi
// ;(async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",()=>{
//             console.log("ERR: ",error);
//             throw error
//     })
//
//     app.listen(process.env.PORT,()=>{
//         console.log(`App is listening on ${process.env.PORT}`);
//     })
//
//     }catch(error){
//         console.log("ERROR: ",error);
//         throw err
//     }
// })()
