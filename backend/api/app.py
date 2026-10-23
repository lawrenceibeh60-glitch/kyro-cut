from __future__ import annotations
import os
from flask import Flask, jsonify, request
from flask_cors import CORS

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
        payload = request.get_json(silent=True)
        issues = []
        if not isinstance(payload, dict):
            issues.append({"path": "$", "message": "Project must be a JSON object."})
        else:
            if payload.get("format") != "kyro-cut":
                issues.append({"path": "format", "message": "Unsupported project format."})
            if not isinstance(payload.get("version"), int) or isinstance(payload.get("version"), bool) or payload["version"] != 1:
                issues.append({"path": "version", "message": "Only project version 1 is currently supported."})
            if not isinstance(payload.get("id"), str) or not payload["id"].strip():
                issues.append({"path": "id", "message": "Project id is required."})
            if not isinstance(payload.get("name"), str) or not payload["name"].strip():
                issues.append({"path": "name", "message": "Project name is required."})
            comps = payload.get("compositions")
            if not isinstance(comps, list) or not comps:
                issues.append({"path": "compositions", "message": "At least one composition is required."})
            else:
                ids = set()
                for i, comp in enumerate(comps):
                    if not isinstance(comp, dict):
                        issues.append({"path": f"compositions[{i}]", "message": "Composition must be an object."})
                        continue
                    cid = comp.get("id")
                    if not isinstance(cid, str) or not cid or cid in ids:
                        issues.append({"path": f"compositions[{i}].id", "message": "Composition ids must be present and unique."})
                    ids.add(cid)
                    for key in ("width", "height", "durationFrames"):
                        value = comp.get(key)
                        if not isinstance(value, int) or isinstance(value, bool) or value < 1:
                            issues.append({"path": f"compositions[{i}].{key}", "message": "Must be a positive integer."})
                    fps = comp.get("frameRate")
                    if not isinstance(fps, (int, float)) or isinstance(fps, bool) or not 0 < fps <= 240:
                        issues.append({"path": f"compositions[{i}].frameRate", "message": "Must be in (0, 240]."})
                    if not isinstance(comp.get("layers"), list):
                        issues.append({"path": f"compositions[{i}].layers", "message": "Layers must be an array."})
                if payload.get("activeCompositionId") not in ids:
                    issues.append({"path": "activeCompositionId", "message": "Must reference an existing composition."})
        return jsonify({"valid": not issues, "issues": issues}), (200 if not issues else 422)

    return app

app = create_app()
