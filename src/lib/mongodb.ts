import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scc_audit'

// Connection options for production
const options = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds
}

export async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI, options)
    console.log('✅ Connected to MongoDB')
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err)
    })
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected')
    })
    
    return true
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    return false
  }
}

export async function disconnectFromMongoDB() {
  await mongoose.disconnect()
  console.log('✅ Disconnected from MongoDB')
}

export default mongoose

export function isConnected() {
  return mongoose.connection.readyState === 1 // 1 = connected
}
