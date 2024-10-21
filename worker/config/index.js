import { Kafka } from "kafkajs";
import fs from "fs"
import path from "path";
import { S3Client } from "@aws-sdk/client-s3";
import "dotenv/config"

const ACCESS_KEY = process.env.ACCESS_KEY 
const SECRET_ACCESS_KEY= process.env.SECRET_ACCESS_KEY

export const S3client = new S3Client({
    region:"ap-south-1",
    credentials:{
        accessKeyId:ACCESS_KEY,
        secretAccessKey:SECRET_ACCESS_KEY
    }})

export const kafkaClient= new Kafka({
    brokers:[process.env.KAFKA_BROKER],
    clientId:process.env.KAKFKA_CLIENT,
    sasl:{
        username:process.env.KAFKA_USERNAME,
        password:process.env.KAFKA_PASSWORD,
        mechanism:"plain"
    },
    ssl:{
        ca:[fs.readFileSync(path.join(path.resolve(),"config","kafka.pem"),"utf-8")]
    }
})
