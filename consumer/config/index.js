import { SQSClient } from "@aws-sdk/client-sqs";
import {ECSClient} from "@aws-sdk/client-ecs"
import { Kafka } from "kafkajs";
import fs from "fs"
import path from "path";
import "dotenv/config"

export const SqsClient= new SQSClient({
    region:"ap-south-1",
    credentials:{
        accessKeyId:process.env.ACCESS_KEY.toString(),
        secretAccessKey:process.env.SECRET_ACCESS_KEY.toString()
    }
})

export const EcsClient= new ECSClient({
    region:"us-east-1",
    credentials:{
        accessKeyId:process.env.ACCESS_KEY.toString(),
        secretAccessKey:process.env.SECRET_ACCESS_KEY.toString()
    }
})


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


let producer;
export function getProducer(){
    if(producer) return producer;
    const _producer = kafkaClient.producer();
    
    producer=_producer
    return producer
}