const controlConstructUtil = require('./ControlConstructUtil');
const requestUtil = require('./RequestUtil');
const restClient = require('./RestClient');
const logger = require('../LoggingService.js').getLogger();

exports.handleTranslateEquipmentSequenceIDsToLTPUUIDs = async function (mountName, stringOfConcatenatedSequenceIDs, topLevelEquipmentUUID) {

    logger.info('translation starting with params: mountName:' + mountName + " stringOfConcatenatedSequenceIDs:" + stringOfConcatenatedSequenceIDs
        + " topLevelEquipmentUUID:" + topLevelEquipmentUUID);

    //1. GET ReadingUuidsOfTopLevelEquipment
    let {
        equipmentList,
        validationErrorStep1
    } = await step1ReadingUuidsOfTopLevelEquipment(mountName, topLevelEquipmentUUID);

    if (validationErrorStep1) {
        logger.error(validationErrorStep1);
        return {};
    }

    //2. GET ReadingEquipmentDataOfTopLevelElement
    let {
        containedHolders,
        connectors,
        topLevelRequestUUID,
        validationErrorStep2
    } = await step2ReadingEquipmentDataOfTopLevelElement(topLevelEquipmentUUID, equipmentList, mountName);

    if (validationErrorStep2) {
        logger.error(validationErrorStep2);
        return {};
    }

    //3. GET ReadingEquipmentDataInHolder
    let {
        pairResult,
        validationErrorStep3
    } = await step3ReadingEquipmentDataInHolder(stringOfConcatenatedSequenceIDs, connectors, containedHolders, topLevelRequestUUID, mountName);

    if (validationErrorStep3) {
        logger.error(validationErrorStep3);
        return {};
    }

    //4. GET ReadingAugmentOfAllLtps
    let {ltps, validationErrorStep4} = await step4ReadingAugmentOfAllLtps(mountName);

    if (validationErrorStep4) {
        logger.error(validationErrorStep4);
        return {};
    }

    let resultList = [];

    //5. GET ReadingServingLtp
    let {
        clientLtps,
        resultListStep5Entry,
        validationErrorStep5
    } = await step5ReadingServingLtp(ltps, pairResult.equipmentUUID, pairResult.connectorLocalID, mountName);

    if (validationErrorStep5) {
        logger.error(validationErrorStep5);
        return {};
    }

    resultList.push(resultListStep5Entry);

    //6. GET ReadingClientLtp
    let {
        resultListStep6Entries,
        validationErrorStep6
    } = await step6ReadingClientLtp(clientLtps, mountName);

    if (validationErrorStep6) {
        logger.error(validationErrorStep6);
        return {};
    }

    resultList = resultList.concat(resultListStep6Entries);

    logger.info('translation completed with result: ' + JSON.stringify(resultList));

    return {
        "access-port-to-ltp-mappings": resultList
    };
}

function validateResultStep1(callResult) {

    if (callResult) {
        if (callResult.code !== 500) {
            let constructList = callResult["core-model-1-4:control-construct"];

            //check for invalid return value
            //often mwdi returns [{}] for empty result
            let emptyResult = constructList && constructList.length === 1 && Object.keys(constructList[0]).length === 0;

            if (emptyResult === false) {
                return true;
            }
        }
    }

    return false;
}

/**
 * @param stringOfConcatenatedSequenceIDs
 * @param topLevelConnectors
 * @param topLevelContainedHolders
 * @param topLevelUUID
 * @param mountName
 * @return {Promise<{connectorLocalID: undefined, equipmentUUID: undefined}|string>}
 */
