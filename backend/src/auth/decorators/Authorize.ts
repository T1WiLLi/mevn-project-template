// auth/decorators/Authorize.ts
import { Authorized } from 'routing-controllers';
import { IAuthorizeOptions } from "../interfaces/IAuthorizeOptions";

export function Authorize(options: IAuthorizeOptions = {}): MethodDecorator & ClassDecorator {
    const rolesAndPermissions = [
        ...(options.roles || []),
        ...(options.permissions || [])
    ];

    return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
        return Authorized(rolesAndPermissions)(target, propertyKey, descriptor);
    };
}