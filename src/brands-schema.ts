import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
    brandName: string;
    yearFounded: number;
    headquarters: string;
    numberOfLocations: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const brandSchema = new Schema<IBrand>(
    {
        brandName: {
            type: String,
            required: true,
            trim: true,
        },
        yearFounded: {
            type: Number,
            required: true,
            min: [1600, 'Year founded seems too old'],
            max: [new Date().getFullYear(), 'Year founded cannot be in the future'],
        },
        headquarters: {
            type: String,
            required: true,
            trim: true,
        },
        numberOfLocations: {
            type: Number,
            required: true,
            min: [1, 'There should be at least one location'],
        },
    },
    {
        timestamps: true,
    }
);

export const Brand = mongoose.model<IBrand>('Brand', brandSchema);