async function step3ReadingEquipmentDataInHolder(stringOfConcatenatedSequenceIDs, topLevelConnectors, topLevelContainedHolders, topLevelUUID, mountName) {

    let validationErrorStep3 = undefined;

    let equipmentUUID = undefined;

    let nextUUID = undefined;
    let connectorsToQuery = topLevelConnectors;
    let holdersToQuery = topLevelContainedHolders;

    // let listOfPairResults = [];
    let pairResult = undefined;

    let listOfSequenceIDs = stringOfConcatenatedSequenceIDs.split('.');
    //note: sequenceIDs are not unique across holders and connectors
    for (const inputSequenceID of listOfSequenceIDs) {

        logger.debug("searching sequence " + inputSequenceID);
        let sequenceID = inputSequenceID.substring(1); //convert "h1" to "1"

        if (inputSequenceID.startsWith("h")) {
            for (const containedHolder of holdersToQuery) {
                let containedHolderSeqId = containedHolder["equipment-augment-1-0:holder-pac"]["sequence-id"];
                logger.debug("checking sequenceId " + sequenceID + " against holderSeqId" + containedHolderSeqId);
                if (sequenceID == containedHolderSeqId) {
                    if (containedHolder["occupying-fru"]) {
                        nextUUID = containedHolder["occupying-fru"];
                        logger.debug("found matching uuid fru: " + nextUUID);
                        break;
                    } else {
                        logger.error("no occupying-fru for contained-holder: " + JSON.stringify(containedHolder));
                    }
                }
            }

            if (nextUUID) {
                let urlAdditionStep3 = await controlConstructUtil.getProfileStringValueByName(
                    "RequestForTranslatingEquipmentSequenceIdCausesReadingDeviceData.ReadingEquipmentDataInHolder");
                let resultWrapperStep3 = await getDataFromMWDI("RequestForTranslatingEquipmentSequenceIdsCausesReadingDeviceData.ReadingEquipmentDataInHolder", mountName, urlAdditionStep3, nextUUID);
                //list of containedHolders, connectors

                //for example {
                //   "core-model-1-4:equipment": [
                //     {
                //       "uuid": "2-LIM 8xEth",
                //       "connector": [
                //         {
                //           "local-id": "LAN-4-RJ45-Connector",
                //           "sequence-id": 1
                //         }
                //       ],
                //       "contained-holder": [
                //         {
                //           "local-id": "2_LAN-7 SFP",
                //           "occupying-fru": "2_LAN-7 SFP",
                //           "sequence-id": 1
                //         },
                //         {
                //           "local-id": "2_LAN-8 SFP",
                //           "occupying-fru": "2_LAN-8 SFP",
                //           "sequence-id": 2
                //         }
                //       ]
                //     }
                //   ]
                // }

                let validResultStep3 = validateResultStep2And3(resultWrapperStep3);

                if (validResultStep3 === false) {
                    validationErrorStep3 = "step3 request not valid: request for " + mountName + " and uuid " + nextUUID + " failed";
                    break;
                }

                logger.debug("updating connectors and holders to query from  " + nextUUID);

                //use holder lists for next loop
                connectorsToQuery = resultWrapperStep3["core-model-1-4:equipment"][0]["connector"];
                holdersToQuery = resultWrapperStep3["core-model-1-4:equipment"][0]["contained-holder"];
            }
        }

        if (inputSequenceID.startsWith("c")) {
            if (nextUUID) {
                equipmentUUID = nextUUID;
            } else {
                // nextUUID = topLevelUUID;
                equipmentUUID = topLevelUUID;
            }

            let connectorLocalID = undefined;

            if (connectorsToQuery) {
                for (const connector of connectorsToQuery) {
                    if (sequenceID == connector["equipment-augment-1-0:connector-pac"]["sequence-id"]) {
                        connectorLocalID = connector["local-id"];
                        break;
                    }
                }
            }

            if (connectorLocalID) {
                pairResult = {equipmentUUID, connectorLocalID};

                //loop should be finished now - connector is last entry
            }
        }
    }

    if (pairResult === undefined && validationErrorStep3 === undefined) {
        validationErrorStep3 = "step3 no results";
    }

    return {pairResult, validationErrorStep3};
}

