import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';
const PROCESS_METHOD_MAP = {
    spine: ({ key, rawAsset, src }) => {
        var _a;
        const atlasAsset = rawAsset[src.atlas];
        const skeletonAsset = rawAsset[src.skeleton];
        const attachmentLoader = new SPINE_PIXI.AtlasAttachmentLoader(atlasAsset);
        const parser = skeletonAsset instanceof Uint8Array
            ? new SPINE_PIXI.SkeletonBinary(attachmentLoader)
            : new SPINE_PIXI.SkeletonJson(attachmentLoader);
        const scale = (_a = src === null || src === void 0 ? void 0 : src.scale) !== null && _a !== void 0 ? _a : 1;
        parser.scale = scale;
        const skeletonData = parser.readSkeletonData(skeletonAsset);
        return { [key]: skeletonData };
    },
    sprite: ({ key, rawAsset }) => ({ [key]: rawAsset }),
    sprites: ({ rawAsset }) => rawAsset.textures,
    spriteSheet: ({ key, rawAsset }) => ({
        [key]: Object.values(rawAsset.textures),
    }),
    audio: ({ key, rawAsset }) => {
        return { [key]: rawAsset };
    },
};
export const getProcessed = ({ key, type, rawAsset, src, }) => {
    if (type === 'font')
        return; // No need to process raw font data and add it to the loaded assets.
    const processMethod = PROCESS_METHOD_MAP[type];
    if (!processMethod)
        throw Error('No asset process method found, please check the type of the asset.');
    // @ts-expect-error
    return processMethod({ key, rawAsset, src });
};
