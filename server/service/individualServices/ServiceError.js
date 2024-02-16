module.exports = Object.freeze({
    InputValidation_ConcatenatedSequenceEmpty: {
        http_status: 400,
        message: 'input sequence invalid',
    },
    InputValidation_NoConnectorInConcatenatedSequence: {
        http_status: 400,
        message: 'no connector found in input sequence',
    },

    ReadingUuidsOfTopLevelEquipment_NoResults: {
        http_status: 500,
        message: 'ReadingUuidsOfTopLevelEquipment - No top level equipment found for device',
    },
    ReadingUuidsOfTopLevelEquipment_TopLevelUuidProvidedAndNotContainedInTopLevelUuids: {
        http_status: 500,
        message: 'ReadingUuidsOfTopLevelEquipment - Provided top level uuid not contained in topLevelEquipment-list from device',
    },    
    ReadingUuidsOfTopLevelEquipment_NoTopLevelUuidProvidedAndMoreThanOneTopLevelEquipmentUuid: {
        http_status: 500,
        message: 'ReadingUuidsOfTopLevelEquipment - No top level uuid provided and more than one top level equipment in device',
    },
    ReadingUuidsOfTopLevelEquipment_NoResponse: {
        http_status: 500,
        message: 'ReadingUuidsOfTopLevelEquipment - No response from MWDI',
    },
    ReadingUuidsOfTopLevelEquipment_UnknownError: {
        http_status: 500,
        message: 'ReadingUuidsOfTopLevelEquipment - Unknown error occurred',
    },


    ReadingEquipmentDataOfTopLevelEquipment_NoResults: {
        http_status: 500,
        message: 'ReadingEquipmentDataOfTopLevelEquipment - No usable data in MWDI response',
    },
    ReadingEquipmentDataOfTopLevelEquipment_NoResponse: {
        http_status: 500,
        message: 'ReadingEquipmentDataOfTopLevelEquipment - No response from MWDI',
    },
    ReadingEquipmentDataOfTopLevelEquipment_UnknownError: {
        http_status: 500,
        message: 'ReadingEquipmentDataOfTopLevelEquipment - Unknown error occurred',
    },


    ReadingEquipmentDataInHolder_DuplicateHolderSequenceIdsInHolder: {
        http_status: 500,
        message: 'ReadingEquipmentDataInHolder - Found duplicate for searched holder sequence id in holder',
    },
    ReadingEquipmentDataInHolder_DuplicateConnectorSequenceIdsInHolder: {
        http_status: 500,
        message: 'ReadingEquipmentDataInHolder - Found duplicate for searched connector sequence id in holder',
    },
    ReadingEquipmentDataInHolder_HolderNotFound: {
        http_status: 500,
        message: 'ReadingEquipmentDataInHolder - Holder sequence id not found in contained-holders',
    },
    ReadingEquipmentDataInHolder_ConnectorNotFound: {
        http_status: 500,
        message: 'ReadingEquipmentDataInHolder - Connector sequence id not found in available connectors (list was not empty)',
    },
    ReadingEquipmentDataInHolder_OccupyingFruForHolderMissing: {
        http_status: 500,
        message: 'ReadingEquipmentDataInHolder - Holder found without matching occupying-fru',
    },
    ReadingEquipmentDataInHolder_NoHoldersInResult: {
        http_status: 500,
        message: 'ReadingEquipmentDataInHolder - No holders available in equipment (list was empty)',
    },
    ReadingEquipmentDataInHolder_NoConnectorsInResult: {
        http_status: 500,
        message: 'ReadingEquipmentDataInHolder - No connectors available in holder (list was empty)',
    },
    ReadingEquipmentDataInHolder_NoResponse: {
        http_status: 500,
        message: 'ReadingEquipmentDataInHolder - No response from MWDI',
    },
    ReadingEquipmentDataInHolder_UnknownError: {
        http_status: 500,
        message: 'ReadingEquipmentDataInHolder - Unknown error occurred',
    },


    ReadingAugmentOfAllLtps_NoLtps: {
        http_status: 500,
        message: 'ReadingAugmentOfAllLtps - No ltps in result from MWDI',
    },
    ReadingAugmentOfAllLtps_NoResponse: {
        http_status: 500,
        message: 'ReadingAugmentOfAllLtps - No response from MWDI',
    },
    ReadingAugmentOfAllLtps_UnknownError: {
        http_status: 500,
        message: 'ReadingAugmentOfAllLtps - Unknown error occurred',
    },


    ReadingServingLtp_CannotMatchResult: {
        http_status: 500,
        message: 'ReadingServingLtp - Equipment and connector cannot be matched to ltp by uuids',
    },
    ReadingServingLtp_NoLtpInResult: {
        http_status: 500,
        message: 'ReadingServingLtp - No ltp in MWDI result',
    },
    ReadingServingLtp_NoResponse: {
        http_status: 500,
        message: 'ReadingServingLtp - No response from MWDI',
    },
    ReadingServingLtp_UnknownError: {
        http_status: 500,
        message: 'ReadingServingLtp - Unknown error occurred',
    },
    
    ReadingClientLtp_NoClientLtps: {
        http_status: 500,
        message: 'ReadingClientLtp - No client ltps to query for data',
    },
    ReadingClientLtp_NoResponse: {
        http_status: 500,
        message: 'ReadingClientLtp - No response from MWDI',
    },
    ReadingClientLtp_UnknownError: {
        http_status: 500,
        message: 'ReadingClientLtp - Unknown error occurred',
    },
});