function buildResultEntry(resultWrapperStep5Or6, requestUUID) {
    //{[clientLtps], [serverLtps], [layer-protocol(layer-protocol-name)]}

    //for example {
    //   "core-model-1-4:logical-termination-point": [
    //         {
    //           "uuid": "LTP-MWS-2_LAN-4-RJ45",
    //           "client-ltp": [
    //             "LTP-ETC-TTP-2_LAN-4-RJ45"
    //           ],
    //           "server-ltp": [
    //             "LTP-ETY-TTP-2_LAN-4-RJ45"
    //           ],
    //           "layer-protocol": [
    //             {
    //               "local-id": "LP-MWS-2_LAN-4-RJ45",
    //               "layer-protocol-name": "pure-ethernet-structure-2-0:LAYER_PROTOCOL_NAME_TYPE_PURE_ETHERNET_STRUCTURE_LAYER"
    //             }
    //           ]
    //         }
    //   ]
    // }

    let clientLtps = [];
    // clientLtp may be not available when reached the lowest request level
    if (resultWrapperStep5Or6["core-model-1-4:logical-termination-point"][0]["client-ltp"] && resultWrapperStep5Or6["core-model-1-4:logical-termination-point"][0]["client-ltp"].length > 0) {
        clientLtps = resultWrapperStep5Or6["core-model-1-4:logical-termination-point"][0]["client-ltp"];
    }

    let serverLtps = [];
    if (resultWrapperStep5Or6["core-model-1-4:logical-termination-point"][0]["server-ltp"] && resultWrapperStep5Or6["core-model-1-4:logical-termination-point"][0]["server-ltp"].length > 0) {
        serverLtps = resultWrapperStep5Or6["core-model-1-4:logical-termination-point"][0]["server-ltp"];
    }

    let listOfLayerProtocolNames = [];
    for (const ltp of resultWrapperStep5Or6["core-model-1-4:logical-termination-point"]) {
        for (const layerProtocol of ltp["layer-protocol"]) {
            listOfLayerProtocolNames.push(layerProtocol["layer-protocol-name"]);
        }
    }

    // return format {list of (uuid, [clientLtps], [serverLtps], [layer-protocol-names])}

    return {
        "uuid": requestUUID,
        "clientLtps": clientLtps,
        "serverLtps": serverLtps,
        "layer-protocol-names": listOfLayerProtocolNames
    };
}

/**
 *
 * @param mountName
 * @param topLevelEquipmentUUID
 * @return {Promise<{equipmentList: undefined, validationError: undefined}>}
 */
async function step1ReadingUuidsOfTopLevelEquipment(mountName, topLevelEquipmentUUID) {
    let equipmentList = undefined;
    let validationErrorStep1 = undefined;

    let urlAdditionStep1 = await controlConstructUtil.getProfileStringValueByName(
        "RequestForTranslatingEquipmentSequenceIdCausesReadingDeviceData.ReadingUuidsOfTopLevelEquipment");
    let step1ResultWrapper = await getDataFromMWDI("RequestForTranslatingEquipmentSequenceIdsCausesReadingDeviceData.ReadingUuidsOfTopLevelEquipment", mountName, urlAdditionStep1);
    // expected format [TopLevelUuids]

    //for example {
    //   "core-model-1-4:control-construct": [
    //     {
    //       "top-level-equipment": [
    //         "2-LIM 8xEth",
    //         "3-RIM 2xRadio",
    //         "1-Core",
    //         "4-RIM 1xEth 10Gb"
    //       ]
    //     }
    //   ]
    // }

    let validResultOfStep1 = validateResultStep1(step1ResultWrapper);

    if (validResultOfStep1 === false) {
        validationErrorStep1 = "step1 result not successful, mwdi reported: " + step1ResultWrapper?.code + " " + step1ResultWrapper?.message;
    } else {
        if (step1ResultWrapper["core-model-1-4:control-construct"].length === 0) {
            validationErrorStep1 = "no top level equipment list in result";
        } else {
            equipmentList = step1ResultWrapper["core-model-1-4:control-construct"][0]["top-level-equipment"];

            if (topLevelEquipmentUUID) {
                //validate uuid against list of top level uuids
                if (equipmentList.includes(topLevelEquipmentUUID) === false) {
                    validationErrorStep1 = "provided topLevelEquipmentUUID not contained in MWDI listOfTopLevelUUIDs";
                }
            }
            //no topLevelEquipmentUUID provided (optional parameter)
            else if (equipmentList.length > 1) {
                //list not valid - too many entries
                validationErrorStep1 = "too many entries in returned topLevelUUIDs";
            } else if (equipmentList.length === 0) {
                validationErrorStep1 = "no entries in returned topLevelUUIDs";
            }
        }
    }

    return {equipmentList, validationErrorStep1};
}

function validateResultStep2And3(callResult) {
    if (callResult) {
        if (callResult.code !== 500) {
            if (callResult["core-model-1-4:equipment"].length > 0) {
                return true;
            }
        }
    }

    return false;
}

/**
 *
 * @param topLevelEquipmentUUID
 * @param equipmentList
 * @param mountName
 * @return {Promise<{topLevelRequestUUID, connectors, validationErrorStep2: undefined, containedHolders}>}
 */
