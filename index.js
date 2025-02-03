
import dotenv from "dotenv";
dotenv.config();  
import express from "express";
import databaseConnection from "./config/database.js";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoute.js";
import tweetRoute from "./routes/tweetRoute.js";
import cors from "cors";

dotenv.config({
    path:".env"
})

databaseConnection();
const app = express(); 
app.use(cookieParser());

// middlewares
app.use(express.urlencoded({
    extended:true
}));

app.use(express.json());

const corsOptions = {
    origin:"http://localhost:3000",
    credentials:true
}

app.use(cors(corsOptions));

// api
app.use("/api/v1/user",userRoute);
app.use("/api/v1/tweet", tweetRoute);
 

app.listen(process.env.PORT,() => {
    console.log(`Server listen at port ${process.env.PORT}`);
})