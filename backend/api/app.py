from __future__ import annotations

import math
import os
from typing import Any

from flask import Flask, jsonify, request
from flask_cors import CORS

PROJECT_FORMAT = "kyro-cut"
SUPPORTED_VERSION = 1
ASSET_KINDS = {"image", "video", "audio", "font", "other"}
LAYER_KINDS = {"shape", "text", "image", "video", "audio"}
EFFECT_TYPES = {"glow", "speed-lines", "impact-ring", "motion-trail"}


def _finite(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def validate_project_payload(payload: Any) -> list[dict[str, str]]:
    issues: list[dict[str, str]] = []

    def issue(path: str, message: str) -> None:
        issues.append({"path": path, "message": message})

    if not isinstance(payload, dict):
        return [{"path": "$", "message": "Project must be a JSON object."}]
    if payload.get("format") != PROJECT_FORMAT:
        issue("format", "Unsupported project format.")
    version = payload.get("version")
    if not isinstance(version, int) or isinstance(version, bool) or version != SUPPORTED_VERSION:
        issue("version", "Only project version 1 is currently supported.")
    if not isinstance(payload.get("id"), str) or not payload["id"].strip():
        issue("id", "Project id is required.")
    if not isinstance(payload.get("name"), str) or not payload["name"].strip():
        issue("name", "Project name is required.")

    asset_ids: set[str] = set()
    assets = payload.get("assets", [])
    if not isinstance(assets, list):
        issue("assets", "Assets must be an array.")
        assets = []
    for index, asset in enumerate(assets):
        path = f"assets[{index}]"
        if not isinstance(asset, dict):
            issue(path, "Asset must be an object.")
            continue
        asset_id = asset.get("id")
        if not isinstance(asset_id, str) or not asset_id or asset_id in asset_ids:
            issue(path + ".id", "Asset ids must be present and unique.")
        if isinstance(asset_id, str):
            asset_ids.add(asset_id)
        if not isinstance(asset.get("name"), str) or not asset["name"].strip():
            issue(path + ".name", "Asset name is required.")
        if not isinstance(asset.get("kind"), str) or asset.get("kind") not in ASSET_KINDS:
            issue(path + ".kind", "Unsupported asset kind.")
        if not isinstance(asset.get("mimeType"), str) or not isinstance(asset.get("storageKey"), str):
            issue(path, "Asset metadata is malformed.")
        size = asset.get("sizeBytes")
        modified = asset.get("lastModified")
        if not isinstance(size, int) or isinstance(size, bool) or size < 0 or not _finite(modified):
            issue(path, "Asset size or modification metadata is malformed.")

    compositions = payload.get("compositions")
    if not isinstance(compositions, list) or not compositions:
        issue("compositions", "At least one composition is required.")
        compositions = []
    composition_ids: set[str] = set()
    layer_ids: set[str] = set()
    for index, comp in enumerate(compositions):
        path = f"compositions[{index}]"
        if not isinstance(comp, dict):
            issue(path, "Composition must be an object.")
            continue
        comp_id = comp.get("id")
        if not isinstance(comp_id, str) or not comp_id or comp_id in composition_ids:
            issue(path + ".id", "Composition ids must be present and unique.")
        if isinstance(comp_id, str):
            composition_ids.add(comp_id)
        for dimension in ("width", "height", "durationFrames"):
            value = comp.get(dimension)
            if not isinstance(value, int) or isinstance(value, bool) or value < 1:
                issue(path + "." + dimension, "Must be a positive integer.")
        fps = comp.get("frameRate")
        if not _finite(fps) or not 0 < fps <= 240:
            issue(path + ".frameRate", "Must be in (0, 240].")
        layers = comp.get("layers")
        if not isinstance(layers, list):
            issue(path + ".layers", "Layers must be an array.")
            continue
        for layer_index, layer in enumerate(layers):
            lp = f"{path}.layers[{layer_index}]"
            if not isinstance(layer, dict):
                issue(lp, "Layer must be an object.")
                continue
            layer_id = layer.get("id")
            if not isinstance(layer_id, str) or not layer_id or layer_id in layer_ids:
                issue(lp + ".id", "Layer ids must be present and unique.")
            if isinstance(layer_id, str):
                layer_ids.add(layer_id)
            if not isinstance(layer.get("name"), str) or not layer["name"].strip():
                issue(lp + ".name", "Layer name is required.")
            if not isinstance(layer.get("kind"), str) or layer.get("kind") not in LAYER_KINDS:
                issue(lp + ".kind", "Unsupported layer kind.")
            if not isinstance(layer.get("enabled"), bool):
                issue(lp + ".enabled", "Layer enabled state must be boolean.")
            asset_id = layer.get("assetId")
            if asset_id is not None and (not isinstance(asset_id, str) or asset_id not in asset_ids):
                issue(lp + ".assetId", "Layer asset reference must exist in the project asset list.")
            transform = layer.get("transform")
            transform_keys = ("x", "y", "scaleX", "scaleY", "rotation", "opacity")
            if not isinstance(transform, dict) or not all(_finite(transform.get(key)) for key in transform_keys):
                issue(lp + ".transform", "Transform must contain finite position, scale, rotation and opacity values.")
            elif not 0 <= transform["opacity"] <= 1:
                issue(lp + ".transform.opacity", "Opacity must be between 0 and 1.")
            for axis in ("x", "y"):
                prop = layer.get(axis)
                if not isinstance(prop, dict) or not isinstance(prop.get("id"), str) or not isinstance(prop.get("name"), str) or not _finite(prop.get("value")) or not isinstance(prop.get("keyframes"), list):
                    issue(lp + "." + axis, "Animatable property is malformed.")
                    continue
                frames: set[int] = set()
                for key_index, key in enumerate(prop["keyframes"]):
                    kp = f"{lp}.{axis}.keyframes[{key_index}]"
                    if not isinstance(key, dict):
                        issue(kp, "Keyframe must be an object.")
                        continue
                    frame = key.get("frame")
                    if not isinstance(frame, int) or isinstance(frame, bool) or frame < 0 or not _finite(key.get("value")) or not isinstance(key.get("interpolation"), str) or key.get("interpolation") not in {"hold", "linear", "bezier"}:
                        issue(kp, "Keyframe requires a non-negative integer frame, finite value and supported interpolation.")
                    elif frame in frames:
                        issue(kp + ".frame", "Keyframe frames must be unique within a property.")
                    else:
                        frames.add(frame)
                    bezier = key.get("bezier")
                    if bezier is not None and (not isinstance(bezier, dict) or not all(_finite(bezier.get(axis)) and 0 <= bezier[axis] <= 1 for axis in ("x1", "y1", "x2", "y2"))):
                        issue(kp + ".bezier", "Bezier controls must be finite values between 0 and 1.")
            effects = layer.get("effects", [])
            if not isinstance(effects, list):
                issue(lp + ".effects", "Effects must be an array.")
                continue
            for effect_index, effect in enumerate(effects):
                ep = f"{lp}.effects[{effect_index}]"
                if not isinstance(effect, dict):
                    issue(ep, "Effect must be an object.")
                    continue
                if not isinstance(effect.get("type"), str) or effect.get("type") not in EFFECT_TYPES:
                    issue(ep + ".type", "Unsupported effect type.")
                if not isinstance(effect.get("id"), str) or not effect["id"]:
                    issue(ep + ".id", "Effect id is required.")
                if not isinstance(effect.get("enabled"), bool):
                    issue(ep + ".enabled", "Effect enabled state must be boolean.")
                if not isinstance(effect.get("version"), int) or effect.get("version", 0) < 1:
                    issue(ep + ".version", "Effect version must be a positive integer.")
                params = effect.get("params")
                if not isinstance(params, dict) or any(not isinstance(v, (str, bool, int, float)) or (isinstance(v, float) and not math.isfinite(v)) for v in params.values()):
                    issue(ep + ".params", "Effect parameters must be finite scalar values.")

    active_id = payload.get("activeCompositionId")
    if not isinstance(active_id, str) or active_id not in composition_ids:
        issue("activeCompositionId", "Must reference an existing composition.")

    timeline = payload.get("timeline")
    if timeline is not None:
        if not isinstance(timeline, dict):
            issue("timeline", "Timeline must be an object.")
        else:
            duration = timeline.get("durationFrames")
            if not isinstance(duration, int) or isinstance(duration, bool) or duration < 1:
                issue("timeline.durationFrames", "Timeline duration must be a positive integer.")
            fps = timeline.get("frameRate")
            if not _finite(fps) or not 0 < fps <= 240:
                issue("timeline.frameRate", "Timeline frame rate must be in (0, 240].")
            tracks = timeline.get("tracks")
            if not isinstance(tracks, list):
                issue("timeline.tracks", "Timeline tracks must be an array.")
                tracks = []
            track_ids: set[str] = set()
            clip_ids: set[str] = set()
            for track_index, track in enumerate(tracks):
                tp = f"timeline.tracks[{track_index}]"
                if not isinstance(track, dict):
                    issue(tp, "Track must be an object.")
                    continue
                track_id = track.get("id")
                if not isinstance(track_id, str) or not track_id or track_id in track_ids:
                    issue(tp + ".id", "Track ids must be present and unique.")
                if isinstance(track_id, str):
                    track_ids.add(track_id)
                clips = track.get("clips")
                if not isinstance(clips, list):
                    issue(tp + ".clips", "Track clips must be an array.")
                    continue
                for clip_index, clip in enumerate(clips):
                    cp = f"{tp}.clips[{clip_index}]"
                    if not isinstance(clip, dict):
                        issue(cp, "Clip must be an object.")
                        continue
                    clip_id = clip.get("id")
                    if not isinstance(clip_id, str) or not clip_id or clip_id in clip_ids:
                        issue(cp + ".id", "Clip ids must be present and unique.")
                    if isinstance(clip_id, str):
                        clip_ids.add(clip_id)
                    if clip.get("trackId") != track_id:
                        issue(cp + ".trackId", "Clip track reference does not match its containing track.")
                    if clip.get("layerId") is not None and (not isinstance(clip.get("layerId"), str) or clip.get("layerId") not in layer_ids):
                        issue(cp + ".layerId", "Clip must reference an existing layer.")
                    if clip.get("assetId") is not None and (not isinstance(clip.get("assetId"), str) or clip.get("assetId") not in asset_ids):
                        issue(cp + ".assetId", "Clip must reference an existing asset.")
                    for key in ("startFrame", "sourceInFrame", "durationFrames"):
                        value = clip.get(key)
                        if not isinstance(value, int) or isinstance(value, bool) or value < 0:
                            issue(cp + "." + key, "Clip frame values must be non-negative integers.")
                    if not isinstance(clip.get("durationFrames"), int) or isinstance(clip.get("durationFrames"), bool) or clip.get("durationFrames", 0) < 1:
                        issue(cp + ".durationFrames", "Clip duration must be at least one frame.")
                    if not _finite(clip.get("playbackRate")) or clip.get("playbackRate", 0) <= 0:
                        issue(cp + ".playbackRate", "Playback rate must be positive.")
                    if isinstance(duration, int) and isinstance(clip.get("startFrame"), int) and isinstance(clip.get("durationFrames"), int) and clip["startFrame"] + clip["durationFrames"] > duration:
                        issue(cp, "Clip extends beyond timeline duration.")
    return issues


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 512 * 1024 * 1024
    origins = os.getenv("CORS_ORIGINS", "*").split(",")
    CORS(app, resources={r"/api/*": {"origins": origins}})

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "kyro-cut-api", "version": "0.1.0"})

    @app.get("/api/v1")
    def api_index():
        return jsonify({"name": "KYRO CUT API", "version": "v1", "capabilities": ["health", "project-format-validation"]})

    @app.post("/api/v1/projects/validate")
    def validate_project():
        issues = validate_project_payload(request.get_json(silent=True))
        return jsonify({"valid": not issues, "issues": issues}), (200 if not issues else 422)

    return app


app = create_app()