async function step2ReadingEquipmentDataOfTopLevelElement(topLevelEquipmentUUID, equipmentList, mountName) {
    let topLevelRequestUUID;
    if (topLevelEquipmentUUID && equipmentList.includes(topLevelEquipmentUUID)) {
        topLevelRequestUUID = topLevelEquipmentUUID;
    } else {
        topLevelRequestUUID = equipmentList[0];
    }

    let urlAdditionStep2 = await controlConstructUtil.getProfileStringValueByName(
        "RequestForTranslatingEquipmentSequenceIdCausesReadingDeviceData.ReadingEquipmentDataOfTopLevelElement");
    let resultWrapperStep2 = await getDataFromMWDI("RequestForTranslatingEquipmentSequenceIdsCausesReadingDeviceData.ReadingEquipmentDataOfTopLevelElement", mountName, urlAdditionStep2, topLevelRequestUUID);
    //result contains list of containedHolders and list of connectors

    //for example {
    //   "core-model-1-4:equipment": [
    //     {
    //       "uuid": "2-LIM 8xEth",
    //       "connector": [
    //         {
    //           "local-id": "LAN-4-RJ45-Connector",
    //           "sequence-id": 1
    //         }
    //       ],
    //       "contained-holder": [
    //         {
    //           "local-id": "2_LAN-7 SFP",
    //           "occupying-fru": "2_LAN-7 SFP",
    //           "sequence-id": 1
    //         },
    //         {
    //           "local-id": "2_LAN-8 SFP",
    //           "occupying-fru": "2_LAN-8 SFP",
    //           "sequence-id": 2
    //         }
    //       ]
    //     }
    //   ]
    // }

    let validResultStep2 = validateResultStep2And3(resultWrapperStep2);

    let validationErrorStep2 = undefined;
    let containedHolders = undefined;
    let connectors = undefined;

    if (validResultStep2 === false) {
        validationErrorStep2 = "step2 result not valid";
    } else {
        containedHolders = resultWrapperStep2["core-model-1-4:equipment"][0]["contained-holder"];
        connectors = resultWrapperStep2["core-model-1-4:equipment"][0]["connector"];
    }

    return {containedHolders, connectors, topLevelRequestUUID, validationErrorStep2};
}

function validateResultStep4(callResult) {
    if (callResult) {
        if (callResult.code !== 500) {
            if (callResult["core-model-1-4:control-construct"][0]["logical-termination-point"]) {
                return true;
            }
        }
    }

    return false;
}

async function step4ReadingAugmentOfAllLtps(mountName) {

    let urlAdditionStep4 = await controlConstructUtil.getProfileStringValueByName(
        "RequestForTranslatingEquipmentSequenceIdCausesReadingDeviceData.ReadingAugmentOfAllLtps");
    let resultWrapperStep4 = await getDataFromMWDI("RequestForTranslatingEquipmentSequenceIdsCausesReadingDeviceData.ReadingAugmentOfAllLtps", mountName, urlAdditionStep4);
    //list of (ltpUuid, [equipment], connector)

    //for example {
    //   "core-model-1-4:control-construct": [
    //     {
    //       "logical-termination-point": [
    //         {
    //           "uuid": "LTP-ETY-TTP-2_LAN-3-RJ45",
    //           "ltp-augment-1-0:ltp-augment-pac": {
    //             "connector": "LAN-3-RJ45-Connector",
    //             "equipment": [
    //               "2-LIM 8xEth"
    //             ]
    //           }
    //         },
    //         {
    //           "uuid": "LTP-ETY-TTP-2_LAN-4-RJ45",
    //           "ltp-augment-1-0:ltp-augment-pac": {
    //             "connector": "",
    //             "equipment": [
    //               "2-LIM 8xEth"
    //             ]
    //           }
    //         }
    //       ]
    //     }
    //   ]
    // }

    let validResultStep4 = validateResultStep4(resultWrapperStep4);
    let validationErrorStep4 = undefined;

    let ltps = undefined;

    if (validResultStep4 === false) {
        validationErrorStep4 = "step4 request not valid";
    } else {
        ltps = resultWrapperStep4["core-model-1-4:control-construct"][0]["logical-termination-point"];
    }

    return {ltps, validationErrorStep4};
}

function validateResultStep5(callResult) {
    if (callResult) {
        if (callResult.code !== 500) {
            if (callResult["core-model-1-4:logical-termination-point"]) {
                return true;
            }
        }
    }

    return false;
}

