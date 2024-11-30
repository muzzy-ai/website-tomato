import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://ilhamnugroho322:17stepbystep@cluster0.vabktkm.mongodb.net/website').then(()=>console.log("DB Connected"));
}

