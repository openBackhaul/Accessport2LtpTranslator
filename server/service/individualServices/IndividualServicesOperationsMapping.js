module.exports.individualServicesOperationsMapping =
    {
        // A2LT actions
        "/v1/bequeath-your-data-and-die": {
            "/v1/bequeath-your-data-and-die": {
                "api-segment": "im",
                "sequence": "000"
            }
        },
        "/v1/translate-equipment-sequence-ids-to-ltp-uuids": {
            "/v1/translate-equipment-sequence-ids-to-ltp-uuids": {
                "api-segment": "is",
                "sequence": "000"
            }
        },
        "/core-model-1-4:network-control-domain=cache/control-construct={mountName}": {
            "/core-model-1-4:network-control-domain=cache/control-construct={mountName}": {
                "api-segment": "is",
                "sequence": "000"
            }
        },
        "/core-model-1-4:network-control-domain=cache/control-construct={mountName}/equipment={uuid}": {
            "/core-model-1-4:network-control-domain=cache/control-construct={mountName}/equipment={uuid}": {
                "api-segment": "is",
                "sequence": "001"
            }
        },
        "/core-model-1-4:network-control-domain=cache/control-construct={mountName}/logical-termination-point={uuid}": {
            "/core-model-1-4:network-control-domain=cache/control-construct={mountName}/logical-termination-point={uuid}": {
                "api-segment": "is",
                "sequence": "002"
            }
        }
    }
