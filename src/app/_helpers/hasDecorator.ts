import "reflect-metadata";

export function hasDecorator<T>(instance: T, propertyKey: string, metadataKey) {
    return !!Reflect.getMetadata(metadataKey, instance, propertyKey);
}
