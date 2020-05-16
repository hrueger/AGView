import "reflect-metadata";

export function Save(target, propertyKey) {
    Reflect.defineMetadata("save", true, target, propertyKey);
}
