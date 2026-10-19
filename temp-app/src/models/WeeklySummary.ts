import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWeeklySummary extends Document {
  userId: string;
  weekStart: Date;
  text: string;
  inputData: Record<string, unknown>;
  createdAt: Date;
}

const WeeklySummarySchema: Schema<IWeeklySummary> = new Schema(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      index: true,
      trim: true,
    },
    weekStart: {
      type: Date,
      required: [true, "weekStart is required"],
    },
    text: {
      type: String,
      required: [true, "text is required"],
    },
    inputData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

WeeklySummarySchema.index({ userId: 1, weekStart: -1 });

const WeeklySummary: Model<IWeeklySummary> =
  mongoose.models.WeeklySummary ||
  mongoose.model<IWeeklySummary>("WeeklySummary", WeeklySummarySchema);

export default WeeklySummary;