async function step5ReadingServingLtp(ltps, equipmentUUID, connectorLocalID, mountName) {

    logger.debug("step5 input params equipmentUUID: " + equipmentUUID + ", connectorLocalID: " + connectorLocalID);

    let lowestLtpUUID = undefined;
    for (const resultLTP of ltps) {
        if (resultLTP["ltp-augment-1-0:ltp-augment-pac"]["equipment"]) {
            for (const equipment of resultLTP["ltp-augment-1-0:ltp-augment-pac"]["equipment"]) {
                if (equipment == equipmentUUID && resultLTP["ltp-augment-1-0:ltp-augment-pac"]["connector"] === connectorLocalID) {
                    lowestLtpUUID = resultLTP.uuid;
                    break;
                }
            }
        }

        if (lowestLtpUUID) {
            break;
        }
    }

    let validationErrorStep5 = undefined;
    let clientLtps = undefined;
    let resultListStep5Entry = undefined;

    if (lowestLtpUUID) {
        let urlAdditionStep5 = await controlConstructUtil.getProfileStringValueByName(
            "RequestForTranslatingEquipmentSequenceIdCausesReadingDeviceData.ReadingServingLtp");
        let resultWrapperStep5 = await getDataFromMWDI("RequestForTranslatingEquipmentSequenceIdsCausesReadingDeviceData.ReadingServingLtp", mountName, urlAdditionStep5, lowestLtpUUID);
        //service returns list of clientLtps, list of serverLtps, list of layer-protocol

        //for example {
        //     "core-model-1-4:logical-termination-point": [
        //         {
        //             "uuid": "LTP-MWS-2_LAN-4-RJ45",
        //             "client-ltp": [
        //                 "LTP-ETC-TTP-2_LAN-4-RJ45"
        //             ],
        //             "server-ltp": [
        //                 "LTP-ETY-TTP-2_LAN-4-RJ45"
        //             ],
        //             "layer-protocol": [
        //                 {
        //                     "local-id": "LP-MWS-2_LAN-4-RJ45",
        //                     "layer-protocol-name": "pure-ethernet-structure-2-0:LAYER_PROTOCOL_NAME_TYPE_PURE_ETHERNET_STRUCTURE_LAYER"
        //                 }
        //             ]
        //         }
        //     ]
        // }

        let validResultStep5 = validateResultStep5(resultWrapperStep5);

        if (validResultStep5 === false) {
            validationErrorStep5 = "step5 request not valid";
        } else {
            //should always be one ltp in list because we requested the lowestLtpUUID
            clientLtps = resultWrapperStep5["core-model-1-4:logical-termination-point"][0]["client-ltp"];

            resultListStep5Entry = buildResultEntry(resultWrapperStep5, lowestLtpUUID);
        }

    } else {
        validationErrorStep5 = "step5 no valid uuid for request found";
    }

    return {clientLtps, resultListStep5Entry, validationErrorStep5};
}

function validateResultStep6(callResult) {

    if (callResult) {
        if (callResult.code !== 500) {
            return true;
        }
    }

    return false;
}

