import mongoose from "mongoose";
import messageModel from "./message.model";

const conversationSchema = new mongoose.Schema({
    participants:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    message:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Message'
    }]
});
export default Conversation = mongoose.model('Conversation',conversationSchema);