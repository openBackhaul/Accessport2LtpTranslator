'use strict';

const bequeathHandler = require('./individualServices/BequeathHandler');
const logger = require('./LoggingService.js').getLogger();
const sequenceToUUIDTranslator = require ('./individualServices/SequenceIdToUUIDTranslator')

/**
 * Initiates process of embedding a new release
 *
 * body V1_bequeathyourdataanddie_body
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]'
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.bequeathYourDataAndDie = function(requestUrl,body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let success = await bequeathHandler.handleRequest(body, requestUrl);

      if (success) {
        resolve();
      } else {
        reject(new Error("bequeathHandler.handleRequest failed."));
      }
    } catch (exception) {
      logger.error(exception, "bequeath was not successful");
      reject(exception);
    }
  });
}


/**
 * Provides the translation of equipment sequence ids to ltp uuids.
 *
 * body V1_translateequipmentsequenceidstoltpuuids_body
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]'
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 **/
exports.translateEquipmentSequenceIdsToLtpUuids = function(requestUrl,body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(async function (resolve, reject) {
    let mountName = body['mount-name'];
    let stringOfConcatenatedSequenceIDs = body['string-of-concatenated-sequence-ids'];
    let topLevelEquipmentUUID = body['topLevelEquipmentUUID'];

    let resultDataArray = await sequenceToUUIDTranslator.handleTranslateEquipmentSequenceIDsToLTPUUIDs(mountName, stringOfConcatenatedSequenceIDs, topLevelEquipmentUUID);
    resolve(resultDataArray);
  });
}

