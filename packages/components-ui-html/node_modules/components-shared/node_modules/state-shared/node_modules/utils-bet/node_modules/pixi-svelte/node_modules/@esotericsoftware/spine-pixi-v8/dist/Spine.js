/** ****************************************************************************
 * Spine Runtimes License Agreement
 * Last updated July 28, 2023. Replaces all prior versions.
 *
 * Copyright (c) 2013-2023, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software or
 * otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE
 * SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/
import { Assets, Cache, Container, DEG_TO_RAD, fastCopy, Graphics, Texture, Ticker, ViewContainer, } from 'pixi.js';
import { AnimationState, AnimationStateData, AtlasAttachmentLoader, ClippingAttachment, Color, MeshAttachment, Physics, Pool, RegionAttachment, Skeleton, SkeletonBinary, SkeletonBounds, SkeletonClipping, SkeletonData, SkeletonJson, Skin, Vector2, } from '@esotericsoftware/spine-core';
;
const vectorAux = new Vector2();
Skeleton.yDown = true;
const clipper = new SkeletonClipping();
/** A bounds provider that provides a fixed size given by the user. */
export class AABBRectangleBoundsProvider {
    x;
    y;
    width;
    height;
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    calculateBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}
/** A bounds provider that calculates the bounding box from the setup pose. */
export class SetupPoseBoundsProvider {
    clipping;
    /**
     * @param clipping If true, clipping attachments are used to compute the bounds. False, by default.
     */
    constructor(clipping = false) {
        this.clipping = clipping;
    }
    calculateBounds(gameObject) {
        if (!gameObject.skeleton)
            return { x: 0, y: 0, width: 0, height: 0 };
        // Make a copy of animation state and skeleton as this might be called while
        // the skeleton in the GameObject has already been heavily modified. We can not
        // reconstruct that state.
        const skeleton = new Skeleton(gameObject.skeleton.data);
        skeleton.setToSetupPose();
        skeleton.updateWorldTransform(Physics.update);
        const bounds = skeleton.getBoundsRect(this.clipping ? new SkeletonClipping() : undefined);
        return bounds.width == Number.NEGATIVE_INFINITY
            ? { x: 0, y: 0, width: 0, height: 0 }
            : bounds;
    }
}
/** A bounds provider that calculates the bounding box by taking the maximumg bounding box for a combination of skins and specific animation. */
export class SkinsAndAnimationBoundsProvider {
    animation;
    skins;
    timeStep;
    clipping;
    /**
     * @param animation The animation to use for calculating the bounds. If null, the setup pose is used.
     * @param skins The skins to use for calculating the bounds. If empty, the default skin is used.
     * @param timeStep The time step to use for calculating the bounds. A smaller time step means more precision, but slower calculation.
     * @param clipping If true, clipping attachments are used to compute the bounds. False, by default.
     */
    constructor(animation, skins = [], timeStep = 0.05, clipping = false) {
        this.animation = animation;
        this.skins = skins;
        this.timeStep = timeStep;
        this.clipping = clipping;
    }
    calculateBounds(gameObject) {
        if (!gameObject.skeleton || !gameObject.state)
            return { x: 0, y: 0, width: 0, height: 0 };
        // Make a copy of animation state and skeleton as this might be called while
        // the skeleton in the GameObject has already been heavily modified. We can not
        // reconstruct that state.
        const animationState = new AnimationState(gameObject.state.data);
        const skeleton = new Skeleton(gameObject.skeleton.data);
        const clipper = this.clipping ? new SkeletonClipping() : undefined;
        const data = skeleton.data;
        if (this.skins.length > 0) {
            let customSkin = new Skin("custom-skin");
            for (const skinName of this.skins) {
                const skin = data.findSkin(skinName);
                if (skin == null)
                    continue;
                customSkin.addSkin(skin);
            }
            skeleton.setSkin(customSkin);
        }
        skeleton.setToSetupPose();
        const animation = this.animation != null ? data.findAnimation(this.animation) : null;
        if (animation == null) {
            skeleton.updateWorldTransform(Physics.update);
            const bounds = skeleton.getBoundsRect(clipper);
            return bounds.width == Number.NEGATIVE_INFINITY
                ? { x: 0, y: 0, width: 0, height: 0 }
                : bounds;
        }
        else {
            let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
            animationState.clearTracks();
            animationState.setAnimationWith(0, animation, false);
            const steps = Math.max(animation.duration / this.timeStep, 1.0);
            for (let i = 0; i < steps; i++) {
                const delta = i > 0 ? this.timeStep : 0;
                animationState.update(delta);
                animationState.apply(skeleton);
                skeleton.update(delta);
                skeleton.updateWorldTransform(Physics.update);
                const bounds = skeleton.getBoundsRect(clipper);
                minX = Math.min(minX, bounds.x);
                minY = Math.min(minY, bounds.y);
                maxX = Math.max(maxX, bounds.x + bounds.width);
                maxY = Math.max(maxY, bounds.y + bounds.height);
            }
            const bounds = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY,
            };
            return bounds.width == Number.NEGATIVE_INFINITY
                ? { x: 0, y: 0, width: 0, height: 0 }
                : bounds;
        }
    }
}
;
const maskPool = new Pool(() => new Graphics);
/**
 * The class to instantiate a {@link Spine} game object in Pixi.
 * The static method {@link Spine.from} should be used to instantiate a Spine game object.
 */
