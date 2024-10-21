import { GetDeleteMessageCommand, GetTaskCommand, queeRecivedCommand } from "./commands/command.js";
import { EcsClient, getProducer, SqsClient } from "./config/index.js";

async function sendToWorkers(key,Bucket_Name,Key){
    const producer = getProducer()
    await producer.connect();
    await producer.send({
        topic:"GET_OBJECT_FROM_SQS",
        messages:[
        {key:key,value:JSON.stringify({Bucket_Name,Key})}
        ]
    })
}

async function init(){
    while(true){
        const {Messages} =await SqsClient.send(queeRecivedCommand);
        if(!Messages){
            console.log("no messages")
            continue;
        }
        try {
            for(const message of Messages){
                const {Body} = message;    
                if(!Body) continue;
    
                const event = JSON.parse(Body);
                if("Service" in event && "Event" in event){
                    if(event.Event === "s3:TestEvent") continue;
                }
                
                for(const record of event.Records){
                    const {s3:{ bucket, object }} = record;
                    console.log({ bucket:bucket.name, key:object.key })
                   
                    console.log("send to workers")
                    // sendToWorkers("bucketData",bucket.name,object.key)

                    const taskCommand = GetTaskCommand(bucket.name,object.key)
                    const deleteQueeMessageCommand= GetDeleteMessageCommand(message.ReceiptHandle)

                    // run task for building 
                    console.log("task runnig..")
                    await EcsClient.send(taskCommand)

                    // delete the message which is used in this process
                    console.log("deleting... last message from queue")
                    await SqsClient.send(deleteQueeMessageCommand)
                }
            }
        } catch (error) {
            console.log(error)
        }
    }
}

init()
