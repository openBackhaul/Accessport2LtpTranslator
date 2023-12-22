'use strict';

const bequeathHandler = require('./individualServices/BequeathHandler');
const logger = require('./LoggingService.js').getLogger();

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
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "access-port-to-ltp-mappings" : [ {
    "uuid" : "ETY-2134639620",
    "client-ltps" : [ "PES-21346039620" ],
    "server-ltps" : [ ],
    "layer-protocol-names" : [ "wire-interface-2-0:LAYER_PROTOCOL_NAME_TYPE_WIRE_LAYER", "..." ]
  }, {
    "uuid" : "PES-2134639620",
    "client-ltps" : [ "ETH-2134639620" ],
    "server-ltps" : [ "ETY-2134639620" ],
    "layer-protocol-names" : [ "ppure-ethernet-structure-2-0:LAYER_PROTOCOL_NAME_TYPE_PURE_ETHERNET_STRUCTURE_LAYER", "..." ]
  }, {
    "uuid" : "ETH-2134639620",
    "client-ltps" : [ "MAC-2134639620" ],
    "server-ltps" : [ "PES-2134639620" ],
    "layer-protocol-names" : [ "ethernet-container-2-0:LAYER_PROTOCOL_NAME_TYPE_ETHERNET_CONTAINER_LAYER", "..." ]
  }, {
    "uuid" : "MAC-2134639620",
    "client-ltps" : [ "VI-4" ],
    "server-ltps" : [ "ETH-2134639620" ],
    "layer-protocol-names" : [ "mac-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_MAC_LAYER", "..." ]
  }, {
    "uuid" : "VI-4",
    "client-ltps" : [ ],
    "server-ltps" : [ "MAC-2134639620" ],
    "layer-protocol-names" : [ "vlan-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_VLAN_LAYER", "..." ]
  } ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

