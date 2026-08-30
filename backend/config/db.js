import mongoose from "mongoose";

const ConnectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log('MongoDb connect successfully');
    } catch (error) {
        console.error('MongoDb connection error', error.message);
        process.exit(1);
    }
}


module.export = ConnectDb;