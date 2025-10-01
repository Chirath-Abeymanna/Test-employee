// models/Employee.ts
import { Schema, model, models, Document, Types, Model } from "mongoose";

interface IEmployee extends Document {
  // existing
  name: string;
  role: string; // (= position)
  gender: "Male" | "Female" | "Other";
  dob: Date;
  image?: string; // profile photo (Base64)
  company: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // NEW
  email: string; // must be @opticalspaces.com
  password?: string; // auto-fetched from Prisma backend, stored hashed or tokenized
  sickDaysPerMonth: number; // sick days available for month
  halfDaysPerMonth?: number; // optional half-day leaves per month
  salary?: number; // monthly salary (e.g., in LKR)

  // helpers
  getAge(): number;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    // existing
    name: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    role: {
      type: String,
      default: "Employee",
      trim: true,
      maxlength: [50, "Role cannot exceed 50 characters"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (value: Date) {
          return value <= new Date(); // not in the future
        },
        message: "Date of birth cannot be in the future",
      },
    },
    image: {
      type: String,
      trim: true,
      validate: {
        validator: (value: string) => {
          if (!value) return true;
          return (
            value.startsWith("data:image/") &&
            (value.includes("jpeg;base64") ||
              value.includes("png;base64") ||
              value.includes("jpg;base64") ||
              value.includes("gif;base64") ||
              value.includes("webp;base64"))
          );
        },
        message:
          "Image must be a valid base64 encoded image (JPEG, PNG, JPG, GIF, or WebP)",
      },
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company reference is required"],
      index: true,
    },

    // ---------- NEW FIELDS BELOW ----------
    email: {
      type: String,
      required: [true, "Employee email is required"],
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        validator: (v: string) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) &&
          v.endsWith("@opticalspaces.com"), // enforce domain
        message: "Email must be a valid opticalspaces.com address",
      },
    },

    // NOTE: store hashes/tokens only; never plaintext in production.
    password: {
      type: String,
      select: false, // don’t return by default
    },

    sickDaysPerMonth: {
      type: Number,
      default: 7, // pick your policy (e.g., 7 or 10)
      min: [0, "Sick days cannot be negative"],
    },

    salary: {
      type: Number,
      min: [0, "Salary cannot be negative"],
      // optional: set currency elsewhere; store raw number here
    },
  },
  {
    timestamps: true,
    collection: "employees",
  }
);

// Existing indexes
EmployeeSchema.index({ company: 1, createdAt: -1 });
EmployeeSchema.index({ name: "text", role: "text" });

// Fast lookup & uniqueness per company
EmployeeSchema.index({ company: 1, email: 1 }, { unique: true });

// Keep your existing pre-save hook
EmployeeSchema.pre<IEmployee>("save", function (next) {
  if (this.image && this.image.length > 2 * 1024 * 1024) {
    // 2MB limit
    const error = new Error("Image size exceeds 2MB limit");
    return next(error);
  }
  next();
});

// ---------- OPTIONAL: auto-fetch password from Prisma backend on create ----------
async function fetchPasswordFromPrisma(email: string): Promise<string | null> {
  try {
    const res = await fetch(`${process.env.PRISMA_EMPLOYEE_PW_API}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
      },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.passwordHash ?? null; // expect a hash/token, not plaintext
  } catch {
    return null;
  }
}

EmployeeSchema.pre<IEmployee>("save", async function (next) {
  if (
    this.isNew &&
    !this.password &&
    this.email?.endsWith("@opticalspaces.com")
  ) {
    const pw = await fetchPasswordFromPrisma(this.email);
    if (pw) this.password = pw;
    // If pw is null, either block save or allow and set later.
    // return next(new Error('Failed to fetch password from backend'));
  }
  next();
});

// Static helpers
EmployeeSchema.statics.findByCompany = function (companyId: Types.ObjectId) {
  return this.find({ company: companyId }).sort({ createdAt: -1 });
};

EmployeeSchema.statics.searchEmployees = function (
  companyId: Types.ObjectId,
  searchTerm: string
) {
  return this.find({
    company: companyId,
    $or: [
      { name: { $regex: searchTerm, $options: "i" } },
      { role: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
    ],
  }).sort({ createdAt: -1 });
};

// Instance method to get age
EmployeeSchema.methods.getAge = function (): number {
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

export default (models.Employee as Model<IEmployee>) ||
  model<IEmployee>("Employee", EmployeeSchema);
