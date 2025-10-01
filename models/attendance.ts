import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IAttendance extends Document {}

export interface IAttendance extends Document {
  employee: Types.ObjectId;
  signInTime?: Date;
  signOutTime?: Date;
  lunchBreakStart?: Date;
  lunchBreakEnd?: Date;
  lunchBreakTaken: boolean;
  presentAbsentStatus: "present" | "absent";
  halfDay: boolean;
  date: Date;
  workLocation: "work_from_home" | "work_from_office";
  totalHoursWorked: number;
  leaveType?: "sick" | "casual" | "other" | null;
  createdAt?: Date;
  updatedAt?: Date;
  overtimeHours?: number;
  isToday: () => boolean;
  isCheckedIn: () => boolean;
  signOut: () => Promise<IAttendance>;
  isValidWorkDay: () => boolean;
}

export interface AttendanceModel extends Model<IAttendance> {
  findTodayAttendance(
    employeeId: Types.ObjectId | string
  ): Promise<IAttendance | null>;
}

// Attendance Schema
const attendanceSchema = new Schema<IAttendance>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    signInTime: {
      type: Date,
      default: null,
    },
    signOutTime: {
      type: Date,
      default: null,
    },
    lunchBreakStart: {
      type: Date,
      default: null,
    },
    lunchBreakEnd: {
      type: Date,
      default: null,
    },
    lunchBreakTaken: {
      type: Boolean,
      default: false,
    },
    presentAbsentStatus: {
      type: String,
      required: true,
      enum: ["present", "absent"],
      default: "absent",
    },
    halfDay: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    workLocation: {
      type: String,
      required: true,
      enum: ["work_from_home", "work_from_office"],
      default: "work_from_office",
    },
    totalHoursWorked: {
      type: Number,
      default: 0,
      min: 0,
      max: 24,
    },
    // Add leaveType to track type of leave (sick, casual, etc.)
    leaveType: {
      type: String,
      enum: ["sick", "casual", "other", "half"],
      default: null,
    },
    // Add overtimeHours to record overtime
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 12,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for better query performance

// Ensure one attendance record per employee per date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Pre-save middleware to calculate total hours worked if sign in/out times are provided
attendanceSchema.pre<IAttendance>("save", function (next) {
  // If halfDay is true and signInTime is set but signOutTime is not, auto-set signOutTime to 4 hours after signInTime
  if (this.halfDay && this.signInTime && !this.signOutTime) {
    this.signOutTime = new Date(this.signInTime.getTime() + 4 * 60 * 60 * 1000);
  }
  if (this.signInTime && this.signOutTime) {
    const diffInMs = this.signOutTime.getTime() - this.signInTime.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    this.totalHoursWorked = Math.max(0, parseFloat(diffInHours.toFixed(2)));
    // Set present status if hours worked
    if (this.totalHoursWorked > 0) {
      this.presentAbsentStatus = "present";
    }
  }
  next();
});

// Static method to find attendance by employee and date range
attendanceSchema.statics.findByEmployeeAndDateRange = function (
  employeeId: Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    employee: employeeId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).populate("employee");
};

// Static method to find today's attendance for an employee
attendanceSchema.statics.findTodayAttendance = function (
  employeeId: Types.ObjectId
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return this.findOne({
    employee: employeeId,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  });
};

// Static method to get monthly attendance summary
attendanceSchema.statics.getMonthlyAttendance = function (
  employeeId: Types.ObjectId,
  year: number,
  month: number
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return this.find({
    employee: employeeId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).populate("employee");
};

// Instance method to check if attendance is for today
attendanceSchema.methods.isToday = function (this: IAttendance) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const attendanceDate = new Date(this.date);
  attendanceDate.setHours(0, 0, 0, 0);
  return today.getTime() === attendanceDate.getTime();
};

// Instance method to check if employee is currently checked in
attendanceSchema.methods.isCheckedIn = function (this: IAttendance) {
  return !!this.signInTime && !this.signOutTime;
};

// Instance method to sign out
attendanceSchema.methods.signOut = function (this: IAttendance) {
  if (!this.signInTime) {
    throw new Error("Cannot sign out without signing in first");
  }
  if (this.signOutTime) {
    throw new Error("Already signed out");
  }
  this.signOutTime = new Date();
  return this.save();
};

// Instance method to check if it's a valid work day
attendanceSchema.methods.isValidWorkDay = function (this: IAttendance) {
  return this.totalHoursWorked >= (this.halfDay ? 4 : 8);
};

const Attendance =
  (mongoose.models.Attendance as AttendanceModel) ||
  mongoose.model<IAttendance, AttendanceModel>("Attendance", attendanceSchema);

export default Attendance;
