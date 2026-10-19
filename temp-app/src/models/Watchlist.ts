import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWatchlist extends Document {
  userId: string;
  symbols: string[];
  updatedAt: Date;
}

const WatchlistSchema: Schema<IWatchlist> = new Schema(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      unique: true,
      index: true,
      trim: true,
    },
    symbols: {
      type: [String],
      default: [],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

// Ensure symbols are stored uppercase, trimmed, and deduplicated
WatchlistSchema.pre("save", function () {
  if (Array.isArray(this.symbols)) {
    this.symbols = Array.from(
      new Set(this.symbols.map((s) => s.toUpperCase().trim()).filter(Boolean))
    );
  }
  this.updatedAt = new Date();
});

const Watchlist: Model<IWatchlist> =
  mongoose.models.Watchlist || mongoose.model<IWatchlist>("Watchlist", WatchlistSchema);

export default Watchlist;
