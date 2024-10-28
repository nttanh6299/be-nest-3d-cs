import { Schema, Document } from "mongoose";
import { AppRoles } from "modules/app/app.roles";

/**
 * Mongoose Profile Schema
 */
export const Profile = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  roles: [{ type: String }],
  date: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Mongoose Profile Document
 */
export class IProfile extends Document {
  /**
   * UUID
   */
  readonly _id: Schema.Types.ObjectId;
  /**
   * Username
   */
  readonly username: string;
  /**
   * Email
   */
  readonly email: string;
  /**
   * Password
   */
  password: string;
  /**
   * Roles
   */
  readonly roles: AppRoles;
  /**
   * Date
   */
  readonly date: Date;
}