export class Spine extends ViewContainer {
    // Pixi properties
    batched = true;
    buildId = 0;
    renderPipeId = 'spine';
    _didSpineUpdate = false;
    beforeUpdateWorldTransforms = () => { };
    afterUpdateWorldTransforms = () => { };
    // Spine properties
    /** The skeleton for this Spine game object. */
    skeleton;
    /** The animation state for this Spine game object. */
    state;
    skeletonBounds;
    darkTint = false;
    _debug = undefined;
    _slotsObject = Object.create(null);
    clippingSlotToPixiMasks = Object.create(null);
    getSlotFromRef(slotRef) {
        let slot;
        if (typeof slotRef === 'number')
            slot = this.skeleton.slots[slotRef];
        else if (typeof slotRef === 'string')
            slot = this.skeleton.findSlot(slotRef);
        else
            slot = slotRef;
        if (!slot)
            throw new Error(`No slot found with the given slot reference: ${slotRef}`);
        return slot;
    }
    spineAttachmentsDirty = true;
    spineTexturesDirty = true;
    _lastAttachments = [];
    _stateChanged = true;
    attachmentCacheData = [];
    get debug() {
        return this._debug;
    }
    /** Pass a {@link SpineDebugRenderer} or create your own {@link ISpineDebugRenderer} to render bones, meshes, ...
     * @example spineGO.debug = new SpineDebugRenderer();
     */
    set debug(value) {
        if (this._debug) {
            this._debug.unregisterSpine(this);
        }
        if (value) {
            value.registerSpine(this);
        }
        this._debug = value;
    }
    _autoUpdate = true;
    get autoUpdate() {
        return this._autoUpdate;
    }
    /** When `true`, the Spine AnimationState and the Skeleton will be automatically updated using the {@link Ticker.shared} instance. */
    set autoUpdate(value) {
        if (value) {
            Ticker.shared.add(this.internalUpdate, this);
        }
        else {
            Ticker.shared.remove(this.internalUpdate, this);
        }
        this._autoUpdate = value;
    }
    _boundsProvider;
    /** The bounds provider to use. If undefined the bounds will be dynamic, calculated when requested and based on the current frame. */
    get boundsProvider() {
        return this._boundsProvider;
    }
    set boundsProvider(value) {
        this._boundsProvider = value;
        if (value) {
            this._boundsDirty = false;
        }
        this.updateBounds();
    }
    hasNeverUpdated = true;
    constructor(options) {
        if (options instanceof SkeletonData) {
            options = {
                skeletonData: options,
            };
        }
        super();
        const skeletonData = options instanceof SkeletonData ? options : options.skeletonData;
        this.skeleton = new Skeleton(skeletonData);
        this.state = new AnimationState(new AnimationStateData(skeletonData));
        this.autoUpdate = options?.autoUpdate ?? true;
        // dark tint can be enabled by options, otherwise is enable if at least one slot has tint black
        this.darkTint = options?.darkTint === undefined
            ? this.skeleton.slots.some(slot => !!slot.data.darkColor)
            : options?.darkTint;
        const slots = this.skeleton.slots;
        for (let i = 0; i < slots.length; i++) {
            this.attachmentCacheData[i] = Object.create(null);
        }
        this._boundsProvider = options.boundsProvider;
    }
    /** If {@link Spine.autoUpdate} is `false`, this method allows to update the AnimationState and the Skeleton with the given delta. */
    update(dt) {
        this.internalUpdate(0, dt);
    }
    internalUpdate(_deltaFrame, deltaSeconds) {
        // Because reasons, pixi uses deltaFrames at 60fps.
        // We ignore the default deltaFrames and use the deltaSeconds from pixi ticker.
        this._updateAndApplyState(deltaSeconds ?? Ticker.shared.deltaMS / 1000);
    }
    get bounds() {
        if (this._boundsDirty) {
            this.updateBounds();
        }
        return this._bounds;
    }
    /**
     * Set the position of the bone given in input through a {@link IPointData}.
     * @param bone: the bone name or the bone instance to set the position
     * @param outPos: the new position of the bone.
     * @throws {Error}: if the given bone is not found in the skeleton, an error is thrown
     */
    setBonePosition(bone, position) {
        const boneAux = bone;
        if (typeof bone === 'string') {
            bone = this.skeleton.findBone(bone);
        }
        if (!bone)
            throw Error(`Cant set bone position, bone ${String(boneAux)} not found`);
        vectorAux.set(position.x, position.y);
        if (bone.parent) {
            const aux = bone.parent.worldToLocal(vectorAux);
            bone.x = aux.x;
            bone.y = -aux.y;
        }
        else {
            bone.x = vectorAux.x;
            bone.y = vectorAux.y;
        }
    }
    /**
     * Return the position of the bone given in input into an {@link IPointData}.
     * @param bone: the bone name or the bone instance to get the position from
     * @param outPos: an optional {@link IPointData} to use to return the bone position, rathern than instantiating a new object.
     * @returns {IPointData | undefined}: the position of the bone, or undefined if no matching bone is found in the skeleton
     */
    getBonePosition(bone, outPos) {
        const boneAux = bone;
        if (typeof bone === 'string') {
            bone = this.skeleton.findBone(bone);
        }
        if (!bone) {
            console.error(`Cant set bone position! Bone ${String(boneAux)} not found`);
            return outPos;
        }
        if (!outPos) {
            outPos = { x: 0, y: 0 };
        }
        outPos.x = bone.worldX;
        outPos.y = bone.worldY;
        return outPos;
    }
    /**
     * Advance the state and skeleton by the given time, then update slot objects too.
     * The container transform is not updated.
     *
     * @param time the time at which to set the state
     */
    _updateAndApplyState(time) {
        this.hasNeverUpdated = false;
        this.state.update(time);
        this.skeleton.update(time);
        const { skeleton } = this;
        this.state.apply(skeleton);
        this.beforeUpdateWorldTransforms(this);
        skeleton.updateWorldTransform(Physics.update);
        this.afterUpdateWorldTransforms(this);
        this.updateSlotObjects();
        this._stateChanged = true;
        this.onViewUpdate();
    }
    /**
     * - validates the attachments - to flag if the attachments have changed this state
     * - transforms the attachments - to update the vertices of the attachments based on the new positions
     * @internal
     */
    _validateAndTransformAttachments() {
        if (!this._stateChanged)
            return;
        this._stateChanged = false;
        this.validateAttachments();
        this.transformAttachments();
    }
    validateAttachments() {
        const currentDrawOrder = this.skeleton.drawOrder;
        const lastAttachments = this._lastAttachments;
        let index = 0;
        let spineAttachmentsDirty = false;
        for (let i = 0; i < currentDrawOrder.length; i++) {
            const slot = currentDrawOrder[i];
            const attachment = slot.getAttachment();
            if (attachment) {
                if (attachment !== lastAttachments[index]) {
                    spineAttachmentsDirty = true;
                    lastAttachments[index] = attachment;
                }
                index++;
            }
        }
        if (index !== lastAttachments.length) {
            spineAttachmentsDirty = true;
            lastAttachments.length = index;
        }
        this.spineAttachmentsDirty ||= spineAttachmentsDirty;
    }
    currentClippingSlot;
    updateAndSetPixiMask(slot, last) {
        // assign/create the currentClippingSlot
        const attachment = slot.attachment;
        if (attachment && attachment instanceof ClippingAttachment) {
            const clip = (this.clippingSlotToPixiMasks[slot.data.name] ||= { slot, vertices: new Array() });
            clip.maskComputed = false;
            this.currentClippingSlot = this.clippingSlotToPixiMasks[slot.data.name];
            return;
        }
        // assign the currentClippingSlot mask to the slot object
        let currentClippingSlot = this.currentClippingSlot;
        let slotObject = this._slotsObject[slot.data.name];
        if (currentClippingSlot && slotObject) {
            let slotClipping = currentClippingSlot.slot;
            let clippingAttachment = slotClipping.attachment;
            // create the pixi mask, only the first time and if the clipped slot is the first one clipped by this currentClippingSlot
            let mask = currentClippingSlot.mask;
            if (!mask) {
                mask = maskPool.obtain();
                currentClippingSlot.mask = mask;
                this.addChild(mask);
            }
            // compute the pixi mask polygon, if the clipped slot is the first one clipped by this currentClippingSlot
            if (!currentClippingSlot.maskComputed) {
                currentClippingSlot.maskComputed = true;
                const worldVerticesLength = clippingAttachment.worldVerticesLength;
                const vertices = currentClippingSlot.vertices;
                clippingAttachment.computeWorldVertices(slotClipping, 0, worldVerticesLength, vertices, 0, 2);
                mask.clear().poly(vertices).stroke({ width: 0 }).fill({ alpha: .25 });
            }
            slotObject.container.mask = mask;
        }
        else if (slotObject?.container.mask) {
            // remove the mask, if slot object has a mask, but currentClippingSlot is undefined
            slotObject.container.mask = null;
        }
        // if current slot is the ending one of the currentClippingSlot mask, set currentClippingSlot to undefined
        if (currentClippingSlot && currentClippingSlot.slot.attachment.endSlot == slot.data) {
            this.currentClippingSlot = undefined;
        }
        // clean up unused masks
        if (last) {
            for (const key in this.clippingSlotToPixiMasks) {
                const clippingSlotToPixiMask = this.clippingSlotToPixiMasks[key];
                if ((!(clippingSlotToPixiMask.slot.attachment instanceof ClippingAttachment) || !clippingSlotToPixiMask.maskComputed) && clippingSlotToPixiMask.mask) {
                    this.removeChild(clippingSlotToPixiMask.mask);
                    maskPool.free(clippingSlotToPixiMask.mask);
                    clippingSlotToPixiMask.mask = undefined;
                }
            }
            this.currentClippingSlot = undefined;
        }
    }
    transformAttachments() {
        const currentDrawOrder = this.skeleton.drawOrder;
        for (let i = 0; i < currentDrawOrder.length; i++) {
            const slot = currentDrawOrder[i];
            this.updateAndSetPixiMask(slot, i === currentDrawOrder.length - 1);
            const attachment = slot.getAttachment();
            if (attachment) {
                if (attachment instanceof MeshAttachment || attachment instanceof RegionAttachment) {
                    const cacheData = this._getCachedData(slot, attachment);
                    if (attachment instanceof RegionAttachment) {
                        attachment.computeWorldVertices(slot, cacheData.vertices, 0, 2);
                    }
                    else {
                        attachment.computeWorldVertices(slot, 0, attachment.worldVerticesLength, cacheData.vertices, 0, 2);
                    }
                    // sequences uvs are known only after computeWorldVertices is invoked
                    if (cacheData.uvs.length < attachment.uvs.length) {
                        cacheData.uvs = new Float32Array(attachment.uvs.length);
                    }
                    // need to copy because attachments uvs are shared among skeletons using the same atlas
                    fastCopy(attachment.uvs.buffer, cacheData.uvs.buffer);
                    const skeleton = slot.bone.skeleton;
                    const skeletonColor = skeleton.color;
                    const slotColor = slot.color;
                    const attachmentColor = attachment.color;
                    cacheData.color.set(skeletonColor.r * slotColor.r * attachmentColor.r, skeletonColor.g * slotColor.g * attachmentColor.g, skeletonColor.b * slotColor.b * attachmentColor.b, skeletonColor.a * slotColor.a * attachmentColor.a);
                    if (slot.darkColor) {
                        cacheData.darkColor.setFromColor(slot.darkColor);
                    }
                    cacheData.skipRender = cacheData.clipped = false;
                    const texture = attachment.region?.texture.texture || Texture.EMPTY;
                    if (cacheData.texture !== texture) {
                        cacheData.texture = texture;
                        this.spineTexturesDirty = true;
                    }
                    if (clipper.isClipping()) {
                        this.updateClippingData(cacheData);
                    }
                }
                else if (attachment instanceof ClippingAttachment) {
                    clipper.clipStart(slot, attachment);
                    continue;
                }
            }
            clipper.clipEndWithSlot(slot);
        }
        clipper.clipEnd();
    }
    updateClippingData(cacheData) {
        cacheData.clipped = true;
        clipper.clipTrianglesUnpacked(cacheData.vertices, cacheData.indices, cacheData.indices.length, cacheData.uvs);
        const { clippedVertices, clippedUVs, clippedTriangles } = clipper;
        const verticesCount = clippedVertices.length / 2;
        const indicesCount = clippedTriangles.length;
        if (!cacheData.clippedData) {
            cacheData.clippedData = {
                vertices: new Float32Array(verticesCount * 2),
                uvs: new Float32Array(verticesCount * 2),
                vertexCount: verticesCount,
                indices: new Uint16Array(indicesCount),
                indicesCount,
            };
            this.spineAttachmentsDirty = true;
        }
        const clippedData = cacheData.clippedData;
        const sizeChange = clippedData.vertexCount !== verticesCount || indicesCount !== clippedData.indicesCount;
        cacheData.skipRender = verticesCount === 0;
        if (sizeChange) {
            this.spineAttachmentsDirty = true;
            if (clippedData.vertexCount < verticesCount) {
                // buffer reuse!
                clippedData.vertices = new Float32Array(verticesCount * 2);
                clippedData.uvs = new Float32Array(verticesCount * 2);
            }
            if (clippedData.indices.length < indicesCount) {
                clippedData.indices = new Uint16Array(indicesCount);
            }
        }
        const { vertices, uvs, indices } = clippedData;
        for (let i = 0; i < verticesCount; i++) {
            vertices[i * 2] = clippedVertices[i * 2];
            vertices[(i * 2) + 1] = clippedVertices[(i * 2) + 1];
            uvs[i * 2] = clippedUVs[(i * 2)];
            uvs[(i * 2) + 1] = clippedUVs[(i * 2) + 1];
        }
        clippedData.vertexCount = verticesCount;
        for (let i = 0; i < indicesCount; i++) {
            if (indices[i] !== clippedTriangles[i]) {
                this.spineAttachmentsDirty = true;
                indices[i] = clippedTriangles[i];
            }
        }
        clippedData.indicesCount = indicesCount;
    }
    /**
     * ensure that attached containers map correctly to their slots
     * along with their position, rotation, scale, and visibility.
     */
    updateSlotObjects() {
        for (const i in this._slotsObject) {
            const slotAttachment = this._slotsObject[i];
            if (!slotAttachment)
                continue;
            this.updateSlotObject(slotAttachment);
        }
    }
    updateSlotObject(slotAttachment) {
        const { slot, container } = slotAttachment;
        const followAttachmentValue = slotAttachment.followAttachmentTimeline ? Boolean(slot.attachment) : true;
        container.visible = this.skeleton.drawOrder.includes(slot) && followAttachmentValue;
        if (container.visible) {
            const bone = slot.bone;
            container.position.set(bone.worldX, bone.worldY);
            container.scale.x = bone.getWorldScaleX();
            container.scale.y = bone.getWorldScaleY();
            container.rotation = bone.getWorldRotationX() * DEG_TO_RAD;
            container.alpha = this.skeleton.color.a * slot.color.a;
        }
    }
    /** @internal */
    _getCachedData(slot, attachment) {
        return this.attachmentCacheData[slot.data.index][attachment.name] || this.initCachedData(slot, attachment);
    }
    initCachedData(slot, attachment) {
        let vertices;
        if (attachment instanceof RegionAttachment) {
            vertices = new Float32Array(8);
            this.attachmentCacheData[slot.data.index][attachment.name] = {
                id: `${slot.data.index}-${attachment.name}`,
                vertices,
                clipped: false,
                indices: [0, 1, 2, 0, 2, 3],
                uvs: new Float32Array(attachment.uvs.length),
                color: new Color(1, 1, 1, 1),
                darkColor: new Color(0, 0, 0, 0),
                darkTint: this.darkTint,
                skipRender: false,
                texture: attachment.region?.texture.texture,
            };
        }
        else {
            vertices = new Float32Array(attachment.worldVerticesLength);
            this.attachmentCacheData[slot.data.index][attachment.name] = {
                id: `${slot.data.index}-${attachment.name}`,
                vertices,
                clipped: false,
                indices: attachment.triangles,
                uvs: new Float32Array(attachment.uvs.length),
                color: new Color(1, 1, 1, 1),
                darkColor: new Color(0, 0, 0, 0),
                darkTint: this.darkTint,
                skipRender: false,
                texture: attachment.region?.texture.texture,
            };
        }
        return this.attachmentCacheData[slot.data.index][attachment.name];
    }
    onViewUpdate() {
        // increment from the 12th bit!
        this._didViewChangeTick++;
        if (!this._boundsProvider) {
            this._boundsDirty = true;
        }
        if (this.didViewUpdate)
            return;
        this.didViewUpdate = true;
        const renderGroup = this.renderGroup || this.parentRenderGroup;
        if (renderGroup) {
            renderGroup.onChildViewUpdate(this);
        }
        this.debug?.renderDebug(this);
    }
    /**
     * Attaches a PixiJS container to a specified slot. This will map the world transform of the slots bone
     * to the attached container. A container can only be attached to one slot at a time.
     *
     * @param container - The container to attach to the slot
     * @param slotRef - The slot id or  slot to attach to
     * @param options - Optional settings for the attachment.
     * @param options.followAttachmentTimeline - If true, the attachment will follow the slot's attachment timeline.
     */
    addSlotObject(slot, container, options) {
        slot = this.getSlotFromRef(slot);
        // need to check in on the container too...
        for (const i in this._slotsObject) {
            if (this._slotsObject[i]?.container === container) {
                this.removeSlotObject(this._slotsObject[i].slot);
            }
        }
        this.removeSlotObject(slot);
        container.includeInBuild = false;
        // TODO only add once??
        this.addChild(container);
        const slotObject = {
            container,
            slot,
            followAttachmentTimeline: options?.followAttachmentTimeline || false,
        };
        this._slotsObject[slot.data.name] = slotObject;
        this.updateSlotObject(slotObject);
    }
    /**
     * Removes a PixiJS container from the slot it is attached to.
     *
     * @param container - The container to detach from the slot
     * @param slotOrContainer - The container, slot id or slot to detach from
     */
    removeSlotObject(slotOrContainer) {
        let containerToRemove;
        if (slotOrContainer instanceof Container) {
            for (const i in this._slotsObject) {
                if (this._slotsObject[i]?.container === slotOrContainer) {
                    this._slotsObject[i] = null;
                    containerToRemove = slotOrContainer;
                    break;
                }
            }
        }
        else {
            const slot = this.getSlotFromRef(slotOrContainer);
            containerToRemove = this._slotsObject[slot.data.name]?.container;
            this._slotsObject[slot.data.name] = null;
        }
        if (containerToRemove) {
            this.removeChild(containerToRemove);
            containerToRemove.includeInBuild = true;
        }
    }
    /**
     * Removes all PixiJS containers attached to any slot.
     */
    removeSlotObjects() {
        Object.entries(this._slotsObject).forEach(([slotName, slotObject]) => {
            if (slotObject)
                slotObject.container.removeFromParent();
            delete this._slotsObject[slotName];
        });
    }
    /**
     * Returns a container attached to a slot, or undefined if no container is attached.
     *
     * @param slotRef - The slot id or slot to get the attachment from
     * @returns - The container attached to the slot
     */
    getSlotObject(slot) {
        slot = this.getSlotFromRef(slot);
        return this._slotsObject[slot.data.name]?.container;
    }
    updateBounds() {
        this._boundsDirty = false;
        this.skeletonBounds ||= new SkeletonBounds();
        const skeletonBounds = this.skeletonBounds;
        skeletonBounds.update(this.skeleton, true);
        if (this._boundsProvider) {
            const boundsSpine = this._boundsProvider.calculateBounds(this);
            const bounds = this._bounds;
            bounds.clear();
            bounds.x = boundsSpine.x;
            bounds.y = boundsSpine.y;
            bounds.width = boundsSpine.width;
            bounds.height = boundsSpine.height;
        }
        else if (skeletonBounds.minX === Infinity) {
            if (this.hasNeverUpdated) {
                this._updateAndApplyState(0);
                this._boundsDirty = false;
            }
            this._validateAndTransformAttachments();
            const drawOrder = this.skeleton.drawOrder;
            const bounds = this._bounds;
            bounds.clear();
            for (let i = 0; i < drawOrder.length; i++) {
                const slot = drawOrder[i];
                const attachment = slot.getAttachment();
                if (attachment && (attachment instanceof RegionAttachment || attachment instanceof MeshAttachment)) {
                    const cacheData = this._getCachedData(slot, attachment);
                    bounds.addVertexData(cacheData.vertices, 0, cacheData.vertices.length);
                }
            }
        }
        else {
            this._bounds.minX = skeletonBounds.minX;
            this._bounds.minY = skeletonBounds.minY;
            this._bounds.maxX = skeletonBounds.maxX;
            this._bounds.maxY = skeletonBounds.maxY;
        }
    }
    /** @internal */
    addBounds(bounds) {
        bounds.addBounds(this.bounds);
    }
    /**
     * Destroys this sprite renderable and optionally its texture.
     * @param options - Options parameter. A boolean will act as if all options
     *  have been set to that value
     * @param {boolean} [options.texture=false] - Should it destroy the current texture of the renderable as well
     * @param {boolean} [options.textureSource=false] - Should it destroy the textureSource of the renderable as well
     */
    destroy(options = false) {
        super.destroy(options);
        Ticker.shared.remove(this.internalUpdate, this);
        this.state.clearListeners();
        this.debug = undefined;
        this.skeleton = null;
        this.state = null;
        this._slotsObject = null;
        this._lastAttachments.length = 0;
        this.attachmentCacheData = null;
    }
    /** Converts a point from the skeleton coordinate system to the Pixi world coordinate system. */
    skeletonToPixiWorldCoordinates(point) {
        this.worldTransform.apply(point, point);
    }
    /** Converts a point from the Pixi world coordinate system to the skeleton coordinate system. */
    pixiWorldCoordinatesToSkeleton(point) {
        this.worldTransform.applyInverse(point, point);
    }
    /** Converts a point from the Pixi world coordinate system to the bone's local coordinate system. */
    pixiWorldCoordinatesToBone(point, bone) {
        this.pixiWorldCoordinatesToSkeleton(point);
        if (bone.parent) {
            bone.parent.worldToLocal(point);
        }
        else {
            bone.worldToLocal(point);
        }
    }
    /**
     * Use this method to instantiate a Spine game object.
     * Before instantiating a Spine game object, the skeleton (`.skel` or `.json`) and the atlas text files must be loaded into the Assets. For example:
     * ```
     * PIXI.Assets.add("sackData", "./assets/sack-pro.skel");
     * PIXI.Assets.add("sackAtlas", "./assets/sack-pma.atlas");
     * await PIXI.Assets.load(["sackData", "sackAtlas"]);
     * ```
     * Once a Spine game object is created, its skeleton data is cached into {@link Cache} using the key:
     * `${skeletonAssetName}-${atlasAssetName}-${options?.scale ?? 1}`
     *
     * @param options - Options to configure the Spine game object. See {@link SpineFromOptions}
     * @returns {Spine} The Spine game object instantiated
     */
    static from({ skeleton, atlas, scale = 1, darkTint, autoUpdate = true, boundsProvider }) {
        const cacheKey = `${skeleton}-${atlas}-${scale}`;
        if (Cache.has(cacheKey)) {
            return new Spine({
                skeletonData: Cache.get(cacheKey),
                darkTint,
                autoUpdate,
                boundsProvider,
            });
        }
        const skeletonAsset = Assets.get(skeleton);
        const atlasAsset = Assets.get(atlas);
        const attachmentLoader = new AtlasAttachmentLoader(atlasAsset);
        const parser = skeletonAsset instanceof Uint8Array
            ? new SkeletonBinary(attachmentLoader)
            : new SkeletonJson(attachmentLoader);
        parser.scale = scale;
        const skeletonData = parser.readSkeletonData(skeletonAsset);
        Cache.set(cacheKey, skeletonData);
        return new Spine({
            skeletonData,
            darkTint,
            autoUpdate,
            boundsProvider,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3BpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvU3BpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRS9FLE9BQU8sRUFDTixNQUFNLEVBRU4sS0FBSyxFQUNMLFNBQVMsRUFFVCxVQUFVLEVBRVYsUUFBUSxFQUNSLFFBQVEsRUFFUixPQUFPLEVBQ1AsTUFBTSxFQUNOLGFBQWEsR0FDYixNQUFNLFNBQVMsQ0FBQztBQUVqQixPQUFPLEVBQ04sY0FBYyxFQUNkLGtCQUFrQixFQUNsQixxQkFBcUIsRUFHckIsa0JBQWtCLEVBQ2xCLEtBQUssRUFDTCxjQUFjLEVBQ2QsT0FBTyxFQUNQLElBQUksRUFDSixnQkFBZ0IsRUFDaEIsUUFBUSxFQUNSLGNBQWMsRUFDZCxjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLFlBQVksRUFDWixZQUFZLEVBQ1osSUFBSSxFQUlKLE9BQU8sR0FDUCxNQUFNLDhCQUE4QixDQUFDO0FBMkJyQyxDQUFDO0FBRUYsTUFBTSxTQUFTLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUVoQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztBQUV0QixNQUFNLE9BQU8sR0FBRyxJQUFJLGdCQUFnQixFQUFFLENBQUM7QUFhdkMsc0VBQXNFO0FBQ3RFLE1BQU0sT0FBTywyQkFBMkI7SUFFOUI7SUFDQTtJQUNBO0lBQ0E7SUFKVCxZQUNTLENBQVMsRUFDVCxDQUFTLEVBQ1QsS0FBYSxFQUNiLE1BQWM7UUFIZCxNQUFDLEdBQUQsQ0FBQyxDQUFRO1FBQ1QsTUFBQyxHQUFELENBQUMsQ0FBUTtRQUNULFVBQUssR0FBTCxLQUFLLENBQVE7UUFDYixXQUFNLEdBQU4sTUFBTSxDQUFRO0lBQ25CLENBQUM7SUFDTCxlQUFlO1FBQ2QsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FB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TUFBTSxnQkFBZ0IsR0FBRyxJQUFJLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sTUFBTSxHQUFHLGFBQWEsWUFBWSxVQUFVO1lBQ2pELENBQUMsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQztZQUN0QyxDQUFDLENBQUMsSUFBSSxZQUFZLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUV0QyxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNyQixNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFNUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFbEMsT0FBTyxJQUFJLEtBQUssQ0FBQztZQUNoQixZQUFZO1lBQ1osUUFBUTtZQUNSLFVBQVU7WUFDVixjQUFjO1NBQ2QsQ0FBQyxDQUFDO0lBQ0osQ0FBQztDQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIFNwaW5lIFJ1bnRpbWVzIExpY2Vuc2UgQWdyZWVtZW50XG4gKiBMYXN0IHVwZGF0ZWQgSnVseSAyOCwgMjAyMy4gUmVwbGFjZXMgYWxsIHByaW9yIHZlcnNpb25zLlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDIzLCBFc290ZXJpYyBTb2Z0d2FyZSBMTENcbiAqXG4gKiBJbnRlZ3JhdGlvbiBvZiB0aGUgU3BpbmUgUnVudGltZXMgaW50byBzb2Z0d2FyZSBvciBvdGhlcndpc2UgY3JlYXRpbmdcbiAqIGRlcml2YXRpdmUgd29ya3Mgb2YgdGhlIFNwaW5lIFJ1bnRpbWVzIGlzIHBlcm1pdHRlZCB1bmRlciB0aGUgdGVybXMgYW5kXG4gKiBjb25kaXRpb25zIG9mIFNlY3Rpb24gMiBvZiB0aGUgU3BpbmUgRWRpdG9yIExpY2Vuc2UgQWdyZWVtZW50OlxuICogaHR0cDovL2Vzb3Rlcmljc29mdHdhcmUuY29tL3NwaW5lLWVkaXRvci1saWNlbnNlXG4gKlxuICogT3RoZXJ3aXNlLCBpdCBpcyBwZXJtaXR0ZWQgdG8gaW50ZWdyYXRlIHRoZSBTcGluZSBSdW50aW1lcyBpbnRvIHNvZnR3YXJlIG9yXG4gKiBvdGhlcndpc2UgY3JlYXRlIGRlcml2YXRpdmUgd29ya3Mgb2YgdGhlIFNwaW5lIFJ1bnRpbWVzIChjb2xsZWN0aXZlbHksXG4gKiBcIlByb2R1Y3RzXCIpLCBwcm92aWRlZCB0aGF0IGVhY2ggdXNlciBvZiB0aGUgUHJvZHVjdHMgbXVzdCBvYnRhaW4gdGhlaXIgb3duXG4gKiBTcGluZSBFZGl0b3IgbGljZW5zZSBhbmQgcmVkaXN0cmlidXRpb24gb2YgdGhlIFByb2R1Y3RzIGluIGFueSBmb3JtIG11c3RcbiAqIGluY2x1ZGUgdGhpcyBsaWNlbnNlIGFuZCBjb3B5cmlnaHQgbm90aWNlLlxuICpcbiAqIFRIRSBTUElORSBSVU5USU1FUyBBUkUgUFJPVklERUQgQlkgRVNPVEVSSUMgU09GVFdBUkUgTExDIFwiQVMgSVNcIiBBTkQgQU5ZXG4gKiBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEXG4gKiBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFXG4gKiBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBFU09URVJJQyBTT0ZUV0FSRSBMTEMgQkUgTElBQkxFIEZPUiBBTllcbiAqIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTXG4gKiAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVMsXG4gKiBCVVNJTkVTUyBJTlRFUlJVUFRJT04sIE9SIExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAqIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gKiAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhFXG4gKiBTUElORSBSVU5USU1FUywgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuaW1wb3J0IHtcblx0QXNzZXRzLFxuXHRCb3VuZHMsXG5cdENhY2hlLFxuXHRDb250YWluZXIsXG5cdENvbnRhaW5lck9wdGlvbnMsXG5cdERFR19UT19SQUQsXG5cdERlc3Ryb3lPcHRpb25zLFxuXHRmYXN0Q29weSxcblx0R3JhcGhpY3MsXG5cdFBvaW50RGF0YSxcblx0VGV4dHVyZSxcblx0VGlja2VyLFxuXHRWaWV3Q29udGFpbmVyLFxufSBmcm9tICdwaXhpLmpzJztcbmltcG9ydCB7IElTcGluZURlYnVnUmVuZGVyZXIgfSBmcm9tICcuL1NwaW5lRGVidWdSZW5kZXJlci5qcyc7XG5pbXBvcnQge1xuXHRBbmltYXRpb25TdGF0ZSxcblx0QW5pbWF0aW9uU3RhdGVEYXRhLFxuXHRBdGxhc0F0dGFjaG1lbnRMb2FkZXIsXG5cdEF0dGFjaG1lbnQsXG5cdEJvbmUsXG5cdENsaXBwaW5nQXR0YWNobWVudCxcblx0Q29sb3IsXG5cdE1lc2hBdHRhY2htZW50LFxuXHRQaHlzaWNzLFxuXHRQb29sLFxuXHRSZWdpb25BdHRhY2htZW50LFxuXHRTa2VsZXRvbixcblx0U2tlbGV0b25CaW5hcnksXG5cdFNrZWxldG9uQm91bmRzLFxuXHRTa2VsZXRvbkNsaXBwaW5nLFxuXHRTa2VsZXRvbkRhdGEsXG5cdFNrZWxldG9uSnNvbixcblx0U2tpbixcblx0U2xvdCxcblx0dHlwZSBUZXh0dXJlQXRsYXMsXG5cdFRyYWNrRW50cnksXG5cdFZlY3RvcjIsXG59IGZyb20gJ0Blc290ZXJpY3NvZnR3YXJlL3NwaW5lLWNvcmUnO1xuXG4vKipcbiAqIE9wdGlvbnMgdG8gY3JlYXRlIGEge0BsaW5rIFNwaW5lfSB1c2luZyB7QGxpbmsgU3BpbmUuZnJvbX0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3BpbmVGcm9tT3B0aW9ucyB7XG5cdC8qKiB0aGUgYXNzZXQgbmFtZSBmb3IgdGhlIHNrZWxldG9uIGAuc2tlbGAgb3IgYC5qc29uYCBmaWxlIHByZXZpb3VzbHkgbG9hZGVkIGludG8gdGhlIEFzc2V0cyAqL1xuXHRza2VsZXRvbjogc3RyaW5nO1xuXG5cdC8qKiB0aGUgYXNzZXQgbmFtZSBmb3IgdGhlIGF0bGFzIGZpbGUgcHJldmlvdXNseSBsb2FkZWQgaW50byB0aGUgQXNzZXRzICovXG5cdGF0bGFzOiBzdHJpbmc7XG5cblx0LyoqICBUaGUgdmFsdWUgcGFzc2VkIHRvIHRoZSBza2VsZXRvbiByZWFkZXIuIElmIG9taXR0ZWQsIDEgaXMgcGFzc2VkLiBTZWUge0BsaW5rIFNrZWxldG9uQmluYXJ5LnNjYWxlfSBmb3IgZGV0YWlscy4gKi9cblx0c2NhbGU/OiBudW1iZXI7XG5cblx0LyoqICBTZXQgdGhlIHtAbGluayBTcGluZS5hdXRvVXBkYXRlfSB2YWx1ZS4gSWYgb21pdHRlZCwgaXQgaXMgc2V0IHRvIGB0cnVlYC4gKi9cblx0YXV0b1VwZGF0ZT86IGJvb2xlYW47XG5cblx0LyoqXG5cdCAqIElmIGB0cnVlYCwgdXNlIHRoZSBkYXJrIHRpbnQgcmVuZGVyZXIgdG8gcmVuZGVyIHRoZSBza2VsZXRvblxuXHQgKiBJZiBgZmFsc2VgLCB1c2UgdGhlIGRlZmF1bHQgcGl4aSByZW5kZXJlciB0byByZW5kZXIgdGhlIHNrZWxldG9uXG5cdCAqIElmIGB1bmRlZmluZWRgLCB1c2UgdGhlIGRhcmsgdGludCByZW5kZXJlciBpZiBhdCBsZWFzdCBvbmUgc2xvdCBoYXMgdGludCBibGFja1xuXHQgKi9cblx0ZGFya1RpbnQ/OiBib29sZWFuO1xuXG5cdC8qKiBUaGUgYm91bmRzIHByb3ZpZGVyIHRvIHVzZS4gSWYgdW5kZWZpbmVkIHRoZSBib3VuZHMgd2lsbCBiZSBkeW5hbWljLCBjYWxjdWxhdGVkIHdoZW4gcmVxdWVzdGVkIGFuZCBiYXNlZCBvbiB0aGUgY3VycmVudCBmcmFtZS4gKi9cblx0Ym91bmRzUHJvdmlkZXI/OiBTcGluZUJvdW5kc1Byb3ZpZGVyLFxufTtcblxuY29uc3QgdmVjdG9yQXV4ID0gbmV3IFZlY3RvcjIoKTtcblxuU2tlbGV0b24ueURvd24gPSB0cnVlO1xuXG5jb25zdCBjbGlwcGVyID0gbmV3IFNrZWxldG9uQ2xpcHBpbmcoKTtcblxuLyoqIEEgYm91bmRzIHByb3ZpZGVyIGNhbGN1bGF0ZXMgdGhlIGJvdW5kaW5nIGJveCBmb3IgYSBza2VsZXRvbiwgd2hpY2ggaXMgdGhlbiBhc3NpZ25lZCBhcyB0aGUgc2l6ZSBvZiB0aGUgU3BpbmVHYW1lT2JqZWN0LiAqL1xuZXhwb3J0IGludGVyZmFjZSBTcGluZUJvdW5kc1Byb3ZpZGVyIHtcblx0LyoqIFJldHVybnMgdGhlIGJvdW5kaW5nIGJveCBmb3IgdGhlIHNrZWxldG9uLCBpbiBza2VsZXRvbiBzcGFjZS4gKi9cblx0Y2FsY3VsYXRlQm91bmRzIChnYW1lT2JqZWN0OiBTcGluZSk6IHtcblx0XHR4OiBudW1iZXI7XG5cdFx0eTogbnVtYmVyO1xuXHRcdHdpZHRoOiBudW1iZXI7XG5cdFx0aGVpZ2h0OiBudW1iZXI7XG5cdH07XG59XG5cbi8qKiBBIGJvdW5kcyBwcm92aWRlciB0aGF0IHByb3ZpZGVzIGEgZml4ZWQgc2l6ZSBnaXZlbiBieSB0aGUgdXNlci4gKi9cbmV4cG9ydCBjbGFzcyBBQUJCUmVjdGFuZ2xlQm91bmRzUHJvdmlkZXIgaW1wbGVtZW50cyBTcGluZUJvdW5kc1Byb3ZpZGVyIHtcblx0Y29uc3RydWN0b3IgKFxuXHRcdHByaXZhdGUgeDogbnVtYmVyLFxuXHRcdHByaXZhdGUgeTogbnVtYmVyLFxuXHRcdHByaXZhdGUgd2lkdGg6IG51bWJlcixcblx0XHRwcml2YXRlIGhlaWdodDogbnVtYmVyLFxuXHQpIHsgfVxuXHRjYWxjdWxhdGVCb3VuZHMgKCkge1xuXHRcdHJldHVybiB7IHg6IHRoaXMueCwgeTogdGhpcy55LCB3aWR0aDogdGhpcy53aWR0aCwgaGVpZ2h0OiB0aGlzLmhlaWdodCB9O1xuXHR9XG59XG5cbi8qKiBBIGJvdW5kcyBwcm92aWRlciB0aGF0IGNhbGN1bGF0ZXMgdGhlIGJvdW5kaW5nIGJveCBmcm9tIHRoZSBzZXR1cCBwb3NlLiAqL1xuZXhwb3J0IGNsYXNzIFNldHVwUG9zZUJvdW5kc1Byb3ZpZGVyIGltcGxlbWVudHMgU3BpbmVCb3VuZHNQcm92aWRlciB7XG5cdC8qKlxuXHQgKiBAcGFyYW0gY2xpcHBpbmcgSWYgdHJ1ZSwgY2xpcHBpbmcgYXR0YWNobWVudHMgYXJlIHVzZWQgdG8gY29tcHV0ZSB0aGUgYm91bmRzLiBGYWxzZSwgYnkgZGVmYXVsdC5cblx0ICovXG5cdGNvbnN0cnVjdG9yIChcblx0XHRwcml2YXRlIGNsaXBwaW5nID0gZmFsc2UsXG5cdCkgeyB9XG5cblx0Y2FsY3VsYXRlQm91bmRzIChnYW1lT2JqZWN0OiBTcGluZSkge1xuXHRcdGlmICghZ2FtZU9iamVjdC5za2VsZXRvbikgcmV0dXJuIHsgeDogMCwgeTogMCwgd2lkdGg6IDAsIGhlaWdodDogMCB9O1xuXHRcdC8vIE1ha2UgYSBjb3B5IG9mIGFuaW1hdGlvbiBzdGF0ZSBhbmQgc2tlbGV0b24gYXMgdGhpcyBtaWdodCBiZSBjYWxsZWQgd2hpbGVcblx0XHQvLyB0aGUgc2tlbGV0b24gaW4gdGhlIEdhbWVPYmplY3QgaGFzIGFscmVhZHkgYmVlbiBoZWF2aWx5IG1vZGlmaWVkLiBXZSBjYW4gbm90XG5cdFx0Ly8gcmVjb25zdHJ1Y3QgdGhhdCBzdGF0ZS5cblx0XHRjb25zdCBza2VsZXRvbiA9IG5ldyBTa2VsZXRvbihnYW1lT2JqZWN0LnNrZWxldG9uLmRhdGEpO1xuXHRcdHNrZWxldG9uLnNldFRvU2V0dXBQb3NlKCk7XG5cdFx0c2tlbGV0b24udXBkYXRlV29ybGRUcmFuc2Zvcm0oUGh5c2ljcy51cGRhdGUpO1xuXHRcdGNvbnN0IGJvdW5kcyA9IHNrZWxldG9uLmdldEJvdW5kc1JlY3QodGhpcy5jbGlwcGluZyA/IG5ldyBTa2VsZXRvbkNsaXBwaW5nKCkgOiB1bmRlZmluZWQpO1xuXHRcdHJldHVybiBib3VuZHMud2lkdGggPT0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZXG5cdFx0XHQ/IHsgeDogMCwgeTogMCwgd2lkdGg6IDAsIGhlaWdodDogMCB9XG5cdFx0XHQ6IGJvdW5kcztcblx0fVxufVxuXG4vKiogQSBib3VuZHMgcHJvdmlkZXIgdGhhdCBjYWxjdWxhdGVzIHRoZSBib3VuZGluZyBib3ggYnkgdGFraW5nIHRoZSBtYXhpbXVtZyBib3VuZGluZyBib3ggZm9yIGEgY29tYmluYXRpb24gb2Ygc2tpbnMgYW5kIHNwZWNpZmljIGFuaW1hdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBTa2luc0FuZEFuaW1hdGlvbkJvdW5kc1Byb3ZpZGVyXG5cdGltcGxlbWVudHMgU3BpbmVCb3VuZHNQcm92aWRlciB7XG5cdC8qKlxuXHQgKiBAcGFyYW0gYW5pbWF0aW9uIFRoZSBhbmltYXRpb24gdG8gdXNlIGZvciBjYWxjdWxhdGluZyB0aGUgYm91bmRzLiBJZiBudWxsLCB0aGUgc2V0dXAgcG9zZSBpcyB1c2VkLlxuXHQgKiBAcGFyYW0gc2tpbnMgVGhlIHNraW5zIHRvIHVzZSBmb3IgY2FsY3VsYXRpbmcgdGhlIGJvdW5kcy4gSWYgZW1wdHksIHRoZSBkZWZhdWx0IHNraW4gaXMgdXNlZC5cblx0ICogQHBhcmFtIHRpbWVTdGVwIFRoZSB0aW1lIHN0ZXAgdG8gdXNlIGZvciBjYWxjdWxhdGluZyB0aGUgYm91bmRzLiBBIHNtYWxsZXIgdGltZSBzdGVwIG1lYW5zIG1vcmUgcHJlY2lzaW9uLCBidXQgc2xvd2VyIGNhbGN1bGF0aW9uLlxuXHQgKiBAcGFyYW0gY2xpcHBpbmcgSWYgdHJ1ZSwgY2xpcHBpbmcgYXR0YWNobWVudHMgYXJlIHVzZWQgdG8gY29tcHV0ZSB0aGUgYm91bmRzLiBGYWxzZSwgYnkgZGVmYXVsdC5cblx0ICovXG5cdGNvbnN0cnVjdG9yIChcblx0XHRwcml2YXRlIGFuaW1hdGlvbjogc3RyaW5nIHwgbnVsbCxcblx0XHRwcml2YXRlIHNraW5zOiBzdHJpbmdbXSA9IFtdLFxuXHRcdHByaXZhdGUgdGltZVN0ZXA6IG51bWJlciA9IDAuMDUsXG5cdFx0cHJpdmF0ZSBjbGlwcGluZyA9IGZhbHNlLFxuXHQpIHsgfVxuXG5cdGNhbGN1bGF0ZUJvdW5kcyAoZ2FtZU9iamVjdDogU3BpbmUpOiB7XG5cdFx0eDogbnVtYmVyO1xuXHRcdHk6IG51bWJlcjtcblx0XHR3aWR0aDogbnVtYmVyO1xuXHRcdGhlaWdodDogbnVtYmVyO1xuXHR9IHtcblx0XHRpZiAoIWdhbWVPYmplY3Quc2tlbGV0b24gfHwgIWdhbWVPYmplY3Quc3RhdGUpXG5cdFx0XHRyZXR1cm4geyB4OiAwLCB5OiAwLCB3aWR0aDogMCwgaGVpZ2h0OiAwIH07XG5cdFx0Ly8gTWFrZSBhIGNvcHkgb2YgYW5pbWF0aW9uIHN0YXRlIGFuZCBza2VsZXRvbiBhcyB0aGlzIG1pZ2h0IGJlIGNhbGxlZCB3aGlsZVxuXHRcdC8vIHRoZSBza2VsZXRvbiBpbiB0aGUgR2FtZU9iamVjdCBoYXMgYWxyZWFkeSBiZWVuIGhlYXZpbHkgbW9kaWZpZWQuIFdlIGNhbiBub3Rcblx0XHQvLyByZWNvbnN0cnVjdCB0aGF0IHN0YXRlLlxuXHRcdGNvbnN0IGFuaW1hdGlvblN0YXRlID0gbmV3IEFuaW1hdGlvblN0YXRlKGdhbWVPYmplY3Quc3RhdGUuZGF0YSk7XG5cdFx0Y29uc3Qgc2tlbGV0b24gPSBuZXcgU2tlbGV0b24oZ2FtZU9iamVjdC5za2VsZXRvbi5kYXRhKTtcblx0XHRjb25zdCBjbGlwcGVyID0gdGhpcy5jbGlwcGluZyA/IG5ldyBTa2VsZXRvbkNsaXBwaW5nKCkgOiB1bmRlZmluZWQ7XG5cdFx0Y29uc3QgZGF0YSA9IHNrZWxldG9uLmRhdGE7XG5cdFx0aWYgKHRoaXMuc2tpbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0bGV0IGN1c3RvbVNraW4gPSBuZXcgU2tpbihcImN1c3RvbS1za2luXCIpO1xuXHRcdFx0Zm9yIChjb25zdCBza2luTmFtZSBvZiB0aGlzLnNraW5zKSB7XG5cdFx0XHRcdGNvbnN0IHNraW4gPSBkYXRhLmZpbmRTa2luKHNraW5OYW1lKTtcblx0XHRcdFx0aWYgKHNraW4gPT0gbnVsbCkgY29udGludWU7XG5cdFx0XHRcdGN1c3RvbVNraW4uYWRkU2tpbihza2luKTtcblx0XHRcdH1cblx0XHRcdHNrZWxldG9uLnNldFNraW4oY3VzdG9tU2tpbik7XG5cdFx0fVxuXHRcdHNrZWxldG9uLnNldFRvU2V0dXBQb3NlKCk7XG5cblx0XHRjb25zdCBhbmltYXRpb24gPSB0aGlzLmFuaW1hdGlvbiAhPSBudWxsID8gZGF0YS5maW5kQW5pbWF0aW9uKHRoaXMuYW5pbWF0aW9uISkgOiBudWxsO1xuXG5cdFx0aWYgKGFuaW1hdGlvbiA9PSBudWxsKSB7XG5cdFx0XHRza2VsZXRvbi51cGRhdGVXb3JsZFRyYW5zZm9ybShQaHlzaWNzLnVwZGF0ZSk7XG5cdFx0XHRjb25zdCBib3VuZHMgPSBza2VsZXRvbi5nZXRCb3VuZHNSZWN0KGNsaXBwZXIpO1xuXHRcdFx0cmV0dXJuIGJvdW5kcy53aWR0aCA9PSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFlcblx0XHRcdFx0PyB7IHg6IDAsIHk6IDAsIHdpZHRoOiAwLCBoZWlnaHQ6IDAgfVxuXHRcdFx0XHQ6IGJvdW5kcztcblx0XHR9IGVsc2Uge1xuXHRcdFx0bGV0IG1pblggPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG5cdFx0XHRcdG1pblkgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG5cdFx0XHRcdG1heFggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXG5cdFx0XHRcdG1heFkgPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XG5cdFx0XHRhbmltYXRpb25TdGF0ZS5jbGVhclRyYWNrcygpO1xuXHRcdFx0YW5pbWF0aW9uU3RhdGUuc2V0QW5pbWF0aW9uV2l0aCgwLCBhbmltYXRpb24sIGZhbHNlKTtcblx0XHRcdGNvbnN0IHN0ZXBzID0gTWF0aC5tYXgoYW5pbWF0aW9uLmR1cmF0aW9uIC8gdGhpcy50aW1lU3RlcCwgMS4wKTtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgc3RlcHM7IGkrKykge1xuXHRcdFx0XHRjb25zdCBkZWx0YSA9IGkgPiAwID8gdGhpcy50aW1lU3RlcCA6IDA7XG5cdFx0XHRcdGFuaW1hdGlvblN0YXRlLnVwZGF0ZShkZWx0YSk7XG5cdFx0XHRcdGFuaW1hdGlvblN0YXRlLmFwcGx5KHNrZWxldG9uKTtcblx0XHRcdFx0c2tlbGV0b24udXBkYXRlKGRlbHRhKTtcblx0XHRcdFx0c2tlbGV0b24udXBkYXRlV29ybGRUcmFuc2Zvcm0oUGh5c2ljcy51cGRhdGUpO1xuXG5cdFx0XHRcdGNvbnN0IGJvdW5kcyA9IHNrZWxldG9uLmdldEJvdW5kc1JlY3QoY2xpcHBlcik7XG5cdFx0XHRcdG1pblggPSBNYXRoLm1pbihtaW5YLCBib3VuZHMueCk7XG5cdFx0XHRcdG1pblkgPSBNYXRoLm1pbihtaW5ZLCBib3VuZHMueSk7XG5cdFx0XHRcdG1heFggPSBNYXRoLm1heChtYXhYLCBib3VuZHMueCArIGJvdW5kcy53aWR0aCk7XG5cdFx0XHRcdG1heFkgPSBNYXRoLm1heChtYXhZLCBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQpO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3QgYm91bmRzID0ge1xuXHRcdFx0XHR4OiBtaW5YLFxuXHRcdFx0XHR5OiBtaW5ZLFxuXHRcdFx0XHR3aWR0aDogbWF4WCAtIG1pblgsXG5cdFx0XHRcdGhlaWdodDogbWF4WSAtIG1pblksXG5cdFx0XHR9O1xuXHRcdFx0cmV0dXJuIGJvdW5kcy53aWR0aCA9PSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFlcblx0XHRcdFx0PyB7IHg6IDAsIHk6IDAsIHdpZHRoOiAwLCBoZWlnaHQ6IDAgfVxuXHRcdFx0XHQ6IGJvdW5kcztcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTcGluZU9wdGlvbnMgZXh0ZW5kcyBDb250YWluZXJPcHRpb25zIHtcblx0LyoqIHRoZSB7QGxpbmsgU2tlbGV0b25EYXRhfSB1c2VkIHRvIGluc3RhbnRpYXRlIHRoZSBza2VsZXRvbiAqL1xuXHRza2VsZXRvbkRhdGE6IFNrZWxldG9uRGF0YTtcblxuXHQvKiogIFNlZSB7QGxpbmsgU3BpbmVGcm9tT3B0aW9ucy5hdXRvVXBkYXRlfS4gKi9cblx0YXV0b1VwZGF0ZT86IGJvb2xlYW47XG5cblx0LyoqICBTZWUge0BsaW5rIFNwaW5lRnJvbU9wdGlvbnMuZGFya1RpbnR9LiAqL1xuXHRkYXJrVGludD86IGJvb2xlYW47XG5cblx0LyoqICBTZWUge0BsaW5rIFNwaW5lRnJvbU9wdGlvbnMuYm91bmRzUHJvdmlkZXJ9LiAqL1xuXHRib3VuZHNQcm92aWRlcj86IFNwaW5lQm91bmRzUHJvdmlkZXIsXG59XG5cbi8qKlxuICogQW5pbWF0aW9uU3RhdGVMaXN0ZW5lciB7QGxpbmsgaHR0cHM6Ly9lbi5lc290ZXJpY3NvZnR3YXJlLmNvbS9zcGluZS1hcGktcmVmZXJlbmNlI0FuaW1hdGlvblN0YXRlTGlzdGVuZXIgZXZlbnRzfSBleHBvc2VkIGZvciBQaXhpLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNwaW5lRXZlbnRzIHtcblx0Y29tcGxldGU6IFt0cmFja0VudHJ5OiBUcmFja0VudHJ5XTtcblx0ZGlzcG9zZTogW3RyYWNrRW50cnk6IFRyYWNrRW50cnldO1xuXHRlbmQ6IFt0cmFja0VudHJ5OiBUcmFja0VudHJ5XTtcblx0ZXZlbnQ6IFt0cmFja0VudHJ5OiBUcmFja0VudHJ5LCBldmVudDogRXZlbnRdO1xuXHRpbnRlcnJ1cHQ6IFt0cmFja0VudHJ5OiBUcmFja0VudHJ5XTtcblx0c3RhcnQ6IFt0cmFja0VudHJ5OiBUcmFja0VudHJ5XTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBdHRhY2htZW50Q2FjaGVEYXRhIHtcblx0aWQ6IHN0cmluZztcblx0Y2xpcHBlZDogYm9vbGVhbjtcblx0dmVydGljZXM6IEZsb2F0MzJBcnJheTtcblx0dXZzOiBGbG9hdDMyQXJyYXk7XG5cdGluZGljZXM6IG51bWJlcltdO1xuXHRjb2xvcjogQ29sb3I7XG5cdGRhcmtDb2xvcjogQ29sb3I7XG5cdGRhcmtUaW50OiBib29sZWFuO1xuXHRza2lwUmVuZGVyOiBib29sZWFuO1xuXHR0ZXh0dXJlOiBUZXh0dXJlO1xuXHRjbGlwcGVkRGF0YT86IHtcblx0XHR2ZXJ0aWNlczogRmxvYXQzMkFycmF5O1xuXHRcdHV2czogRmxvYXQzMkFycmF5O1xuXHRcdGluZGljZXM6IFVpbnQxNkFycmF5O1xuXHRcdHZlcnRleENvdW50OiBudW1iZXI7XG5cdFx0aW5kaWNlc0NvdW50OiBudW1iZXI7XG5cdH07XG59XG5cbmludGVyZmFjZSBTbG90c1RvQ2xpcHBpbmcge1xuXHRzbG90OiBTbG90LFxuXHRtYXNrPzogR3JhcGhpY3MsXG5cdG1hc2tDb21wdXRlZD86IGJvb2xlYW4sXG5cdHZlcnRpY2VzOiBBcnJheTxudW1iZXI+LFxufTtcblxuY29uc3QgbWFza1Bvb2wgPSBuZXcgUG9vbDxHcmFwaGljcz4oKCkgPT4gbmV3IEdyYXBoaWNzKTtcblxuLyoqXG4gKiBUaGUgY2xhc3MgdG8gaW5zdGFudGlhdGUgYSB7QGxpbmsgU3BpbmV9IGdhbWUgb2JqZWN0IGluIFBpeGkuXG4gKiBUaGUgc3RhdGljIG1ldGhvZCB7QGxpbmsgU3BpbmUuZnJvbX0gc2hvdWxkIGJlIHVzZWQgdG8gaW5zdGFudGlhdGUgYSBTcGluZSBnYW1lIG9iamVjdC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNwaW5lIGV4dGVuZHMgVmlld0NvbnRhaW5lciB7XG5cdC8vIFBpeGkgcHJvcGVydGllc1xuXHRwdWJsaWMgYmF0Y2hlZCA9IHRydWU7XG5cdHB1YmxpYyBidWlsZElkID0gMDtcblx0cHVibGljIG92ZXJyaWRlIHJlYWRvbmx5IHJlbmRlclBpcGVJZCA9ICdzcGluZSc7XG5cdHB1YmxpYyBfZGlkU3BpbmVVcGRhdGUgPSBmYWxzZTtcblxuXHRwdWJsaWMgYmVmb3JlVXBkYXRlV29ybGRUcmFuc2Zvcm1zOiAob2JqZWN0OiBTcGluZSkgPT4gdm9pZCA9ICgpID0+IHsgLyoqICovIH07XG5cdHB1YmxpYyBhZnRlclVwZGF0ZVdvcmxkVHJhbnNmb3JtczogKG9iamVjdDogU3BpbmUpID0+IHZvaWQgPSAoKSA9PiB7IC8qKiAqLyB9O1xuXG5cdC8vIFNwaW5lIHByb3BlcnRpZXNcblx0LyoqIFRoZSBza2VsZXRvbiBmb3IgdGhpcyBTcGluZSBnYW1lIG9iamVjdC4gKi9cblx0cHVibGljIHNrZWxldG9uOiBTa2VsZXRvbjtcblx0LyoqIFRoZSBhbmltYXRpb24gc3RhdGUgZm9yIHRoaXMgU3BpbmUgZ2FtZSBvYmplY3QuICovXG5cdHB1YmxpYyBzdGF0ZTogQW5pbWF0aW9uU3RhdGU7XG5cdHB1YmxpYyBza2VsZXRvbkJvdW5kcz86IFNrZWxldG9uQm91bmRzO1xuXG5cdHByaXZhdGUgZGFya1RpbnQgPSBmYWxzZTtcblx0cHJpdmF0ZSBfZGVidWc/OiBJU3BpbmVEZWJ1Z1JlbmRlcmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG5cdHJlYWRvbmx5IF9zbG90c09iamVjdDogUmVjb3JkPHN0cmluZywgeyBzbG90OiBTbG90LCBjb250YWluZXI6IENvbnRhaW5lciwgZm9sbG93QXR0YWNobWVudFRpbWVsaW5lOiBib29sZWFuIH0gfCBudWxsPiA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cdHByaXZhdGUgY2xpcHBpbmdTbG90VG9QaXhpTWFza3M6IFJlY29yZDxzdHJpbmcsIFNsb3RzVG9DbGlwcGluZz4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5cdHByaXZhdGUgZ2V0U2xvdEZyb21SZWYgKHNsb3RSZWY6IG51bWJlciB8IHN0cmluZyB8IFNsb3QpOiBTbG90IHtcblx0XHRsZXQgc2xvdDogU2xvdCB8IG51bGw7XG5cblx0XHRpZiAodHlwZW9mIHNsb3RSZWYgPT09ICdudW1iZXInKSBzbG90ID0gdGhpcy5za2VsZXRvbi5zbG90c1tzbG90UmVmXTtcblx0XHRlbHNlIGlmICh0eXBlb2Ygc2xvdFJlZiA9PT0gJ3N0cmluZycpIHNsb3QgPSB0aGlzLnNrZWxldG9uLmZpbmRTbG90KHNsb3RSZWYpO1xuXHRcdGVsc2Ugc2xvdCA9IHNsb3RSZWY7XG5cblx0XHRpZiAoIXNsb3QpIHRocm93IG5ldyBFcnJvcihgTm8gc2xvdCBmb3VuZCB3aXRoIHRoZSBnaXZlbiBzbG90IHJlZmVyZW5jZTogJHtzbG90UmVmfWApO1xuXG5cdFx0cmV0dXJuIHNsb3Q7XG5cdH1cblxuXHRwdWJsaWMgc3BpbmVBdHRhY2htZW50c0RpcnR5ID0gdHJ1ZTtcblx0cHVibGljIHNwaW5lVGV4dHVyZXNEaXJ0eSA9IHRydWU7XG5cblx0cHJpdmF0ZSBfbGFzdEF0dGFjaG1lbnRzOiBBdHRhY2htZW50W10gPSBbXTtcblxuXHRwcml2YXRlIF9zdGF0ZUNoYW5nZWQgPSB0cnVlO1xuXHRwcml2YXRlIGF0dGFjaG1lbnRDYWNoZURhdGE6IFJlY29yZDxzdHJpbmcsIEF0dGFjaG1lbnRDYWNoZURhdGE+W10gPSBbXTtcblxuXHRwdWJsaWMgZ2V0IGRlYnVnICgpOiBJU3BpbmVEZWJ1Z1JlbmRlcmVyIHwgdW5kZWZpbmVkIHtcblx0XHRyZXR1cm4gdGhpcy5fZGVidWc7XG5cdH1cblxuXHQvKiogUGFzcyBhIHtAbGluayBTcGluZURlYnVnUmVuZGVyZXJ9IG9yIGNyZWF0ZSB5b3VyIG93biB7QGxpbmsgSVNwaW5lRGVidWdSZW5kZXJlcn0gdG8gcmVuZGVyIGJvbmVzLCBtZXNoZXMsIC4uLlxuXHQgKiBAZXhhbXBsZSBzcGluZUdPLmRlYnVnID0gbmV3IFNwaW5lRGVidWdSZW5kZXJlcigpO1xuXHQgKi9cblx0cHVibGljIHNldCBkZWJ1ZyAodmFsdWU6IElTcGluZURlYnVnUmVuZGVyZXIgfCB1bmRlZmluZWQpIHtcblx0XHRpZiAodGhpcy5fZGVidWcpIHtcblx0XHRcdHRoaXMuX2RlYnVnLnVucmVnaXN0ZXJTcGluZSh0aGlzKTtcblx0XHR9XG5cdFx0aWYgKHZhbHVlKSB7XG5cdFx0XHR2YWx1ZS5yZWdpc3RlclNwaW5lKHRoaXMpO1xuXHRcdH1cblx0XHR0aGlzLl9kZWJ1ZyA9IHZhbHVlO1xuXHR9XG5cblx0cHJpdmF0ZSBfYXV0b1VwZGF0ZSA9IHRydWU7XG5cblx0cHVibGljIGdldCBhdXRvVXBkYXRlICgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5fYXV0b1VwZGF0ZTtcblx0fVxuXHQvKiogV2hlbiBgdHJ1ZWAsIHRoZSBTcGluZSBBbmltYXRpb25TdGF0ZSBhbmQgdGhlIFNrZWxldG9uIHdpbGwgYmUgYXV0b21hdGljYWxseSB1cGRhdGVkIHVzaW5nIHRoZSB7QGxpbmsgVGlja2VyLnNoYXJlZH0gaW5zdGFuY2UuICovXG5cdHB1YmxpYyBzZXQgYXV0b1VwZGF0ZSAodmFsdWU6IGJvb2xlYW4pIHtcblx0XHRpZiAodmFsdWUpIHtcblx0XHRcdFRpY2tlci5zaGFyZWQuYWRkKHRoaXMuaW50ZXJuYWxVcGRhdGUsIHRoaXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRUaWNrZXIuc2hhcmVkLnJlbW92ZSh0aGlzLmludGVybmFsVXBkYXRlLCB0aGlzKTtcblx0XHR9XG5cblx0XHR0aGlzLl9hdXRvVXBkYXRlID0gdmFsdWU7XG5cdH1cblxuXHRwcml2YXRlIF9ib3VuZHNQcm92aWRlcj86IFNwaW5lQm91bmRzUHJvdmlkZXI7XG5cdC8qKiBUaGUgYm91bmRzIHByb3ZpZGVyIHRvIHVzZS4gSWYgdW5kZWZpbmVkIHRoZSBib3VuZHMgd2lsbCBiZSBkeW5hbWljLCBjYWxjdWxhdGVkIHdoZW4gcmVxdWVzdGVkIGFuZCBiYXNlZCBvbiB0aGUgY3VycmVudCBmcmFtZS4gKi9cblx0cHVibGljIGdldCBib3VuZHNQcm92aWRlciAoKTogU3BpbmVCb3VuZHNQcm92aWRlciB8IHVuZGVmaW5lZCB7XG5cdFx0cmV0dXJuIHRoaXMuX2JvdW5kc1Byb3ZpZGVyO1xuXHR9XG5cdHB1YmxpYyBzZXQgYm91bmRzUHJvdmlkZXIgKHZhbHVlOiBTcGluZUJvdW5kc1Byb3ZpZGVyIHwgdW5kZWZpbmVkKSB7XG5cdFx0dGhpcy5fYm91bmRzUHJvdmlkZXIgPSB2YWx1ZTtcblx0XHRpZiAodmFsdWUpIHtcblx0XHRcdHRoaXMuX2JvdW5kc0RpcnR5ID0gZmFsc2U7XG5cdFx0fVxuXHRcdHRoaXMudXBkYXRlQm91bmRzKCk7XG5cdH1cblxuXHRwcml2YXRlIGhhc05ldmVyVXBkYXRlZCA9IHRydWU7XG5cdGNvbnN0cnVjdG9yIChvcHRpb25zOiBTcGluZU9wdGlvbnMgfCBTa2VsZXRvbkRhdGEpIHtcblx0XHRpZiAob3B0aW9ucyBpbnN0YW5jZW9mIFNrZWxldG9uRGF0YSkge1xuXHRcdFx0b3B0aW9ucyA9IHtcblx0XHRcdFx0c2tlbGV0b25EYXRhOiBvcHRpb25zLFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRzdXBlcigpO1xuXG5cdFx0Y29uc3Qgc2tlbGV0b25EYXRhID0gb3B0aW9ucyBpbnN0YW5jZW9mIFNrZWxldG9uRGF0YSA/IG9wdGlvbnMgOiBvcHRpb25zLnNrZWxldG9uRGF0YTtcblxuXHRcdHRoaXMuc2tlbGV0b24gPSBuZXcgU2tlbGV0b24oc2tlbGV0b25EYXRhKTtcblx0XHR0aGlzLnN0YXRlID0gbmV3IEFuaW1hdGlvblN0YXRlKG5ldyBBbmltYXRpb25TdGF0ZURhdGEoc2tlbGV0b25EYXRhKSk7XG5cdFx0dGhpcy5hdXRvVXBkYXRlID0gb3B0aW9ucz8uYXV0b1VwZGF0ZSA/PyB0cnVlO1xuXG5cdFx0Ly8gZGFyayB0aW50IGNhbiBiZSBlbmFibGVkIGJ5IG9wdGlvbnMsIG90aGVyd2lzZSBpcyBlbmFibGUgaWYgYXQgbGVhc3Qgb25lIHNsb3QgaGFzIHRpbnQgYmxhY2tcblx0XHR0aGlzLmRhcmtUaW50ID0gb3B0aW9ucz8uZGFya1RpbnQgPT09IHVuZGVmaW5lZFxuXHRcdFx0PyB0aGlzLnNrZWxldG9uLnNsb3RzLnNvbWUoc2xvdCA9PiAhIXNsb3QuZGF0YS5kYXJrQ29sb3IpXG5cdFx0XHQ6IG9wdGlvbnM/LmRhcmtUaW50O1xuXG5cdFx0Y29uc3Qgc2xvdHMgPSB0aGlzLnNrZWxldG9uLnNsb3RzO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzbG90cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5hdHRhY2htZW50Q2FjaGVEYXRhW2ldID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblx0XHR9XG5cblx0XHR0aGlzLl9ib3VuZHNQcm92aWRlciA9IG9wdGlvbnMuYm91bmRzUHJvdmlkZXI7XG5cdH1cblxuXHQvKiogSWYge0BsaW5rIFNwaW5lLmF1dG9VcGRhdGV9IGlzIGBmYWxzZWAsIHRoaXMgbWV0aG9kIGFsbG93cyB0byB1cGRhdGUgdGhlIEFuaW1hdGlvblN0YXRlIGFuZCB0aGUgU2tlbGV0b24gd2l0aCB0aGUgZ2l2ZW4gZGVsdGEuICovXG5cdHB1YmxpYyB1cGRhdGUgKGR0OiBudW1iZXIpOiB2b2lkIHtcblx0XHR0aGlzLmludGVybmFsVXBkYXRlKDAsIGR0KTtcblx0fVxuXG5cdHByb3RlY3RlZCBpbnRlcm5hbFVwZGF0ZSAoX2RlbHRhRnJhbWU6IGFueSwgZGVsdGFTZWNvbmRzPzogbnVtYmVyKTogdm9pZCB7XG5cdFx0Ly8gQmVjYXVzZSByZWFzb25zLCBwaXhpIHVzZXMgZGVsdGFGcmFtZXMgYXQgNjBmcHMuXG5cdFx0Ly8gV2UgaWdub3JlIHRoZSBkZWZhdWx0IGRlbHRhRnJhbWVzIGFuZCB1c2UgdGhlIGRlbHRhU2Vjb25kcyBmcm9tIHBpeGkgdGlja2VyLlxuXHRcdHRoaXMuX3VwZGF0ZUFuZEFwcGx5U3RhdGUoZGVsdGFTZWNvbmRzID8/IFRpY2tlci5zaGFyZWQuZGVsdGFNUyAvIDEwMDApO1xuXHR9XG5cblx0b3ZlcnJpZGUgZ2V0IGJvdW5kcyAoKSB7XG5cdFx0aWYgKHRoaXMuX2JvdW5kc0RpcnR5KSB7XG5cdFx0XHR0aGlzLnVwZGF0ZUJvdW5kcygpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLl9ib3VuZHM7XG5cdH1cblxuXHQvKipcblx0ICogU2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgYm9uZSBnaXZlbiBpbiBpbnB1dCB0aHJvdWdoIGEge0BsaW5rIElQb2ludERhdGF9LlxuXHQgKiBAcGFyYW0gYm9uZTogdGhlIGJvbmUgbmFtZSBvciB0aGUgYm9uZSBpbnN0YW5jZSB0byBzZXQgdGhlIHBvc2l0aW9uXG5cdCAqIEBwYXJhbSBvdXRQb3M6IHRoZSBuZXcgcG9zaXRpb24gb2YgdGhlIGJvbmUuXG5cdCAqIEB0aHJvd3Mge0Vycm9yfTogaWYgdGhlIGdpdmVuIGJvbmUgaXMgbm90IGZvdW5kIGluIHRoZSBza2VsZXRvbiwgYW4gZXJyb3IgaXMgdGhyb3duXG5cdCAqL1xuXHRwdWJsaWMgc2V0Qm9uZVBvc2l0aW9uIChib25lOiBzdHJpbmcgfCBCb25lLCBwb3NpdGlvbjogUG9pbnREYXRhKTogdm9pZCB7XG5cdFx0Y29uc3QgYm9uZUF1eCA9IGJvbmU7XG5cblx0XHRpZiAodHlwZW9mIGJvbmUgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRib25lID0gdGhpcy5za2VsZXRvbi5maW5kQm9uZShib25lKSBhcyBCb25lO1xuXHRcdH1cblxuXHRcdGlmICghYm9uZSkgdGhyb3cgRXJyb3IoYENhbnQgc2V0IGJvbmUgcG9zaXRpb24sIGJvbmUgJHtTdHJpbmcoYm9uZUF1eCl9IG5vdCBmb3VuZGApO1xuXHRcdHZlY3RvckF1eC5zZXQocG9zaXRpb24ueCwgcG9zaXRpb24ueSk7XG5cblx0XHRpZiAoYm9uZS5wYXJlbnQpIHtcblx0XHRcdGNvbnN0IGF1eCA9IGJvbmUucGFyZW50LndvcmxkVG9Mb2NhbCh2ZWN0b3JBdXgpO1xuXG5cdFx0XHRib25lLnggPSBhdXgueDtcblx0XHRcdGJvbmUueSA9IC1hdXgueTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRib25lLnggPSB2ZWN0b3JBdXgueDtcblx0XHRcdGJvbmUueSA9IHZlY3RvckF1eC55O1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBib25lIGdpdmVuIGluIGlucHV0IGludG8gYW4ge0BsaW5rIElQb2ludERhdGF9LlxuXHQgKiBAcGFyYW0gYm9uZTogdGhlIGJvbmUgbmFtZSBvciB0aGUgYm9uZSBpbnN0YW5jZSB0byBnZXQgdGhlIHBvc2l0aW9uIGZyb21cblx0ICogQHBhcmFtIG91dFBvczogYW4gb3B0aW9uYWwge0BsaW5rIElQb2ludERhdGF9IHRvIHVzZSB0byByZXR1cm4gdGhlIGJvbmUgcG9zaXRpb24sIHJhdGhlcm4gdGhhbiBpbnN0YW50aWF0aW5nIGEgbmV3IG9iamVjdC5cblx0ICogQHJldHVybnMge0lQb2ludERhdGEgfCB1bmRlZmluZWR9OiB0aGUgcG9zaXRpb24gb2YgdGhlIGJvbmUsIG9yIHVuZGVmaW5lZCBpZiBubyBtYXRjaGluZyBib25lIGlzIGZvdW5kIGluIHRoZSBza2VsZXRvblxuXHQgKi9cblx0cHVibGljIGdldEJvbmVQb3NpdGlvbiAoYm9uZTogc3RyaW5nIHwgQm9uZSwgb3V0UG9zPzogUG9pbnREYXRhKTogUG9pbnREYXRhIHwgdW5kZWZpbmVkIHtcblx0XHRjb25zdCBib25lQXV4ID0gYm9uZTtcblxuXHRcdGlmICh0eXBlb2YgYm9uZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdGJvbmUgPSB0aGlzLnNrZWxldG9uLmZpbmRCb25lKGJvbmUpIGFzIEJvbmU7XG5cdFx0fVxuXG5cdFx0aWYgKCFib25lKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGBDYW50IHNldCBib25lIHBvc2l0aW9uISBCb25lICR7U3RyaW5nKGJvbmVBdXgpfSBub3QgZm91bmRgKTtcblxuXHRcdFx0cmV0dXJuIG91dFBvcztcblx0XHR9XG5cblx0XHRpZiAoIW91dFBvcykge1xuXHRcdFx0b3V0UG9zID0geyB4OiAwLCB5OiAwIH07XG5cdFx0fVxuXG5cdFx0b3V0UG9zLnggPSBib25lLndvcmxkWDtcblx0XHRvdXRQb3MueSA9IGJvbmUud29ybGRZO1xuXG5cdFx0cmV0dXJuIG91dFBvcztcblx0fVxuXG5cdC8qKlxuXHQgKiBBZHZhbmNlIHRoZSBzdGF0ZSBhbmQgc2tlbGV0b24gYnkgdGhlIGdpdmVuIHRpbWUsIHRoZW4gdXBkYXRlIHNsb3Qgb2JqZWN0cyB0b28uXG5cdCAqIFRoZSBjb250YWluZXIgdHJhbnNmb3JtIGlzIG5vdCB1cGRhdGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0gdGltZSB0aGUgdGltZSBhdCB3aGljaCB0byBzZXQgdGhlIHN0YXRlXG5cdCAqL1xuXHRwcml2YXRlIF91cGRhdGVBbmRBcHBseVN0YXRlICh0aW1lOiBudW1iZXIpIHtcblx0XHR0aGlzLmhhc05ldmVyVXBkYXRlZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy5zdGF0ZS51cGRhdGUodGltZSk7XG5cdFx0dGhpcy5za2VsZXRvbi51cGRhdGUodGltZSk7XG5cblx0XHRjb25zdCB7IHNrZWxldG9uIH0gPSB0aGlzO1xuXG5cdFx0dGhpcy5zdGF0ZS5hcHBseShza2VsZXRvbik7XG5cblx0XHR0aGlzLmJlZm9yZVVwZGF0ZVdvcmxkVHJhbnNmb3Jtcyh0aGlzKTtcblx0XHRza2VsZXRvbi51cGRhdGVXb3JsZFRyYW5zZm9ybShQaHlzaWNzLnVwZGF0ZSk7XG5cdFx0dGhpcy5hZnRlclVwZGF0ZVdvcmxkVHJhbnNmb3Jtcyh0aGlzKTtcblxuXHRcdHRoaXMudXBkYXRlU2xvdE9iamVjdHMoKTtcblxuXHRcdHRoaXMuX3N0YXRlQ2hhbmdlZCA9IHRydWU7XG5cblx0XHR0aGlzLm9uVmlld1VwZGF0ZSgpO1xuXHR9XG5cblx0LyoqXG5cdCAqIC0gdmFsaWRhdGVzIHRoZSBhdHRhY2htZW50cyAtIHRvIGZsYWcgaWYgdGhlIGF0dGFjaG1lbnRzIGhhdmUgY2hhbmdlZCB0aGlzIHN0YXRlXG5cdCAqIC0gdHJhbnNmb3JtcyB0aGUgYXR0YWNobWVudHMgLSB0byB1cGRhdGUgdGhlIHZlcnRpY2VzIG9mIHRoZSBhdHRhY2htZW50cyBiYXNlZCBvbiB0aGUgbmV3IHBvc2l0aW9uc1xuXHQgKiBAaW50ZXJuYWxcblx0ICovXG5cdF92YWxpZGF0ZUFuZFRyYW5zZm9ybUF0dGFjaG1lbnRzICgpIHtcblx0XHRpZiAoIXRoaXMuX3N0YXRlQ2hhbmdlZCkgcmV0dXJuO1xuXHRcdHRoaXMuX3N0YXRlQ2hhbmdlZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy52YWxpZGF0ZUF0dGFjaG1lbnRzKCk7XG5cblx0XHR0aGlzLnRyYW5zZm9ybUF0dGFjaG1lbnRzKCk7XG5cdH1cblxuXHRwcml2YXRlIHZhbGlkYXRlQXR0YWNobWVudHMgKCkge1xuXG5cdFx0Y29uc3QgY3VycmVudERyYXdPcmRlciA9IHRoaXMuc2tlbGV0b24uZHJhd09yZGVyO1xuXG5cdFx0Y29uc3QgbGFzdEF0dGFjaG1lbnRzID0gdGhpcy5fbGFzdEF0dGFjaG1lbnRzO1xuXG5cdFx0bGV0IGluZGV4ID0gMDtcblxuXHRcdGxldCBzcGluZUF0dGFjaG1lbnRzRGlydHkgPSBmYWxzZTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY3VycmVudERyYXdPcmRlci5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3Qgc2xvdCA9IGN1cnJlbnREcmF3T3JkZXJbaV07XG5cdFx0XHRjb25zdCBhdHRhY2htZW50ID0gc2xvdC5nZXRBdHRhY2htZW50KCk7XG5cblx0XHRcdGlmIChhdHRhY2htZW50KSB7XG5cdFx0XHRcdGlmIChhdHRhY2htZW50ICE9PSBsYXN0QXR0YWNobWVudHNbaW5kZXhdKSB7XG5cdFx0XHRcdFx0c3BpbmVBdHRhY2htZW50c0RpcnR5ID0gdHJ1ZTtcblx0XHRcdFx0XHRsYXN0QXR0YWNobWVudHNbaW5kZXhdID0gYXR0YWNobWVudDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGluZGV4Kys7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGluZGV4ICE9PSBsYXN0QXR0YWNobWVudHMubGVuZ3RoKSB7XG5cdFx0XHRzcGluZUF0dGFjaG1lbnRzRGlydHkgPSB0cnVlO1xuXHRcdFx0bGFzdEF0dGFjaG1lbnRzLmxlbmd0aCA9IGluZGV4O1xuXHRcdH1cblxuXHRcdHRoaXMuc3BpbmVBdHRhY2htZW50c0RpcnR5IHx8PSBzcGluZUF0dGFjaG1lbnRzRGlydHk7XG5cdH1cblxuXHRwcml2YXRlIGN1cnJlbnRDbGlwcGluZ1Nsb3Q6IFNsb3RzVG9DbGlwcGluZyB8IHVuZGVmaW5lZDtcblx0cHJpdmF0ZSB1cGRhdGVBbmRTZXRQaXhpTWFzayAoc2xvdDogU2xvdCwgbGFzdDogYm9vbGVhbikge1xuXHRcdC8vIGFzc2lnbi9jcmVhdGUgdGhlIGN1cnJlbnRDbGlwcGluZ1Nsb3Rcblx0XHRjb25zdCBhdHRhY2htZW50ID0gc2xvdC5hdHRhY2htZW50O1xuXHRcdGlmIChhdHRhY2htZW50ICYmIGF0dGFjaG1lbnQgaW5zdGFuY2VvZiBDbGlwcGluZ0F0dGFjaG1lbnQpIHtcblx0XHRcdGNvbnN0IGNsaXAgPSAodGhpcy5jbGlwcGluZ1Nsb3RUb1BpeGlNYXNrc1tzbG90LmRhdGEubmFtZV0gfHw9IHsgc2xvdCwgdmVydGljZXM6IG5ldyBBcnJheTxudW1iZXI+KCkgfSk7XG5cdFx0XHRjbGlwLm1hc2tDb21wdXRlZCA9IGZhbHNlO1xuXHRcdFx0dGhpcy5jdXJyZW50Q2xpcHBpbmdTbG90ID0gdGhpcy5jbGlwcGluZ1Nsb3RUb1BpeGlNYXNrc1tzbG90LmRhdGEubmFtZV07XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gYXNzaWduIHRoZSBjdXJyZW50Q2xpcHBpbmdTbG90IG1hc2sgdG8gdGhlIHNsb3Qgb2JqZWN0XG5cdFx0bGV0IGN1cnJlbnRDbGlwcGluZ1Nsb3QgPSB0aGlzLmN1cnJlbnRDbGlwcGluZ1Nsb3Q7XG5cdFx0bGV0IHNsb3RPYmplY3QgPSB0aGlzLl9zbG90c09iamVjdFtzbG90LmRhdGEubmFtZV07XG5cdFx0aWYgKGN1cnJlbnRDbGlwcGluZ1Nsb3QgJiYgc2xvdE9iamVjdCkge1xuXHRcdFx0bGV0IHNsb3RDbGlwcGluZyA9IGN1cnJlbnRDbGlwcGluZ1Nsb3Quc2xvdDtcblx0XHRcdGxldCBjbGlwcGluZ0F0dGFjaG1lbnQgPSBzbG90Q2xpcHBpbmcuYXR0YWNobWVudCBhcyBDbGlwcGluZ0F0dGFjaG1lbnQ7XG5cblx0XHRcdC8vIGNyZWF0ZSB0aGUgcGl4aSBtYXNrLCBvbmx5IHRoZSBmaXJzdCB0aW1lIGFuZCBpZiB0aGUgY2xpcHBlZCBzbG90IGlzIHRoZSBmaXJzdCBvbmUgY2xpcHBlZCBieSB0aGlzIGN1cnJlbnRDbGlwcGluZ1Nsb3Rcblx0XHRcdGxldCBtYXNrID0gY3VycmVudENsaXBwaW5nU2xvdC5tYXNrIGFzIEdyYXBoaWNzO1xuXHRcdFx0aWYgKCFtYXNrKSB7XG5cdFx0XHRcdG1hc2sgPSBtYXNrUG9vbC5vYnRhaW4oKTtcblx0XHRcdFx0Y3VycmVudENsaXBwaW5nU2xvdC5tYXNrID0gbWFzaztcblx0XHRcdFx0dGhpcy5hZGRDaGlsZChtYXNrKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gY29tcHV0ZSB0aGUgcGl4aSBtYXNrIHBvbHlnb24sIGlmIHRoZSBjbGlwcGVkIHNsb3QgaXMgdGhlIGZpcnN0IG9uZSBjbGlwcGVkIGJ5IHRoaXMgY3VycmVudENsaXBwaW5nU2xvdFxuXHRcdFx0aWYgKCFjdXJyZW50Q2xpcHBpbmdTbG90Lm1hc2tDb21wdXRlZCkge1xuXHRcdFx0XHRjdXJyZW50Q2xpcHBpbmdTbG90Lm1hc2tDb21wdXRlZCA9IHRydWU7XG5cdFx0XHRcdGNvbnN0IHdvcmxkVmVydGljZXNMZW5ndGggPSBjbGlwcGluZ0F0dGFjaG1lbnQud29ybGRWZXJ0aWNlc0xlbmd0aDtcblx0XHRcdFx0Y29uc3QgdmVydGljZXMgPSBjdXJyZW50Q2xpcHBpbmdTbG90LnZlcnRpY2VzO1xuXHRcdFx0XHRjbGlwcGluZ0F0dGFjaG1lbnQuY29tcHV0ZVdvcmxkVmVydGljZXMoc2xvdENsaXBwaW5nLCAwLCB3b3JsZFZlcnRpY2VzTGVuZ3RoLCB2ZXJ0aWNlcywgMCwgMik7XG5cdFx0XHRcdG1hc2suY2xlYXIoKS5wb2x5KHZlcnRpY2VzKS5zdHJva2UoeyB3aWR0aDogMCB9KS5maWxsKHsgYWxwaGE6IC4yNSB9KTtcblx0XHRcdH1cblx0XHRcdHNsb3RPYmplY3QuY29udGFpbmVyLm1hc2sgPSBtYXNrO1xuXHRcdH0gZWxzZSBpZiAoc2xvdE9iamVjdD8uY29udGFpbmVyLm1hc2spIHtcblx0XHRcdC8vIHJlbW92ZSB0aGUgbWFzaywgaWYgc2xvdCBvYmplY3QgaGFzIGEgbWFzaywgYnV0IGN1cnJlbnRDbGlwcGluZ1Nsb3QgaXMgdW5kZWZpbmVkXG5cdFx0XHRzbG90T2JqZWN0LmNvbnRhaW5lci5tYXNrID0gbnVsbDtcblx0XHR9XG5cblx0XHQvLyBpZiBjdXJyZW50IHNsb3QgaXMgdGhlIGVuZGluZyBvbmUgb2YgdGhlIGN1cnJlbnRDbGlwcGluZ1Nsb3QgbWFzaywgc2V0IGN1cnJlbnRDbGlwcGluZ1Nsb3QgdG8gdW5kZWZpbmVkXG5cdFx0aWYgKGN1cnJlbnRDbGlwcGluZ1Nsb3QgJiYgKGN1cnJlbnRDbGlwcGluZ1Nsb3Quc2xvdC5hdHRhY2htZW50IGFzIENsaXBwaW5nQXR0YWNobWVudCkuZW5kU2xvdCA9PSBzbG90LmRhdGEpIHtcblx0XHRcdHRoaXMuY3VycmVudENsaXBwaW5nU2xvdCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHQvLyBjbGVhbiB1cCB1bnVzZWQgbWFza3Ncblx0XHRpZiAobGFzdCkge1xuXHRcdFx0Zm9yIChjb25zdCBrZXkgaW4gdGhpcy5jbGlwcGluZ1Nsb3RUb1BpeGlNYXNrcykge1xuXHRcdFx0XHRjb25zdCBjbGlwcGluZ1Nsb3RUb1BpeGlNYXNrID0gdGhpcy5jbGlwcGluZ1Nsb3RUb1BpeGlNYXNrc1trZXldO1xuXHRcdFx0XHRpZiAoKCEoY2xpcHBpbmdTbG90VG9QaXhpTWFzay5zbG90LmF0dGFjaG1lbnQgaW5zdGFuY2VvZiBDbGlwcGluZ0F0dGFjaG1lbnQpIHx8ICFjbGlwcGluZ1Nsb3RUb1BpeGlNYXNrLm1hc2tDb21wdXRlZCkgJiYgY2xpcHBpbmdTbG90VG9QaXhpTWFzay5tYXNrKSB7XG5cdFx0XHRcdFx0dGhpcy5yZW1vdmVDaGlsZChjbGlwcGluZ1Nsb3RUb1BpeGlNYXNrLm1hc2spO1xuXHRcdFx0XHRcdG1hc2tQb29sLmZyZWUoY2xpcHBpbmdTbG90VG9QaXhpTWFzay5tYXNrKTtcblx0XHRcdFx0XHRjbGlwcGluZ1Nsb3RUb1BpeGlNYXNrLm1hc2sgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHRoaXMuY3VycmVudENsaXBwaW5nU2xvdCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHRyYW5zZm9ybUF0dGFjaG1lbnRzICgpIHtcblx0XHRjb25zdCBjdXJyZW50RHJhd09yZGVyID0gdGhpcy5za2VsZXRvbi5kcmF3T3JkZXI7XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGN1cnJlbnREcmF3T3JkZXIubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IHNsb3QgPSBjdXJyZW50RHJhd09yZGVyW2ldO1xuXG5cdFx0XHR0aGlzLnVwZGF0ZUFuZFNldFBpeGlNYXNrKHNsb3QsIGkgPT09IGN1cnJlbnREcmF3T3JkZXIubGVuZ3RoIC0gMSk7XG5cblx0XHRcdGNvbnN0IGF0dGFjaG1lbnQgPSBzbG90LmdldEF0dGFjaG1lbnQoKTtcblxuXHRcdFx0aWYgKGF0dGFjaG1lbnQpIHtcblx0XHRcdFx0aWYgKGF0dGFjaG1lbnQgaW5zdGFuY2VvZiBNZXNoQXR0YWNobWVudCB8fCBhdHRhY2htZW50IGluc3RhbmNlb2YgUmVnaW9uQXR0YWNobWVudCkge1xuXHRcdFx0XHRcdGNvbnN0IGNhY2hlRGF0YSA9IHRoaXMuX2dldENhY2hlZERhdGEoc2xvdCwgYXR0YWNobWVudCk7XG5cblx0XHRcdFx0XHRpZiAoYXR0YWNobWVudCBpbnN0YW5jZW9mIFJlZ2lvbkF0dGFjaG1lbnQpIHtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuY29tcHV0ZVdvcmxkVmVydGljZXMoc2xvdCwgY2FjaGVEYXRhLnZlcnRpY2VzLCAwLCAyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRhdHRhY2htZW50LmNvbXB1dGVXb3JsZFZlcnRpY2VzKFxuXHRcdFx0XHRcdFx0XHRzbG90LFxuXHRcdFx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdFx0XHRhdHRhY2htZW50LndvcmxkVmVydGljZXNMZW5ndGgsXG5cdFx0XHRcdFx0XHRcdGNhY2hlRGF0YS52ZXJ0aWNlcyxcblx0XHRcdFx0XHRcdFx0MCxcblx0XHRcdFx0XHRcdFx0Mixcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gc2VxdWVuY2VzIHV2cyBhcmUga25vd24gb25seSBhZnRlciBjb21wdXRlV29ybGRWZXJ0aWNlcyBpcyBpbnZva2VkXG5cdFx0XHRcdFx0aWYgKGNhY2hlRGF0YS51dnMubGVuZ3RoIDwgYXR0YWNobWVudC51dnMubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRjYWNoZURhdGEudXZzID0gbmV3IEZsb2F0MzJBcnJheShhdHRhY2htZW50LnV2cy5sZW5ndGgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIG5lZWQgdG8gY29weSBiZWNhdXNlIGF0dGFjaG1lbnRzIHV2cyBhcmUgc2hhcmVkIGFtb25nIHNrZWxldG9ucyB1c2luZyB0aGUgc2FtZSBhdGxhc1xuXHRcdFx0XHRcdGZhc3RDb3B5KChhdHRhY2htZW50LnV2cyBhcyBGbG9hdDMyQXJyYXkpLmJ1ZmZlciwgY2FjaGVEYXRhLnV2cy5idWZmZXIpO1xuXG5cdFx0XHRcdFx0Y29uc3Qgc2tlbGV0b24gPSBzbG90LmJvbmUuc2tlbGV0b247XG5cdFx0XHRcdFx0Y29uc3Qgc2tlbGV0b25Db2xvciA9IHNrZWxldG9uLmNvbG9yO1xuXHRcdFx0XHRcdGNvbnN0IHNsb3RDb2xvciA9IHNsb3QuY29sb3I7XG5cblx0XHRcdFx0XHRjb25zdCBhdHRhY2htZW50Q29sb3IgPSBhdHRhY2htZW50LmNvbG9yO1xuXG5cdFx0XHRcdFx0Y2FjaGVEYXRhLmNvbG9yLnNldChcblx0XHRcdFx0XHRcdHNrZWxldG9uQ29sb3IuciAqIHNsb3RDb2xvci5yICogYXR0YWNobWVudENvbG9yLnIsXG5cdFx0XHRcdFx0XHRza2VsZXRvbkNvbG9yLmcgKiBzbG90Q29sb3IuZyAqIGF0dGFjaG1lbnRDb2xvci5nLFxuXHRcdFx0XHRcdFx0c2tlbGV0b25Db2xvci5iICogc2xvdENvbG9yLmIgKiBhdHRhY2htZW50Q29sb3IuYixcblx0XHRcdFx0XHRcdHNrZWxldG9uQ29sb3IuYSAqIHNsb3RDb2xvci5hICogYXR0YWNobWVudENvbG9yLmEsXG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdGlmIChzbG90LmRhcmtDb2xvcikge1xuXHRcdFx0XHRcdFx0Y2FjaGVEYXRhLmRhcmtDb2xvci5zZXRGcm9tQ29sb3Ioc2xvdC5kYXJrQ29sb3IpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNhY2hlRGF0YS5za2lwUmVuZGVyID0gY2FjaGVEYXRhLmNsaXBwZWQgPSBmYWxzZTtcblxuXHRcdFx0XHRcdGNvbnN0IHRleHR1cmUgPSBhdHRhY2htZW50LnJlZ2lvbj8udGV4dHVyZS50ZXh0dXJlIHx8IFRleHR1cmUuRU1QVFk7XG5cblx0XHRcdFx0XHRpZiAoY2FjaGVEYXRhLnRleHR1cmUgIT09IHRleHR1cmUpIHtcblx0XHRcdFx0XHRcdGNhY2hlRGF0YS50ZXh0dXJlID0gdGV4dHVyZTtcblx0XHRcdFx0XHRcdHRoaXMuc3BpbmVUZXh0dXJlc0RpcnR5ID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoY2xpcHBlci5pc0NsaXBwaW5nKCkpIHtcblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlQ2xpcHBpbmdEYXRhKGNhY2hlRGF0YSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKGF0dGFjaG1lbnQgaW5zdGFuY2VvZiBDbGlwcGluZ0F0dGFjaG1lbnQpIHtcblx0XHRcdFx0XHRjbGlwcGVyLmNsaXBTdGFydChzbG90LCBhdHRhY2htZW50KTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Y2xpcHBlci5jbGlwRW5kV2l0aFNsb3Qoc2xvdCk7XG5cdFx0fVxuXHRcdGNsaXBwZXIuY2xpcEVuZCgpO1xuXHR9XG5cblx0cHJpdmF0ZSB1cGRhdGVDbGlwcGluZ0RhdGEgKGNhY2hlRGF0YTogQXR0YWNobWVudENhY2hlRGF0YSkge1xuXHRcdGNhY2hlRGF0YS5jbGlwcGVkID0gdHJ1ZTtcblxuXHRcdGNsaXBwZXIuY2xpcFRyaWFuZ2xlc1VucGFja2VkKFxuXHRcdFx0Y2FjaGVEYXRhLnZlcnRpY2VzLFxuXHRcdFx0Y2FjaGVEYXRhLmluZGljZXMsXG5cdFx0XHRjYWNoZURhdGEuaW5kaWNlcy5sZW5ndGgsXG5cdFx0XHRjYWNoZURhdGEudXZzLFxuXHRcdCk7XG5cblx0XHRjb25zdCB7IGNsaXBwZWRWZXJ0aWNlcywgY2xpcHBlZFVWcywgY2xpcHBlZFRyaWFuZ2xlcyB9ID0gY2xpcHBlcjtcblxuXHRcdGNvbnN0IHZlcnRpY2VzQ291bnQgPSBjbGlwcGVkVmVydGljZXMubGVuZ3RoIC8gMjtcblx0XHRjb25zdCBpbmRpY2VzQ291bnQgPSBjbGlwcGVkVHJpYW5nbGVzLmxlbmd0aDtcblxuXHRcdGlmICghY2FjaGVEYXRhLmNsaXBwZWREYXRhKSB7XG5cdFx0XHRjYWNoZURhdGEuY2xpcHBlZERhdGEgPSB7XG5cdFx0XHRcdHZlcnRpY2VzOiBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzQ291bnQgKiAyKSxcblx0XHRcdFx0dXZzOiBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzQ291bnQgKiAyKSxcblx0XHRcdFx0dmVydGV4Q291bnQ6IHZlcnRpY2VzQ291bnQsXG5cdFx0XHRcdGluZGljZXM6IG5ldyBVaW50MTZBcnJheShpbmRpY2VzQ291bnQpLFxuXHRcdFx0XHRpbmRpY2VzQ291bnQsXG5cdFx0XHR9O1xuXG5cdFx0XHR0aGlzLnNwaW5lQXR0YWNobWVudHNEaXJ0eSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY2xpcHBlZERhdGEgPSBjYWNoZURhdGEuY2xpcHBlZERhdGE7XG5cblx0XHRjb25zdCBzaXplQ2hhbmdlID0gY2xpcHBlZERhdGEudmVydGV4Q291bnQgIT09IHZlcnRpY2VzQ291bnQgfHwgaW5kaWNlc0NvdW50ICE9PSBjbGlwcGVkRGF0YS5pbmRpY2VzQ291bnQ7XG5cblx0XHRjYWNoZURhdGEuc2tpcFJlbmRlciA9IHZlcnRpY2VzQ291bnQgPT09IDA7XG5cblx0XHRpZiAoc2l6ZUNoYW5nZSkge1xuXHRcdFx0dGhpcy5zcGluZUF0dGFjaG1lbnRzRGlydHkgPSB0cnVlO1xuXG5cdFx0XHRpZiAoY2xpcHBlZERhdGEudmVydGV4Q291bnQgPCB2ZXJ0aWNlc0NvdW50KSB7XG5cdFx0XHRcdC8vIGJ1ZmZlciByZXVzZSFcblx0XHRcdFx0Y2xpcHBlZERhdGEudmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzQ291bnQgKiAyKTtcblx0XHRcdFx0Y2xpcHBlZERhdGEudXZzID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0aWNlc0NvdW50ICogMik7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjbGlwcGVkRGF0YS5pbmRpY2VzLmxlbmd0aCA8IGluZGljZXNDb3VudCkge1xuXHRcdFx0XHRjbGlwcGVkRGF0YS5pbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KGluZGljZXNDb3VudCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyB2ZXJ0aWNlcywgdXZzLCBpbmRpY2VzIH0gPSBjbGlwcGVkRGF0YTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdmVydGljZXNDb3VudDsgaSsrKSB7XG5cdFx0XHR2ZXJ0aWNlc1tpICogMl0gPSBjbGlwcGVkVmVydGljZXNbaSAqIDJdO1xuXHRcdFx0dmVydGljZXNbKGkgKiAyKSArIDFdID0gY2xpcHBlZFZlcnRpY2VzWyhpICogMikgKyAxXTtcblxuXHRcdFx0dXZzW2kgKiAyXSA9IGNsaXBwZWRVVnNbKGkgKiAyKV07XG5cdFx0XHR1dnNbKGkgKiAyKSArIDFdID0gY2xpcHBlZFVWc1soaSAqIDIpICsgMV07XG5cdFx0fVxuXG5cdFx0Y2xpcHBlZERhdGEudmVydGV4Q291bnQgPSB2ZXJ0aWNlc0NvdW50O1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBpbmRpY2VzQ291bnQ7IGkrKykge1xuXHRcdFx0aWYgKGluZGljZXNbaV0gIT09IGNsaXBwZWRUcmlhbmdsZXNbaV0pIHtcblx0XHRcdFx0dGhpcy5zcGluZUF0dGFjaG1lbnRzRGlydHkgPSB0cnVlO1xuXHRcdFx0XHRpbmRpY2VzW2ldID0gY2xpcHBlZFRyaWFuZ2xlc1tpXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjbGlwcGVkRGF0YS5pbmRpY2VzQ291bnQgPSBpbmRpY2VzQ291bnQ7XG5cdH1cblxuXHQvKipcblx0ICogZW5zdXJlIHRoYXQgYXR0YWNoZWQgY29udGFpbmVycyBtYXAgY29ycmVjdGx5IHRvIHRoZWlyIHNsb3RzXG5cdCAqIGFsb25nIHdpdGggdGhlaXIgcG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSwgYW5kIHZpc2liaWxpdHkuXG5cdCAqL1xuXHRwcml2YXRlIHVwZGF0ZVNsb3RPYmplY3RzICgpIHtcblx0XHRmb3IgKGNvbnN0IGkgaW4gdGhpcy5fc2xvdHNPYmplY3QpIHtcblx0XHRcdGNvbnN0IHNsb3RBdHRhY2htZW50ID0gdGhpcy5fc2xvdHNPYmplY3RbaV07XG5cblx0XHRcdGlmICghc2xvdEF0dGFjaG1lbnQpIGNvbnRpbnVlO1xuXG5cdFx0XHR0aGlzLnVwZGF0ZVNsb3RPYmplY3Qoc2xvdEF0dGFjaG1lbnQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgdXBkYXRlU2xvdE9iamVjdCAoc2xvdEF0dGFjaG1lbnQ6IHsgc2xvdDogU2xvdCwgY29udGFpbmVyOiBDb250YWluZXIsIGZvbGxvd0F0dGFjaG1lbnRUaW1lbGluZTogYm9vbGVhbiB9KSB7XG5cdFx0Y29uc3QgeyBzbG90LCBjb250YWluZXIgfSA9IHNsb3RBdHRhY2htZW50O1xuXG5cdFx0Y29uc3QgZm9sbG93QXR0YWNobWVudFZhbHVlID0gc2xvdEF0dGFjaG1lbnQuZm9sbG93QXR0YWNobWVudFRpbWVsaW5lID8gQm9vbGVhbihzbG90LmF0dGFjaG1lbnQpIDogdHJ1ZTtcblx0XHRjb250YWluZXIudmlzaWJsZSA9IHRoaXMuc2tlbGV0b24uZHJhd09yZGVyLmluY2x1ZGVzKHNsb3QpICYmIGZvbGxvd0F0dGFjaG1lbnRWYWx1ZTtcblxuXHRcdGlmIChjb250YWluZXIudmlzaWJsZSkge1xuXHRcdFx0Y29uc3QgYm9uZSA9IHNsb3QuYm9uZTtcblxuXHRcdFx0Y29udGFpbmVyLnBvc2l0aW9uLnNldChib25lLndvcmxkWCwgYm9uZS53b3JsZFkpO1xuXG5cdFx0XHRjb250YWluZXIuc2NhbGUueCA9IGJvbmUuZ2V0V29ybGRTY2FsZVgoKTtcblx0XHRcdGNvbnRhaW5lci5zY2FsZS55ID0gYm9uZS5nZXRXb3JsZFNjYWxlWSgpO1xuXG5cdFx0XHRjb250YWluZXIucm90YXRpb24gPSBib25lLmdldFdvcmxkUm90YXRpb25YKCkgKiBERUdfVE9fUkFEO1xuXG5cdFx0XHRjb250YWluZXIuYWxwaGEgPSB0aGlzLnNrZWxldG9uLmNvbG9yLmEgKiBzbG90LmNvbG9yLmE7XG5cdFx0fVxuXHR9XG5cblx0LyoqIEBpbnRlcm5hbCAqL1xuXHRfZ2V0Q2FjaGVkRGF0YSAoc2xvdDogU2xvdCwgYXR0YWNobWVudDogUmVnaW9uQXR0YWNobWVudCB8IE1lc2hBdHRhY2htZW50KTogQXR0YWNobWVudENhY2hlRGF0YSB7XG5cdFx0cmV0dXJuIHRoaXMuYXR0YWNobWVudENhY2hlRGF0YVtzbG90LmRhdGEuaW5kZXhdW2F0dGFjaG1lbnQubmFtZV0gfHwgdGhpcy5pbml0Q2FjaGVkRGF0YShzbG90LCBhdHRhY2htZW50KTtcblx0fVxuXG5cdHByaXZhdGUgaW5pdENhY2hlZERhdGEgKHNsb3Q6IFNsb3QsIGF0dGFjaG1lbnQ6IFJlZ2lvbkF0dGFjaG1lbnQgfCBNZXNoQXR0YWNobWVudCk6IEF0dGFjaG1lbnRDYWNoZURhdGEge1xuXHRcdGxldCB2ZXJ0aWNlczogRmxvYXQzMkFycmF5O1xuXG5cdFx0aWYgKGF0dGFjaG1lbnQgaW5zdGFuY2VvZiBSZWdpb25BdHRhY2htZW50KSB7XG5cdFx0XHR2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoOCk7XG5cblx0XHRcdHRoaXMuYXR0YWNobWVudENhY2hlRGF0YVtzbG90LmRhdGEuaW5kZXhdW2F0dGFjaG1lbnQubmFtZV0gPSB7XG5cdFx0XHRcdGlkOiBgJHtzbG90LmRhdGEuaW5kZXh9LSR7YXR0YWNobWVudC5uYW1lfWAsXG5cdFx0XHRcdHZlcnRpY2VzLFxuXHRcdFx0XHRjbGlwcGVkOiBmYWxzZSxcblx0XHRcdFx0aW5kaWNlczogWzAsIDEsIDIsIDAsIDIsIDNdLFxuXHRcdFx0XHR1dnM6IG5ldyBGbG9hdDMyQXJyYXkoYXR0YWNobWVudC51dnMubGVuZ3RoKSxcblx0XHRcdFx0Y29sb3I6IG5ldyBDb2xvcigxLCAxLCAxLCAxKSxcblx0XHRcdFx0ZGFya0NvbG9yOiBuZXcgQ29sb3IoMCwgMCwgMCwgMCksXG5cdFx0XHRcdGRhcmtUaW50OiB0aGlzLmRhcmtUaW50LFxuXHRcdFx0XHRza2lwUmVuZGVyOiBmYWxzZSxcblx0XHRcdFx0dGV4dHVyZTogYXR0YWNobWVudC5yZWdpb24/LnRleHR1cmUudGV4dHVyZSxcblx0XHRcdH07XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KGF0dGFjaG1lbnQud29ybGRWZXJ0aWNlc0xlbmd0aCk7XG5cblx0XHRcdHRoaXMuYXR0YWNobWVudENhY2hlRGF0YVtzbG90LmRhdGEuaW5kZXhdW2F0dGFjaG1lbnQubmFtZV0gPSB7XG5cdFx0XHRcdGlkOiBgJHtzbG90LmRhdGEuaW5kZXh9LSR7YXR0YWNobWVudC5uYW1lfWAsXG5cdFx0XHRcdHZlcnRpY2VzLFxuXHRcdFx0XHRjbGlwcGVkOiBmYWxzZSxcblx0XHRcdFx0aW5kaWNlczogYXR0YWNobWVudC50cmlhbmdsZXMsXG5cdFx0XHRcdHV2czogbmV3IEZsb2F0MzJBcnJheShhdHRhY2htZW50LnV2cy5sZW5ndGgpLFxuXHRcdFx0XHRjb2xvcjogbmV3IENvbG9yKDEsIDEsIDEsIDEpLFxuXHRcdFx0XHRkYXJrQ29sb3I6IG5ldyBDb2xvcigwLCAwLCAwLCAwKSxcblx0XHRcdFx0ZGFya1RpbnQ6IHRoaXMuZGFya1RpbnQsXG5cdFx0XHRcdHNraXBSZW5kZXI6IGZhbHNlLFxuXHRcdFx0XHR0ZXh0dXJlOiBhdHRhY2htZW50LnJlZ2lvbj8udGV4dHVyZS50ZXh0dXJlLFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5hdHRhY2htZW50Q2FjaGVEYXRhW3Nsb3QuZGF0YS5pbmRleF1bYXR0YWNobWVudC5uYW1lXTtcblx0fVxuXG5cdHByb3RlY3RlZCBvblZpZXdVcGRhdGUgKCkge1xuXHRcdC8vIGluY3JlbWVudCBmcm9tIHRoZSAxMnRoIGJpdCFcblx0XHR0aGlzLl9kaWRWaWV3Q2hhbmdlVGljaysrO1xuXHRcdGlmICghdGhpcy5fYm91bmRzUHJvdmlkZXIpIHtcblx0XHRcdHRoaXMuX2JvdW5kc0RpcnR5ID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5kaWRWaWV3VXBkYXRlKSByZXR1cm47XG5cdFx0dGhpcy5kaWRWaWV3VXBkYXRlID0gdHJ1ZTtcblxuXHRcdGNvbnN0IHJlbmRlckdyb3VwID0gdGhpcy5yZW5kZXJHcm91cCB8fCB0aGlzLnBhcmVudFJlbmRlckdyb3VwO1xuXG5cdFx0aWYgKHJlbmRlckdyb3VwKSB7XG5cdFx0XHRyZW5kZXJHcm91cC5vbkNoaWxkVmlld1VwZGF0ZSh0aGlzKTtcblx0XHR9XG5cblx0XHR0aGlzLmRlYnVnPy5yZW5kZXJEZWJ1Zyh0aGlzKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBdHRhY2hlcyBhIFBpeGlKUyBjb250YWluZXIgdG8gYSBzcGVjaWZpZWQgc2xvdC4gVGhpcyB3aWxsIG1hcCB0aGUgd29ybGQgdHJhbnNmb3JtIG9mIHRoZSBzbG90cyBib25lXG5cdCAqIHRvIHRoZSBhdHRhY2hlZCBjb250YWluZXIuIEEgY29udGFpbmVyIGNhbiBvbmx5IGJlIGF0dGFjaGVkIHRvIG9uZSBzbG90IGF0IGEgdGltZS5cblx0ICpcblx0ICogQHBhcmFtIGNvbnRhaW5lciAtIFRoZSBjb250YWluZXIgdG8gYXR0YWNoIHRvIHRoZSBzbG90XG5cdCAqIEBwYXJhbSBzbG90UmVmIC0gVGhlIHNsb3QgaWQgb3IgIHNsb3QgdG8gYXR0YWNoIHRvXG5cdCAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9uYWwgc2V0dGluZ3MgZm9yIHRoZSBhdHRhY2htZW50LlxuXHQgKiBAcGFyYW0gb3B0aW9ucy5mb2xsb3dBdHRhY2htZW50VGltZWxpbmUgLSBJZiB0cnVlLCB0aGUgYXR0YWNobWVudCB3aWxsIGZvbGxvdyB0aGUgc2xvdCdzIGF0dGFjaG1lbnQgdGltZWxpbmUuXG5cdCAqL1xuXHRwdWJsaWMgYWRkU2xvdE9iamVjdCAoc2xvdDogbnVtYmVyIHwgc3RyaW5nIHwgU2xvdCwgY29udGFpbmVyOiBDb250YWluZXIsIG9wdGlvbnM/OiB7IGZvbGxvd0F0dGFjaG1lbnRUaW1lbGluZT86IGJvb2xlYW4gfSkge1xuXHRcdHNsb3QgPSB0aGlzLmdldFNsb3RGcm9tUmVmKHNsb3QpO1xuXG5cdFx0Ly8gbmVlZCB0byBjaGVjayBpbiBvbiB0aGUgY29udGFpbmVyIHRvby4uLlxuXHRcdGZvciAoY29uc3QgaSBpbiB0aGlzLl9zbG90c09iamVjdCkge1xuXHRcdFx0aWYgKHRoaXMuX3Nsb3RzT2JqZWN0W2ldPy5jb250YWluZXIgPT09IGNvbnRhaW5lcikge1xuXHRcdFx0XHR0aGlzLnJlbW92ZVNsb3RPYmplY3QodGhpcy5fc2xvdHNPYmplY3RbaV0uc2xvdCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5yZW1vdmVTbG90T2JqZWN0KHNsb3QpO1xuXG5cdFx0Y29udGFpbmVyLmluY2x1ZGVJbkJ1aWxkID0gZmFsc2U7XG5cblx0XHQvLyBUT0RPIG9ubHkgYWRkIG9uY2U/P1xuXHRcdHRoaXMuYWRkQ2hpbGQoY29udGFpbmVyKTtcblxuXHRcdGNvbnN0IHNsb3RPYmplY3QgPSB7XG5cdFx0XHRjb250YWluZXIsXG5cdFx0XHRzbG90LFxuXHRcdFx0Zm9sbG93QXR0YWNobWVudFRpbWVsaW5lOiBvcHRpb25zPy5mb2xsb3dBdHRhY2htZW50VGltZWxpbmUgfHwgZmFsc2UsXG5cdFx0fTtcblx0XHR0aGlzLl9zbG90c09iamVjdFtzbG90LmRhdGEubmFtZV0gPSBzbG90T2JqZWN0O1xuXG5cdFx0dGhpcy51cGRhdGVTbG90T2JqZWN0KHNsb3RPYmplY3QpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYSBQaXhpSlMgY29udGFpbmVyIGZyb20gdGhlIHNsb3QgaXQgaXMgYXR0YWNoZWQgdG8uXG5cdCAqXG5cdCAqIEBwYXJhbSBjb250YWluZXIgLSBUaGUgY29udGFpbmVyIHRvIGRldGFjaCBmcm9tIHRoZSBzbG90XG5cdCAqIEBwYXJhbSBzbG90T3JDb250YWluZXIgLSBUaGUgY29udGFpbmVyLCBzbG90IGlkIG9yIHNsb3QgdG8gZGV0YWNoIGZyb21cblx0ICovXG5cdHB1YmxpYyByZW1vdmVTbG90T2JqZWN0IChzbG90T3JDb250YWluZXI6IG51bWJlciB8IHN0cmluZyB8IFNsb3QgfCBDb250YWluZXIpIHtcblx0XHRsZXQgY29udGFpbmVyVG9SZW1vdmU6IENvbnRhaW5lciB8IHVuZGVmaW5lZDtcblxuXHRcdGlmIChzbG90T3JDb250YWluZXIgaW5zdGFuY2VvZiBDb250YWluZXIpIHtcblx0XHRcdGZvciAoY29uc3QgaSBpbiB0aGlzLl9zbG90c09iamVjdCkge1xuXHRcdFx0XHRpZiAodGhpcy5fc2xvdHNPYmplY3RbaV0/LmNvbnRhaW5lciA9PT0gc2xvdE9yQ29udGFpbmVyKSB7XG5cdFx0XHRcdFx0dGhpcy5fc2xvdHNPYmplY3RbaV0gPSBudWxsO1xuXG5cdFx0XHRcdFx0Y29udGFpbmVyVG9SZW1vdmUgPSBzbG90T3JDb250YWluZXI7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjb25zdCBzbG90ID0gdGhpcy5nZXRTbG90RnJvbVJlZihzbG90T3JDb250YWluZXIpO1xuXG5cdFx0XHRjb250YWluZXJUb1JlbW92ZSA9IHRoaXMuX3Nsb3RzT2JqZWN0W3Nsb3QuZGF0YS5uYW1lXT8uY29udGFpbmVyO1xuXHRcdFx0dGhpcy5fc2xvdHNPYmplY3Rbc2xvdC5kYXRhLm5hbWVdID0gbnVsbDtcblx0XHR9XG5cblx0XHRpZiAoY29udGFpbmVyVG9SZW1vdmUpIHtcblx0XHRcdHRoaXMucmVtb3ZlQ2hpbGQoY29udGFpbmVyVG9SZW1vdmUpO1xuXG5cdFx0XHRjb250YWluZXJUb1JlbW92ZS5pbmNsdWRlSW5CdWlsZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYWxsIFBpeGlKUyBjb250YWluZXJzIGF0dGFjaGVkIHRvIGFueSBzbG90LlxuXHQgKi9cblx0cHVibGljIHJlbW92ZVNsb3RPYmplY3RzICgpIHtcblx0XHRPYmplY3QuZW50cmllcyh0aGlzLl9zbG90c09iamVjdCkuZm9yRWFjaCgoW3Nsb3ROYW1lLCBzbG90T2JqZWN0XSkgPT4ge1xuXHRcdFx0aWYgKHNsb3RPYmplY3QpIHNsb3RPYmplY3QuY29udGFpbmVyLnJlbW92ZUZyb21QYXJlbnQoKTtcblx0XHRcdGRlbGV0ZSB0aGlzLl9zbG90c09iamVjdFtzbG90TmFtZV07XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyBhIGNvbnRhaW5lciBhdHRhY2hlZCB0byBhIHNsb3QsIG9yIHVuZGVmaW5lZCBpZiBubyBjb250YWluZXIgaXMgYXR0YWNoZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSBzbG90UmVmIC0gVGhlIHNsb3QgaWQgb3Igc2xvdCB0byBnZXQgdGhlIGF0dGFjaG1lbnQgZnJvbVxuXHQgKiBAcmV0dXJucyAtIFRoZSBjb250YWluZXIgYXR0YWNoZWQgdG8gdGhlIHNsb3Rcblx0ICovXG5cdHB1YmxpYyBnZXRTbG90T2JqZWN0IChzbG90OiBudW1iZXIgfCBzdHJpbmcgfCBTbG90KSB7XG5cdFx0c2xvdCA9IHRoaXMuZ2V0U2xvdEZyb21SZWYoc2xvdCk7XG5cblx0XHRyZXR1cm4gdGhpcy5fc2xvdHNPYmplY3Rbc2xvdC5kYXRhLm5hbWVdPy5jb250YWluZXI7XG5cdH1cblxuXHRwcm90ZWN0ZWQgdXBkYXRlQm91bmRzICgpIHtcblx0XHR0aGlzLl9ib3VuZHNEaXJ0eSA9IGZhbHNlO1xuXG5cdFx0dGhpcy5za2VsZXRvbkJvdW5kcyB8fD0gbmV3IFNrZWxldG9uQm91bmRzKCk7XG5cblx0XHRjb25zdCBza2VsZXRvbkJvdW5kcyA9IHRoaXMuc2tlbGV0b25Cb3VuZHM7XG5cblx0XHRza2VsZXRvbkJvdW5kcy51cGRhdGUodGhpcy5za2VsZXRvbiwgdHJ1ZSk7XG5cblx0XHRpZiAodGhpcy5fYm91bmRzUHJvdmlkZXIpIHtcblx0XHRcdGNvbnN0IGJvdW5kc1NwaW5lID0gdGhpcy5fYm91bmRzUHJvdmlkZXIuY2FsY3VsYXRlQm91bmRzKHRoaXMpO1xuXG5cdFx0XHRjb25zdCBib3VuZHMgPSB0aGlzLl9ib3VuZHM7XG5cdFx0XHRib3VuZHMuY2xlYXIoKTtcblxuXHRcdFx0Ym91bmRzLnggPSBib3VuZHNTcGluZS54O1xuXHRcdFx0Ym91bmRzLnkgPSBib3VuZHNTcGluZS55O1xuXHRcdFx0Ym91bmRzLndpZHRoID0gYm91bmRzU3BpbmUud2lkdGg7XG5cdFx0XHRib3VuZHMuaGVpZ2h0ID0gYm91bmRzU3BpbmUuaGVpZ2h0O1xuXG5cdFx0fSBlbHNlIGlmIChza2VsZXRvbkJvdW5kcy5taW5YID09PSBJbmZpbml0eSkge1xuXHRcdFx0aWYgKHRoaXMuaGFzTmV2ZXJVcGRhdGVkKSB7XG5cdFx0XHRcdHRoaXMuX3VwZGF0ZUFuZEFwcGx5U3RhdGUoMCk7XG5cdFx0XHRcdHRoaXMuX2JvdW5kc0RpcnR5ID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLl92YWxpZGF0ZUFuZFRyYW5zZm9ybUF0dGFjaG1lbnRzKCk7XG5cblx0XHRcdGNvbnN0IGRyYXdPcmRlciA9IHRoaXMuc2tlbGV0b24uZHJhd09yZGVyO1xuXHRcdFx0Y29uc3QgYm91bmRzID0gdGhpcy5fYm91bmRzO1xuXG5cdFx0XHRib3VuZHMuY2xlYXIoKTtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBkcmF3T3JkZXIubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Y29uc3Qgc2xvdCA9IGRyYXdPcmRlcltpXTtcblxuXHRcdFx0XHRjb25zdCBhdHRhY2htZW50ID0gc2xvdC5nZXRBdHRhY2htZW50KCk7XG5cblx0XHRcdFx0aWYgKGF0dGFjaG1lbnQgJiYgKGF0dGFjaG1lbnQgaW5zdGFuY2VvZiBSZWdpb25BdHRhY2htZW50IHx8IGF0dGFjaG1lbnQgaW5zdGFuY2VvZiBNZXNoQXR0YWNobWVudCkpIHtcblx0XHRcdFx0XHRjb25zdCBjYWNoZURhdGEgPSB0aGlzLl9nZXRDYWNoZWREYXRhKHNsb3QsIGF0dGFjaG1lbnQpO1xuXG5cdFx0XHRcdFx0Ym91bmRzLmFkZFZlcnRleERhdGEoY2FjaGVEYXRhLnZlcnRpY2VzLCAwLCBjYWNoZURhdGEudmVydGljZXMubGVuZ3RoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMuX2JvdW5kcy5taW5YID0gc2tlbGV0b25Cb3VuZHMubWluWDtcblx0XHRcdHRoaXMuX2JvdW5kcy5taW5ZID0gc2tlbGV0b25Cb3VuZHMubWluWTtcblx0XHRcdHRoaXMuX2JvdW5kcy5tYXhYID0gc2tlbGV0b25Cb3VuZHMubWF4WDtcblx0XHRcdHRoaXMuX2JvdW5kcy5tYXhZID0gc2tlbGV0b25Cb3VuZHMubWF4WTtcblx0XHR9XG5cdH1cblxuXHQvKiogQGludGVybmFsICovXG5cdGFkZEJvdW5kcyAoYm91bmRzOiBCb3VuZHMpIHtcblx0XHRib3VuZHMuYWRkQm91bmRzKHRoaXMuYm91bmRzKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBEZXN0cm95cyB0aGlzIHNwcml0ZSByZW5kZXJhYmxlIGFuZCBvcHRpb25hbGx5IGl0cyB0ZXh0dXJlLlxuXHQgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbnMgcGFyYW1ldGVyLiBBIGJvb2xlYW4gd2lsbCBhY3QgYXMgaWYgYWxsIG9wdGlvbnNcblx0ICogIGhhdmUgYmVlbiBzZXQgdG8gdGhhdCB2YWx1ZVxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRleHR1cmU9ZmFsc2VdIC0gU2hvdWxkIGl0IGRlc3Ryb3kgdGhlIGN1cnJlbnQgdGV4dHVyZSBvZiB0aGUgcmVuZGVyYWJsZSBhcyB3ZWxsXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudGV4dHVyZVNvdXJjZT1mYWxzZV0gLSBTaG91bGQgaXQgZGVzdHJveSB0aGUgdGV4dHVyZVNvdXJjZSBvZiB0aGUgcmVuZGVyYWJsZSBhcyB3ZWxsXG5cdCAqL1xuXHRwdWJsaWMgb3ZlcnJpZGUgZGVzdHJveSAob3B0aW9uczogRGVzdHJveU9wdGlvbnMgPSBmYWxzZSkge1xuXHRcdHN1cGVyLmRlc3Ryb3kob3B0aW9ucyk7XG5cblx0XHRUaWNrZXIuc2hhcmVkLnJlbW92ZSh0aGlzLmludGVybmFsVXBkYXRlLCB0aGlzKTtcblx0XHR0aGlzLnN0YXRlLmNsZWFyTGlzdGVuZXJzKCk7XG5cdFx0dGhpcy5kZWJ1ZyA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLnNrZWxldG9uID0gbnVsbCBhcyBhbnk7XG5cdFx0dGhpcy5zdGF0ZSA9IG51bGwgYXMgYW55O1xuXHRcdCh0aGlzLl9zbG90c09iamVjdCBhcyBhbnkpID0gbnVsbDtcblx0XHR0aGlzLl9sYXN0QXR0YWNobWVudHMubGVuZ3RoID0gMDtcblx0XHR0aGlzLmF0dGFjaG1lbnRDYWNoZURhdGEgPSBudWxsIGFzIGFueTtcblx0fVxuXG5cdC8qKiBDb252ZXJ0cyBhIHBvaW50IGZyb20gdGhlIHNrZWxldG9uIGNvb3JkaW5hdGUgc3lzdGVtIHRvIHRoZSBQaXhpIHdvcmxkIGNvb3JkaW5hdGUgc3lzdGVtLiAqL1xuXHRwdWJsaWMgc2tlbGV0b25Ub1BpeGlXb3JsZENvb3JkaW5hdGVzIChwb2ludDogeyB4OiBudW1iZXI7IHk6IG51bWJlciB9KSB7XG5cdFx0dGhpcy53b3JsZFRyYW5zZm9ybS5hcHBseShwb2ludCwgcG9pbnQpO1xuXHR9XG5cblx0LyoqIENvbnZlcnRzIGEgcG9pbnQgZnJvbSB0aGUgUGl4aSB3b3JsZCBjb29yZGluYXRlIHN5c3RlbSB0byB0aGUgc2tlbGV0b24gY29vcmRpbmF0ZSBzeXN0ZW0uICovXG5cdHB1YmxpYyBwaXhpV29ybGRDb29yZGluYXRlc1RvU2tlbGV0b24gKHBvaW50OiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0pIHtcblx0XHR0aGlzLndvcmxkVHJhbnNmb3JtLmFwcGx5SW52ZXJzZShwb2ludCwgcG9pbnQpO1xuXHR9XG5cblx0LyoqIENvbnZlcnRzIGEgcG9pbnQgZnJvbSB0aGUgUGl4aSB3b3JsZCBjb29yZGluYXRlIHN5c3RlbSB0byB0aGUgYm9uZSdzIGxvY2FsIGNvb3JkaW5hdGUgc3lzdGVtLiAqL1xuXHRwdWJsaWMgcGl4aVdvcmxkQ29vcmRpbmF0ZXNUb0JvbmUgKHBvaW50OiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0sIGJvbmU6IEJvbmUpIHtcblx0XHR0aGlzLnBpeGlXb3JsZENvb3JkaW5hdGVzVG9Ta2VsZXRvbihwb2ludCk7XG5cdFx0aWYgKGJvbmUucGFyZW50KSB7XG5cdFx0XHRib25lLnBhcmVudC53b3JsZFRvTG9jYWwocG9pbnQgYXMgVmVjdG9yMik7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ym9uZS53b3JsZFRvTG9jYWwocG9pbnQgYXMgVmVjdG9yMik7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFVzZSB0aGlzIG1ldGhvZCB0byBpbnN0YW50aWF0ZSBhIFNwaW5lIGdhbWUgb2JqZWN0LlxuXHQgKiBCZWZvcmUgaW5zdGFudGlhdGluZyBhIFNwaW5lIGdhbWUgb2JqZWN0LCB0aGUgc2tlbGV0b24gKGAuc2tlbGAgb3IgYC5qc29uYCkgYW5kIHRoZSBhdGxhcyB0ZXh0IGZpbGVzIG11c3QgYmUgbG9hZGVkIGludG8gdGhlIEFzc2V0cy4gRm9yIGV4YW1wbGU6XG5cdCAqIGBgYFxuXHQgKiBQSVhJLkFzc2V0cy5hZGQoXCJzYWNrRGF0YVwiLCBcIi4vYXNzZXRzL3NhY2stcHJvLnNrZWxcIik7XG5cdCAqIFBJWEkuQXNzZXRzLmFkZChcInNhY2tBdGxhc1wiLCBcIi4vYXNzZXRzL3NhY2stcG1hLmF0bGFzXCIpO1xuXHQgKiBhd2FpdCBQSVhJLkFzc2V0cy5sb2FkKFtcInNhY2tEYXRhXCIsIFwic2Fja0F0bGFzXCJdKTtcblx0ICogYGBgXG5cdCAqIE9uY2UgYSBTcGluZSBnYW1lIG9iamVjdCBpcyBjcmVhdGVkLCBpdHMgc2tlbGV0b24gZGF0YSBpcyBjYWNoZWQgaW50byB7QGxpbmsgQ2FjaGV9IHVzaW5nIHRoZSBrZXk6XG5cdCAqIGAke3NrZWxldG9uQXNzZXROYW1lfS0ke2F0bGFzQXNzZXROYW1lfS0ke29wdGlvbnM/LnNjYWxlID8/IDF9YFxuXHQgKlxuXHQgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbnMgdG8gY29uZmlndXJlIHRoZSBTcGluZSBnYW1lIG9iamVjdC4gU2VlIHtAbGluayBTcGluZUZyb21PcHRpb25zfVxuXHQgKiBAcmV0dXJucyB7U3BpbmV9IFRoZSBTcGluZSBnYW1lIG9iamVjdCBpbnN0YW50aWF0ZWRcblx0ICovXG5cdHN0YXRpYyBmcm9tICh7IHNrZWxldG9uLCBhdGxhcywgc2NhbGUgPSAxLCBkYXJrVGludCwgYXV0b1VwZGF0ZSA9IHRydWUsIGJvdW5kc1Byb3ZpZGVyIH06IFNwaW5lRnJvbU9wdGlvbnMpIHtcblx0XHRjb25zdCBjYWNoZUtleSA9IGAke3NrZWxldG9ufS0ke2F0bGFzfS0ke3NjYWxlfWA7XG5cblx0XHRpZiAoQ2FjaGUuaGFzKGNhY2hlS2V5KSkge1xuXHRcdFx0cmV0dXJuIG5ldyBTcGluZSh7XG5cdFx0XHRcdHNrZWxldG9uRGF0YTogQ2FjaGUuZ2V0PFNrZWxldG9uRGF0YT4oY2FjaGVLZXkpLFxuXHRcdFx0XHRkYXJrVGludCxcblx0XHRcdFx0YXV0b1VwZGF0ZSxcblx0XHRcdFx0Ym91bmRzUHJvdmlkZXIsXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCBza2VsZXRvbkFzc2V0ID0gQXNzZXRzLmdldDxhbnkgfCBVaW50OEFycmF5Pihza2VsZXRvbik7XG5cblx0XHRjb25zdCBhdGxhc0Fzc2V0ID0gQXNzZXRzLmdldDxUZXh0dXJlQXRsYXM+KGF0bGFzKTtcblx0XHRjb25zdCBhdHRhY2htZW50TG9hZGVyID0gbmV3IEF0bGFzQXR0YWNobWVudExvYWRlcihhdGxhc0Fzc2V0KTtcblx0XHRjb25zdCBwYXJzZXIgPSBza2VsZXRvbkFzc2V0IGluc3RhbmNlb2YgVWludDhBcnJheVxuXHRcdFx0PyBuZXcgU2tlbGV0b25CaW5hcnkoYXR0YWNobWVudExvYWRlcilcblx0XHRcdDogbmV3IFNrZWxldG9uSnNvbihhdHRhY2htZW50TG9hZGVyKTtcblxuXHRcdHBhcnNlci5zY2FsZSA9IHNjYWxlO1xuXHRcdGNvbnN0IHNrZWxldG9uRGF0YSA9IHBhcnNlci5yZWFkU2tlbGV0b25EYXRhKHNrZWxldG9uQXNzZXQpO1xuXG5cdFx0Q2FjaGUuc2V0KGNhY2hlS2V5LCBza2VsZXRvbkRhdGEpO1xuXG5cdFx0cmV0dXJuIG5ldyBTcGluZSh7XG5cdFx0XHRza2VsZXRvbkRhdGEsXG5cdFx0XHRkYXJrVGludCxcblx0XHRcdGF1dG9VcGRhdGUsXG5cdFx0XHRib3VuZHNQcm92aWRlcixcblx0XHR9KTtcblx0fVxufVxuIl19