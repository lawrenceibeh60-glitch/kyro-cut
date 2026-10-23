from backend.api.app import create_app

def test_health_endpoint():
    response = create_app().test_client().get("/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"

def test_validation_rejects_invalid_document():
    response = create_app().test_client().post("/api/v1/projects/validate", json={})
    assert response.status_code == 422
    assert response.get_json()["valid"] is False

def test_validation_accepts_minimal_valid_document():
    project = {
        "format": "kyro-cut", "version": 1, "id": "p1", "name": "Test",
        "activeCompositionId": "c1",
        "compositions": [{"id": "c1", "width": 1920, "height": 1080, "frameRate": 24,
                          "durationFrames": 240, "layers": []}],
    }
    response = create_app().test_client().post("/api/v1/projects/validate", json=project)
    assert response.status_code == 200
    assert response.get_json()["valid"] is True

def test_project_validation_rejects_missing_timeline_layer_reference():
    project = {
        "format": "kyro-cut", "version": 1, "id": "p1", "name": "Test",
        "activeCompositionId": "c1",
        "compositions": [{"id": "c1", "width": 1920, "height": 1080, "frameRate": 24,
                          "durationFrames": 240, "layers": []}],
        "timeline": {
            "id": "t1", "frameRate": 24, "durationFrames": 240, "markers": [],
            "tracks": [{"id": "v1", "name": "Video 1", "kind": "video",
                        "locked": False, "muted": False,
                        "clips": [{"id": "clip1", "layerId": "missing", "trackId": "v1",
                                   "kind": "video", "startFrame": 0, "sourceInFrame": 0,
                                   "durationFrames": 240, "playbackRate": 1}]}],
        },
    }
    response = create_app().test_client().post("/api/v1/projects/validate", json=project)
    assert response.status_code == 422
    assert any(issue["path"].endswith("layerId") for issue in response.get_json()["issues"])
