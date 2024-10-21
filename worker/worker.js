import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommandFunc } from "./commands/commands.js";
import { kafkaClient, S3client } from "./config/index.js"
import PDFKit from "pdfkit"
import fs2 from "fs/promises"
import fs, { rm } from "fs"
import path from "path";
import csv from "csvtojson"

async function initConsumers(){
    const consumer = kafkaClient.consumer({groupId:"GET_OBJECT_PROCESS_WORKER"});
    await consumer.connect()
    await consumer.subscribe({topic:"GET_OBJECT_FROM_SQS"})

    await consumer.run({
        eachMessage:async({  message, pause })=>{
        try {
        const messsageObj=JSON.parse(message.value.toString());

        const GetObjectCommand = GetObjectCommandFunc(messsageObj.Bucket_Name,messsageObj.Key);
        const {Body} = await S3client.send(GetObjectCommand)
        const ext = messsageObj.Key.split(".").pop();
        const dataStoresPath = `raw.${ext}`;
        
        await fs2.writeFile(dataStoresPath,Body);
        const rawVideoPath= path.resolve(dataStoresPath);
        
        let fileContent 
        if(ext === "csv"){
            fileContent = await csv().fromFile(rawVideoPath)
        }else{
            const rawData= fs.readFileSync(rawVideoPath,"utf-8");
            fileContent= JSON.parse(rawData)
        }
        
        const fileName = `${messsageObj.Key.split(".").shift()}.pdf`
        let outputpath = path.join(path.resolve(),fileName)
        const PDFResponse = genratePDF(fileContent,outputpath)
        
        if(PDFResponse){
            const parallelUploads3 = new Upload({
                client:S3client,
                params: { 
                    Bucket:"pdf-ouput-suraj.com",
                    Key:`_ouput/${fileName}`,
                    Body:fs.createReadStream(outputpath),
                    ContentType:"application/pdf",
                },
            })
            await parallelUploads3.done()
            rm(outputpath,()=>{})
            rm(path.join(path.resolve(),dataStoresPath),()=>{})
        }
            } catch (error) {
                console.log(error)
                pause();
                setTimeout(()=>{
                    consumer.resume([{topic:"GET_OBJECT_FROM_SQS"}])
                },(60 * 2) * 1000)
            }
        },autoCommit:true
    })

}

function genratePDF(data,outputpath){
    try {
     const pdf = new PDFKit();
     pdf.pipe(fs.createWriteStream(outputpath));
 
     pdf.fontSize(12).text(JSON.stringify(data,null,2),10,15);
     pdf.end();
    
    return true
    } catch (error) {
     console.log(error)
     return false
    }
 }

initConsumers()