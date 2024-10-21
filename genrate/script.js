import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand, S3Client,S3} from "@aws-sdk/client-s3";
import PDFKit from "pdfkit"
import fs2 from "fs/promises"
import fs from "fs"
import path from "path";
import csv from "csvtojson"

// ENVIRONMENT VARIABLES 
const BUCKET_NAME= process.env.BUCKET_NAME;
const KEY=process.env.KEY;
const ACCESS_KEY= process.env.ACCESS_KEY;
const SECRET_ACCESS_KEY= process.env.SECRET_ACCESS_KEY;

const client = new S3Client({
    region:"ap-south-1",
    credentials:{
        accessKeyId:ACCESS_KEY,
        secretAccessKey:SECRET_ACCESS_KEY
    }})

async function init(){

    try {
        const getCommand= new GetObjectCommand({
            Bucket:BUCKET_NAME.toString(),
            Key:KEY.toString()
        });
        
        const {Body} = await client.send(getCommand);
        
        const ext = KEY.split(".").pop();
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
        
        const fileName = `${KEY.split(".").shift()}.pdf`
        let outputpath = path.join(path.resolve(),fileName)
        const PDFResponse = genratePDF(fileContent,outputpath,fileName)
        
        if(PDFResponse){
            const parallelUploads3 = new Upload({
                client:client,
                params: { 
                    Bucket:"pdf-ouput-suraj.com",
                    Key:`_ouput/${fileName}`,
                    Body:fs.createReadStream(outputpath),
                    ContentType:"application/pdf",
                },
            })
            await parallelUploads3.done()
        }
        process.exit(1)

    }catch(error){
        console.log(error)
        process.exit(1)
    }}


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

init()