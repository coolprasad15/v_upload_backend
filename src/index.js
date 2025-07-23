import dotenv from 'dotenv';
import connectDB from "./db/index.js";

import express from "express";
const app = express();

dotenv.config({ path: './env' })

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port : ${process.env.PORT}`);
        
    });
    app.on("error", (err) =>{
        console.log("Error: ", err);
        throw err;
    });
})
.catch((err) => {
    console.log("MongoDB Connection Failed !!! ", err);
    
});

