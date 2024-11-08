const controlConstructUtil = require('./ControlConstructUtil');
const requestUtil = require('./RequestUtil');
const restClient = require('./RestClient');
const logger = require('../LoggingService.js').getLogger();
const ServiceError = require('./ServiceError.js');

function validateInputSequence(stringOfConcatenatedSequenceIDs) {
    if (stringOfConcatenatedSequenceIDs.length < 1) {
        return ServiceError.InputValidation_ConcatenatedSequenceEmpty;
    }

    let indexLastElement = stringOfConcatenatedSequenceIDs.lastIndexOf(".");

    let lastSequenceId;
    if (indexLastElement > 0) {
        lastSequenceId = stringOfConcatenatedSequenceIDs.substring(indexLastElement + 1);
    } else {
        lastSequenceId = stringOfConcatenatedSequenceIDs;
    }

    if (lastSequenceId.startsWith("c")) {
        return undefined; //OK
    } else {
        return ServiceError.InputValidation_NoConnectorInConcatenatedSequence;
    }
}

exports.handleTranslateEquipmentSequenceIDsToLTPUUIDs = async function (mountName, stringOfConcatenatedSequenceIDs, topLevelEquipmentUUID) {

    logger.info('translation starting with params: mountName:' + mountName + " stringOfConcatenatedSequenceIDs:" + stringOfConcatenatedSequenceIDs
        + " topLevelEquipmentUUID:" + topLevelEquipmentUUID);

    let inputValidationError = validateInputSequence(stringOfConcatenatedSequenceIDs);

    if (inputValidationError) {
        logger.error("input sequence not valid");
        return {error: inputValidationError};
    }

    //1. GET ReadingUuidsOfTopLevelEquipment
    let {
        equipmentList,
        validationErrorStep1
    } = await step1ReadingUuidsOfTopLevelEquipment(mountName, topLevelEquipmentUUID);

    if (validationErrorStep1) {
        logger.error(validationErrorStep1);
        return {error: validationErrorStep1};
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
        return {error: validationErrorStep2};
    }

    //3. GET ReadingEquipmentDataInHolder
    let {
        pairResult,
        validationErrorStep3
    } = await step3ReadingEquipmentDataInHolder(stringOfConcatenatedSequenceIDs, connectors, containedHolders, topLevelRequestUUID, mountName);

    if (validationErrorStep3) {
        logger.error(validationErrorStep3);
        return {error: validationErrorStep3};
    }

    //4. GET ReadingAugmentOfAllLtps
    let {ltps, validationErrorStep4} = await step4ReadingAugmentOfAllLtps(mountName);

    if (validationErrorStep4) {
        logger.error(validationErrorStep4);
        return {error: validationErrorStep4};
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
        return {error: validationErrorStep5};
    }

    resultList.push(resultListStep5Entry);

    //6. GET ReadingClientLtp
    let {
        resultListStep6Entries,
        validationErrorStep6
    } = await step6ReadingClientLtp(clientLtps, mountName);

    if (validationErrorStep6) {
        logger.error(validationErrorStep6);
        return {error: validationErrorStep6};
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

function checkConnectorsForDuplicateSequenceIDs(connectorsToQuery, searchedSequenceID) {
    const keyOccurrences = {};

    for (const connector of connectorsToQuery) {
        let sequenceId = connector["equipment-augment-1-0:connector-pac"]["sequence-id"];
        if (keyOccurrences[sequenceId] && sequenceId == searchedSequenceID) {
            return true;
        } else {
            keyOccurrences[sequenceId] = 1;
        }
    }

    return false;
}

function checkHoldersForDuplicateSequenceIDs(holdersToQuery, searchedSequenceID) {
    const keyOccurrences = {};

    for (const holder of holdersToQuery) {
        let sequenceId = holder["equipment-augment-1-0:holder-pac"]["sequence-id"];
        if (keyOccurrences[sequenceId] && sequenceId == searchedSequenceID) {
            return true;
        } else {
            keyOccurrences[sequenceId] = 1;
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

    let pairResult = undefined;
    let validationErrorStep3 = undefined;

    try {
        let equipmentUUID = undefined;

        let nextUUID = undefined;
        let connectorsToQuery = topLevelConnectors;
        let holdersToQuery = topLevelContainedHolders;

        let listOfSequenceIDs = stringOfConcatenatedSequenceIDs.split('.');
        //note: sequenceIDs are not unique across holders and connectors
        for (const inputSequenceID of listOfSequenceIDs) {

            logger.debug("searching sequence " + inputSequenceID);
            let sequenceID = inputSequenceID.substring(1); //convert "h1" to "1"

            let matchingHolderUUID = undefined;

            if (inputSequenceID.startsWith("h")) {
                if (holdersToQuery.length < 1) {
                    logger.warn("no holders in result");
                    validationErrorStep3 = ServiceError.ReadingEquipmentDataInHolder_NoHoldersInResult;
                    break;
                } else {
                    let duplicateSequenceIdsInHolders = checkHoldersForDuplicateSequenceIDs(holdersToQuery, sequenceID);
                    if (duplicateSequenceIdsInHolders) {
                        logger.error("sequenceId duplicates found in holders for id " + sequenceID);
                        validationErrorStep3 = ServiceError.ReadingEquipmentDataInHolder_DuplicateHolderSequenceIdsInHolder;
                        break;
                    }

                    for (const containedHolder of holdersToQuery) {
                        if (containedHolder["equipment-augment-1-0:holder-pac"].hasOwnProperty("sequence-id")) {
                            let containedHolderSeqId = containedHolder["equipment-augment-1-0:holder-pac"]["sequence-id"];
                            logger.debug("checking sequenceId " + sequenceID + " against holderSeqId " + containedHolderSeqId);
                            if (sequenceID == containedHolderSeqId) {
                                if (containedHolder.hasOwnProperty("occupying-fru")) {
                                    matchingHolderUUID = containedHolder["occupying-fru"];
                                    logger.debug("found matching uuid fru: " + matchingHolderUUID);
                                    break;
                                } else {
                                    logger.warn("no occupying-fru for contained-holder: " + JSON.stringify(containedHolder));
                                    validationErrorStep3 = ServiceError.ReadingEquipmentDataInHolder_OccupyingFruForHolderMissing;
                                }
                            }
                        } else {
                            logger.warn("holder without sequenceId found: " + JSON.stringify(containedHolder));
                        }
                    }

                    if (matchingHolderUUID) {
                        nextUUID = matchingHolderUUID;
                    } else {
                        logger.info("no matching holder found");
                        if (validationErrorStep3 === undefined) {
                            validationErrorStep3 = ServiceError.ReadingEquipmentDataInHolder_HolderNotFound;
                        }
                        break;
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

                        if (resultWrapperStep3) {
                            logger.debug("updating connectors and holders to query from " + nextUUID);

                            //use holder lists for next loop
                            connectorsToQuery = resultWrapperStep3["core-model-1-4:equipment"]?.[0]?.["connector"];
                            if (!connectorsToQuery) {
                                connectorsToQuery = [];
                            }
                            holdersToQuery = resultWrapperStep3["core-model-1-4:equipment"]?.[0]?.["contained-holder"];
                            if (!holdersToQuery) {
                                holdersToQuery = [];
                            }
                        } else {
                            logger.error("step3 request not valid: request for " + mountName + " and uuid " + nextUUID + " failed");
                            validationErrorStep3 = ServiceError.ReadingEquipmentDataInHolder_NoResponse;
                            break;
                        }
                    }
                }
            }
            else if (inputSequenceID.startsWith("c")) {
                if (connectorsToQuery.length < 1) {
                    logger.error("step3 no connectors in result");
                    validationErrorStep3 = ServiceError.ReadingEquipmentDataInHolder_NoConnectorsInResult;
                } else {
                    if (nextUUID) {
                        equipmentUUID = nextUUID;
                    } else {
                        // nextUUID = topLevelUUID;
                        equipmentUUID = topLevelUUID;
                    }

                    let duplicateSequenceIdsInConnectors = checkConnectorsForDuplicateSequenceIDs(connectorsToQuery, sequenceID);
                    if (duplicateSequenceIdsInConnectors) {
                        logger.error("sequenceId duplicates found in connectors for id " + sequenceID);
                        validationErrorStep3 = ServiceError.ReadingEquipmentDataInHolder_DuplicateConnectorSequenceIdsInHolder;
                        break;
                    }

                    let connectorLocalID = undefined;

                    if (connectorsToQuery) {
                        for (const connector of connectorsToQuery) {
                            if (connector["equipment-augment-1-0:connector-pac"].hasOwnProperty("sequence-id")) {
                                if (sequenceID == connector["equipment-augment-1-0:connector-pac"]["sequence-id"]) {
                                    connectorLocalID = connector["local-id"];
                                    break;
                                }
                            } else {
                                logger.warn("connector without sequenceId found: " + JSON.stringify(connector));
                            }
                        }
                    }

                    if (connectorLocalID) {
                        pairResult = {equipmentUUID, connectorLocalID};
                        logger.debug("step3 - result pair found: " + equipmentUUID + " " + connectorLocalID);
                        break;
                    } else {
                        logger.info("no matching connector found");
                        validationErrorStep3 = ServiceError.ReadingEquipmentDataInHolder_ConnectorNotFound;
                        break;
                    }
                }
            }
            else {
                logger.error("invalid sequenceId: " + inputSequenceID);
                validationErrorStep3 = ServiceError.ReadingEquipmentDataInHolder_InvalidSequenceId;
                break;
            }
        }
    } catch (exception) {
        logger.error("error occurred step3: " + JSON.stringify(exception));
        validationErrorStep3 = ServiceError.ReadingEquipmentDataInHolder_UnknownError;
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
    // clientLtp may be not available when at the lowest request level
    if (resultWrapperStep5Or6["core-model-1-4:logical-termination-point"][0]["client-ltp"] && resultWrapperStep5Or6["core-model-1-4:logical-termination-point"][0]["client-ltp"].length > 0) {
        clientLtps = resultWrapperStep5Or6["core-model-1-4:logical-termination-point"][0]["client-ltp"];
    }

    let serverLtps = [];
    // serverLtp may be not available when at the highest request level
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

    try {
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
            logger.error("step1 result not successful, mwdi reported: " + step1ResultWrapper?.code + " " + step1ResultWrapper?.message);
            validationErrorStep1 = ServiceError.ReadingUuidsOfTopLevelEquipment_NoResponse;
        } else if (step1ResultWrapper["core-model-1-4:control-construct"].length === 0) {
            logger.error("no top level equipment list in result");
            validationErrorStep1 = ServiceError.ReadingUuidsOfTopLevelEquipment_NoResponse;
        } else {
            equipmentList = step1ResultWrapper["core-model-1-4:control-construct"][0]["top-level-equipment"];

            if (topLevelEquipmentUUID) {
                //validate uuid against list of top level uuids
                if (equipmentList.includes(topLevelEquipmentUUID) === false) {
                    logger.error("provided topLevelEquipmentUUID not contained in MWDI listOfTopLevelUUIDs");
                    validationErrorStep1 = ServiceError.ReadingUuidsOfTopLevelEquipment_TopLevelUuidProvidedAndNotContainedInTopLevelUuids;
                }
            }
            //no topLevelEquipmentUUID provided (optional parameter)
            else if (equipmentList.length > 1) {
                //list not valid - too many entries
                logger.error("too many entries in returned topLevelUUIDs");
                validationErrorStep1 = ServiceError.ReadingUuidsOfTopLevelEquipment_NoTopLevelUuidProvidedAndMoreThanOneTopLevelEquipmentUuid;
            } else if (equipmentList.length === 0) {
                logger.error("no entries in returned topLevelUUIDs");
                validationErrorStep1 = ServiceError.ReadingUuidsOfTopLevelEquipment_NoResults;
            }
        }
    } catch (exception) {
        logger.error("error occurred step1: " + JSON.stringify(exception));
        validationErrorStep1 = ServiceError.ReadingUuidsOfTopLevelEquipment_UnknownError;
    }

    return {equipmentList, validationErrorStep1};
}

/**
 *
 * @param topLevelEquipmentUUID
 * @param equipmentList
 * @param mountName
 * @return {Promise<{topLevelRequestUUID, connectors, validationErrorStep2: undefined, containedHolders}>}
 */
async function step2ReadingEquipmentDataOfTopLevelElement(topLevelEquipmentUUID, equipmentList, mountName) {
    let validationErrorStep2 = undefined;
    let containedHolders = undefined;
    let connectors = undefined;
    let topLevelRequestUUID = undefined;

    try {

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

        if (resultWrapperStep2) {
            if (resultWrapperStep2["core-model-1-4:equipment"].length > 0) {
                containedHolders = resultWrapperStep2["core-model-1-4:equipment"][0]["contained-holder"];
                connectors = resultWrapperStep2["core-model-1-4:equipment"][0]["connector"];
            } else {
                logger.error("no equipment results received from mwdi");
                validationErrorStep2 = ServiceError.ReadingEquipmentDataOfTopLevelEquipment_NoResults;
            }
        } else {
            logger.error("no response received from mwdi");
            validationErrorStep2 = ServiceError.ReadingEquipmentDataOfTopLevelEquipment_NoResponse;
        }

    } catch (exception) {
        logger.error("error occurred step2: " + JSON.stringify(exception));
        validationErrorStep2 = ServiceError.ReadingEquipmentDataOfTopLevelEquipment_UnknownError;
    }

    return {containedHolders, connectors, topLevelRequestUUID, validationErrorStep2};
}

async function step4ReadingAugmentOfAllLtps(mountName) {

    let validationErrorStep4 = undefined;
    let ltps = undefined;

    try {
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

        if (resultWrapperStep4) {
            if (resultWrapperStep4["core-model-1-4:control-construct"][0]["logical-termination-point"]) {
                ltps = resultWrapperStep4["core-model-1-4:control-construct"][0]["logical-termination-point"];
            } else {
                logger.error("step 4 no ltp in result");
                validationErrorStep4 = ServiceError.ReadingAugmentOfAllLtps_NoLtps;
            }
        } else {
            logger.error("step 4 no result from mwdi");
            validationErrorStep4 = ServiceError.ReadingAugmentOfAllLtps_NoResponse;
        }
    } catch (exception) {
        logger.error("error occurred step4: " + JSON.stringify(exception));
        validationErrorStep4 = ServiceError.ReadingAugmentOfAllLtps_UnknownError;
    }

    return {ltps, validationErrorStep4};
}

async function step5ReadingServingLtp(ltps, equipmentUUID, connectorLocalID, mountName) {

    let validationErrorStep5 = undefined;
    let clientLtps = undefined;
    let resultListStep5Entry = undefined;

    try {
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

            if (resultWrapperStep5) {
                if (resultWrapperStep5["core-model-1-4:logical-termination-point"]) {
                    //should always be one ltp in list because we requested the lowestLtpUUID
                    clientLtps = resultWrapperStep5["core-model-1-4:logical-termination-point"][0]["client-ltp"];

                    resultListStep5Entry = buildResultEntry(resultWrapperStep5, lowestLtpUUID);
                } else {
                    logger.error("step 5 no ltp data in result");
                    validationErrorStep5 = ServiceError.ReadingServingLtp_NoLtpInResult;
                }
            } else {
                logger.error("step 5 no result from mwdi");
                validationErrorStep5 = ServiceError.ReadingServingLtp_NoResponse;
            }
        } else {
            logger.warn("step 5 ltps cannot be matched to equipment and connector");
            validationErrorStep5 = ServiceError.ReadingServingLtp_CannotMatchResult;
        }
    } catch (exception) {
        logger.error("error occurred step5: " + JSON.stringify(exception));
        validationErrorStep5 = ServiceError.ReadingServingLtp_UnknownError;
    }

    return {clientLtps, resultListStep5Entry, validationErrorStep5};
}

async function step6ReadingClientLtp(clientLtps, mountName) {

    //will contain all response objects from all request cycles in step 6
    let validationErrorStep6 = undefined;
    let resultListStep6Entries = undefined;

    try {
        if (clientLtps.length < 1) {
            logger.warn("step6 no client ltps to query");
            validationErrorStep6 = ServiceError.ReadingClientLtp_NoClientLtps;
        } else {
            let resultList = [];

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

                if (resultWrapperStep6) {
                    let resultEntry = buildResultEntry(resultWrapperStep6, step6RequestUUID);
                    resultList.push(resultEntry);

                    if (resultWrapperStep6["core-model-1-4:logical-termination-point"][0]["client-ltp"]) {
                        //set child clientltps to query in next loop
                        clientLtps = resultWrapperStep6["core-model-1-4:logical-termination-point"][0]["client-ltp"];
                    } else {
                        //reached lowest level - no client ltps available
                        clientLtps = [];
                    }
                } else {
                    logger.error("step6 mwdi no result");
                    validationErrorStep6 = ServiceError.ReadingClientLtp_NoResponse;
                    break;
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

            resultListStep6Entries = resultList;
        }
    } catch (exception) {
        logger.error("error occurred step6: " + JSON.stringify(exception));
        validationErrorStep6 = ServiceError.ReadingClientLtp_UnknownError;
    }

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