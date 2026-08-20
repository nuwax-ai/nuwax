import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function ArgsType() {
    return target => {
        getMetadataStorage().collectArgsMetadata({
            name: target.name,
            target,
        });
    };
}
