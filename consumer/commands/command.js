import { RunTaskCommand } from "@aws-sdk/client-ecs";
import { ReceiveMessageCommand,DeleteMessageCommand } from "@aws-sdk/client-sqs";
import "dotenv/config"

export const queeRecivedCommand= new ReceiveMessageCommand({
    QueueUrl:process.env.QUEUE_URL,
    MaxNumberOfMessages:1,
    WaitTimeSeconds:15
})

export function GetDeleteMessageCommand(ReceiptHandle){
    return new DeleteMessageCommand({
        QueueUrl:process.env.QUEUE_URL,
        ReceiptHandle:ReceiptHandle
   })
}


export function GetTaskCommand(BUCKET_NAME,KEY){
     return new RunTaskCommand({
        cluster:process.env.CLUSTER_ARN,
        taskDefinition:process.env.TASK_ARN,
        launchType:"FARGATE",
        count:1,
        networkConfiguration:{
            awsvpcConfiguration:{
                assignPublicIp:"ENABLED",
                subnets:[ process.env.SUBNET_1, process.env.SUBNET_2, process.env.SUBNET_3],
                securityGroups:[process.env.SECURITY_GRP]
            }
        },
        overrides:{
            containerOverrides:[
                {
                    name:"builder-image",
                    environment:[
                        {name:"BUCKET_NAME",value:BUCKET_NAME.toString()},
                        {name:"KEY",value:KEY.toString()},
                        {name:"ACCESS_KEY",value:process.env.ACCESS_KEY.toString()},
                        {name:"SECRET_ACCESS_KEY",value:process.env.SECRET_ACCESS_KEY.toString()},
                    ]
                }
            ]
        }
    })
}