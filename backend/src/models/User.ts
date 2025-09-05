import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({
    schemaOptions: {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id.toString(); // We create the field .id and assign _id as a string to it
                delete ret._id; // We delete the _id
                delete ret.__v; // We delete the __v
                delete ret.password; // We delete the password 
            }
        }
    }
})

export class User {
    @prop({
        required: [true, 'user.name.required'],
        minlength: [2, 'user.name.minLength'],
        maxlength: [50, 'user.name.maxLength'],
    })
    public name!: string;

    @prop({
        required: [true, 'user.email.required'],
        unique: [true, 'user.email.unique'],
        match: [/^\S+@\S+\.\S+$/, 'user.email.invalid'],
    })
    public email!: string;

    @prop({
        required: [true, 'user.password.required'],
        minlength: [8, 'user.password.minLength'],
        match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, 'user.password.match']
    })
    public password!: string;

}

export const UserModel = getModelForClass(User);