async function step6ReadingClientLtp(clientLtps, mountName) {

    //will contain all response objects from all request cycles in step 6
    let resultList = [];
    let validationErrorStep6 = undefined;

    while (clientLtps.length > 0) {
        let step6RequestUUID = clientLtps[0];
        let urlAdditionStep6 = await controlConstructUtil.getProfileStringValueByName(
            "RequestForTranslatingEquipmentSequenceIdCausesReadingDeviceData.ReadingClientLtp");
        let resultWrapperStep6 = await getDataFromMWDI("RequestForTranslatingEquipmentSequenceIdsCausesReadingDeviceData.ReadingClientLtp", mountName, urlAdditionStep6, step6RequestUUID);
        //{[clientLtps], [serverLtps], [layer-protocol(layer-protocol-name)]}

        //for example {
        //   "core-model-1-4:control-construct": [
        //     {
        //       "logical-termination-point": [
        //         {
        //           "uuid": "LTP-MWS-2_LAN-4-RJ45",
        //           "client-ltp": [
        //             "LTP-ETC-TTP-2_LAN-4-RJ45"
        //           ],
        //           "server-ltp": [
        //             "LTP-ETY-TTP-2_LAN-4-RJ45"
        //           ],
        //           "layer-protocol": [
        //             {
        //               "local-id": "LP-MWS-2_LAN-4-RJ45",
        //               "layer-protocol-name": "pure-ethernet-structure-2-0:LAYER_PROTOCOL_NAME_TYPE_PURE_ETHERNET_STRUCTURE_LAYER"
        //             }
        //           ]
        //         }
        //       ]
        //     }
        //   ]
        // }

        let validResultStep6 = validateResultStep6(resultWrapperStep6);

        if (validResultStep6 === false) {
            validationErrorStep6 = "step6 request not valid";
            break;
        } else {
            let resultEntry = buildResultEntry(resultWrapperStep6, step6RequestUUID);
            resultList.push(resultEntry);

            if (resultWrapperStep6["core-model-1-4:logical-termination-point"][0]["client-ltp"]) {
                //set child clientltps to query in next loop
                clientLtps = resultWrapperStep6["core-model-1-4:logical-termination-point"][0]["client-ltp"];
            } else {
                //reached lowest level - no client ltps available
                clientLtps = [];
            }
        }
    }

    //return format {list of (uuid, [clientLtps], [serverLtps], [layer-protocol-names])}

    //for example
    //{
    //   "access-port-to-ltp-mappings": [
    //     {
    //       "uuid": "ETY-2134639620",
    //       "client-ltps": [
    //         "PES-21346039620"
    //       ],
    //       "server-ltps": [],
    //       "layer-protocol-names": [
    //         "wire-interface-2-0:LAYER_PROTOCOL_NAME_TYPE_WIRE_LAYER",
    //         "..."
    //       ]
    //     },
    //     {
    //       "uuid": "PES-2134639620",
    //       "client-ltps": [
    //         "ETH-2134639620"
    //       ],
    //       "server-ltps": [
    //         "ETY-2134639620"
    //       ],
    //       "layer-protocol-names": [
    //         "ppure-ethernet-structure-2-0:LAYER_PROTOCOL_NAME_TYPE_PURE_ETHERNET_STRUCTURE_LAYER",
    //         "..."
    //       ]
    //     },
    //     {
    //       "uuid": "ETH-2134639620",
    //       "client-ltps": [
    //         "MAC-2134639620"
    //       ],
    //       "server-ltps": [
    //         "PES-2134639620"
    //       ],
    //       "layer-protocol-names": [
    //         "ethernet-container-2-0:LAYER_PROTOCOL_NAME_TYPE_ETHERNET_CONTAINER_LAYER",
    //         "..."
    //       ]
    //     },
    //     {
    //       "uuid": "MAC-2134639620",
    //       "client-ltps": [
    //         "VI-4"
    //       ],
    //       "server-ltps": [
    //         "ETH-2134639620"
    //       ],
    //       "layer-protocol-names": [
    //         "mac-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_MAC_LAYER",
    //         "..."
    //       ]
    //     },
    //     {
    //       "uuid": "VI-4",
    //       "client-ltps": [],
    //       "server-ltps": [
    //         "MAC-2134639620"
    //       ],
    //       "layer-protocol-names": [
    //         "vlan-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_VLAN_LAYER",
    //         "..."
    //       ]
    //     }
    //   ]
    // }

    let resultListStep6Entries = resultList;

    return {resultListStep6Entries, validationErrorStep6};
}

/**
 * Forward request to MWDI.
 * @param callbackName
 * @param mountName
 * @param fieldsFilter
 * @param uuid
 * @returns {Promise}
 */
const getDataFromMWDI = async function (callbackName, mountName, fieldsFilter = undefined, uuid = undefined) {
    let opData = await controlConstructUtil.getForwardingConstructOutputOperationData(callbackName);

    let operationPath = opData.operationName;
    if (mountName) {
        operationPath = operationPath.replaceAll("{mountName}", mountName);
    }
    if (uuid) {
        operationPath = operationPath.replaceAll("{uuid}", uuid);
    }

    // f.e. protocol://ip:port/core-model-1-4:network-control-domain=cache/control-construct={mountName}
    let targetUrl = requestUtil.buildControllerTargetPath(opData.protocol, opData.address, opData.port) + operationPath;

    if (fieldsFilter) {
        targetUrl += "?fields=" + encodeURIComponent(fieldsFilter);
        //must be manually encoded
        targetUrl = targetUrl.replaceAll("(", "%28").replaceAll(")", "%29");
    }

    logger.debug("get request to '" + targetUrl + "'");

    const ret = await restClient.startGetRequest(targetUrl, callbackName, opData.operationKey);

    logger.debug("result received from '" + targetUrl + "': " + JSON.stringify(ret));

    return ret.message;
}