import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILeave extends Document {
  employee: Types.ObjectId | string;
  sickLeaves: number;
  halfDayLeaves: number;
}

const LeaveSchema: Schema = new Schema({
  employee: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
    index: true,
  },
  sickLeaves: {
    type: Number,
    default: 0,
    required: true,
  },
  halfDayLeaves: {
    type: Number,
    default: 0,
    required: true,
  },
});

export default mongoose.models.Leave ||
  mongoose.model<ILeave>("Leave", LeaveSchema);
