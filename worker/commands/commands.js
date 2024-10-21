import { GetObjectCommand } from "@aws-sdk/client-s3";

export function GetObjectCommandFunc(BUCKET_NAME,KEY){
    return new GetObjectCommand({
        Bucket:BUCKET_NAME.toString(),
        Key:KEY.toString()
    })
}