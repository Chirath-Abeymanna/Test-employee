// models/Company.ts
import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

// ---------- helpers ----------
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const hhmmToMinutes = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

export interface ICompany extends Document {
  company_id: string;
  company_name: string;
  company_email: string;
  password: string;
  company_logo?: string;
  company_start_time?: string; // "HH:mm"
  company_out_time?: string; // "HH:mm"

  /** NEW: lunch options */
  accept_lunch: boolean;
  lunch_start_time?: string | null; // "HH:mm" when accept_lunch=true
  lunch_duration_minutes?: 30 | 60 | null;

  rental_info?: {
    monthly_rent: number;
    last_payment_date?: Date;
    next_due_date: Date;
    payment_status: "paid" | "pending" | "overdue";
    overdue_amount?: number;
  };
  electricity_usage?: {
    current_month_kwh: number;
    previous_month_kwh: number;
    rate_per_kwh: number;
    last_reading_date: Date;
  };
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const CompanySchema: Schema = new Schema(
  {
    company_id: { type: String, required: true, unique: true, trim: true },
    company_name: { type: String, required: true, trim: true, maxlength: 100 },
    company_email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    company_logo: { type: String, trim: true, default: null },

    // Work hours
    company_start_time: {
      type: String,
      trim: true,
      default: "09:00",
      validate: {
        validator: (v: string) => HHMM_RE.test(v),
        message: "company_start_time must be in HH:mm (00:00–23:59) format",
      },
    },
    company_out_time: {
      type: String,
      trim: true,
      default: "18:00",
      validate: [
        {
          validator: (v: string) => HHMM_RE.test(v),
          message: "company_out_time must be in HH:mm (00:00–23:59) format",
        },
        {
          validator: function (this: any, v: string) {
            if (!this.company_start_time || !v) return true;
            return (
              hhmmToMinutes(v) >
              hhmmToMinutes(this.company_start_time as string)
            );
          },
          message: "company_out_time must be after company_start_time",
        },
      ],
    },

    /** NEW: lunch fields */
    accept_lunch: {
      type: Boolean,
      default: false,
    },
    lunch_start_time: {
      type: String,
      trim: true,
      default: null,
      validate: [
        {
          validator: function (this: any, v: string | null) {
            if (!this.accept_lunch) return true;
            return !!v && HHMM_RE.test(v);
          },
          message:
            "lunch_start_time must be provided in HH:mm format when lunch is accepted",
        },
      ],
    },
    lunch_duration_minutes: {
      type: Number,
      default: null,
      enum: [30, 60, null] as any, // allow null when accept_lunch=false
      validate: [
        {
          validator: function (this: any, v: number | null) {
            if (!this.accept_lunch) return true;
            return v === 30 || v === 60;
          },
          message:
            "lunch_duration_minutes must be 30 or 60 when lunch is accepted",
        },
        {
          // Ensure lunch fits within work hours if both set
          validator: function (this: any, v: number | null) {
            if (!this.accept_lunch) return true;
            if (!this.lunch_start_time || !v) return true;
            if (!this.company_start_time || !this.company_out_time) return true;
            const start = hhmmToMinutes(this.company_start_time);
            const out = hhmmToMinutes(this.company_out_time);
            const lunchStart = hhmmToMinutes(this.lunch_start_time);
            const lunchEnd = lunchStart + v;
            return lunchStart >= start && lunchEnd <= out;
          },
          message: "Lunch time must be within company work hours",
        },
      ],
    },

    rental_info: {
      monthly_rent: { type: Number, min: 0 },
      last_payment_date: { type: Date, default: null },
      next_due_date: { type: Date },
      payment_status: {
        type: String,
        enum: ["paid", "pending", "overdue"],
        default: "pending",
      },
      overdue_amount: { type: Number, default: 0, min: 0 },
    },

    electricity_usage: {
      current_month_kwh: { type: Number, default: 0, min: 0 },
      previous_month_kwh: { type: Number, default: 0, min: 0 },
      rate_per_kwh: { type: Number, min: 0 },
      last_reading_date: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
    collection: "companies",
  }
);

// Statics
CompanySchema.statics.findByEmail = function (email: string) {
  return this.findOne({ company_email: email.toLowerCase() });
};
CompanySchema.statics.findByCompanyId = function (companyId: string) {
  return this.findOne({ company_id: companyId });
};

// Methods
CompanySchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const Company =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);

export default Company;
