import mongoose, { Document, Schema } from 'mongoose'

// Audit Staff Schema
const AuditStaffSchema = new Schema({
  _id: Schema.Types.ObjectId,
  staffId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  pin: { type: String, required: true },
  locations: { type: [String], required: true },
  isActive: { type: Boolean, default: true }
})

// Client Staff Schema
const ClientStaffSchema = new Schema({
  _id: Schema.Types.ObjectId,
  staffId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  pin: { type: String, required: true },
  location: { type: String, required: true },
  isActive: { type: Boolean, default: true }
})

// Inventory Schema
const InventorySchema = new Schema({
  _id: Schema.Types.ObjectId,
  skuId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  pickingLocation: { type: String },
  bulkLocation: { type: String },
  minQtyOdin: { type: Number, default: 0 },
  blockedQtyOdin: { type: Number, default: 0 },
  maxQtyOdin: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

// Audit Entry Schema
const AuditEntrySchema = new Schema({
  _id: Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date },
  auditStaffId: { type: Schema.Types.ObjectId, required: true, ref: 'AuditStaff' },
  auditStaffName: { type: String, required: true },
  location: { type: String, required: true },
  skuId: { type: String, required: true },
  skuName: { type: String, required: true },
  pickingQty: { type: Number, default: 0 },
  pickingLocation: { type: String },
  bulkQty: { type: Number, default: 0 },
  bulkLocation: { type: String },
  nearExpiryQty: { type: Number, default: 0 },
  nearExpiryLocation: { type: String, default: 'NA' },
  jitQty: { type: Number, default: 0 },
  jitLocation: { type: String, default: 'NA' },
  damagedQty: { type: Number, default: 0 },
  damagedLocation: { type: String },
  minQtyOdin: { type: Number, default: 0 },
  blockedQtyOdin: { type: Number, default: 0 },
  maxQtyOdin: { type: Number, default: 0 },
  totalQuantityIdentified: { type: Number, required: true },
  qtyTested: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Resubmitted', 'Completed', 'Closed'],
    default: 'Draft'
  },
  objectionRaised: { type: Boolean, default: false },
  objectionType: { type: String, enum: ['Short', 'Excess'], default: null },
  assignedClientStaffId: { type: Schema.Types.ObjectId, ref: 'ClientStaff' },
  assignedClientStaffName: { type: String },
  objectionRemarks: { type: String },
  clientAction: { type: String },
  clientActionDate: { type: Date }
})

// Export Models
export const AuditStaff = mongoose.model('AuditStaff', AuditStaffSchema)
export const ClientStaff = mongoose.model('ClientStaff', ClientStaffSchema)
export const Inventory = mongoose.model('Inventory', InventorySchema)
export const AuditEntry = mongoose.model('AuditEntry', AuditEntrySchema)
