'use strict';

const StringProfile = require('../service/StringProfileService');
const logger = require('../service/LoggingService.js').getLogger();

module.exports.getStringProfileEnumeration = function getStringProfileEnumeration (req, res, next, uuid) {
  StringProfile.getStringProfileEnumeration(uuid)
    .then(function (response) {
      logger.debug("getStringProfileEnumeration: " + res + " / " + response);
    })
    .catch(function (response) {
      logger.error(response, "Exception in getStringProfileEnumeration: " + res);
    });
};

module.exports.getStringProfilePattern = function getStringProfilePattern (req, res, next, uuid) {
  StringProfile.getStringProfilePattern(uuid)
    .then(function (response) {
      logger.debug("getStringProfilePattern: " + res + " / " + response);
    })
    .catch(function (response) {
      logger.error(response, "Exception in getStringProfilePattern: " + res);
    });
};

module.exports.getStringProfileStringName = function getStringProfileStringName (req, res, next, uuid) {
  StringProfile.getStringProfileStringName(uuid)
    .then(function (response) {
      logger.debug("getStringProfileStringName: " + res + " / " + response);
    })
    .catch(function (response) {
      logger.error(response, "Exception in getStringProfileStringName: " + res);
    });
};

module.exports.getStringProfileStringValue = function getStringProfileStringValue (req, res, next, uuid) {
  StringProfile.getStringProfileStringValue(uuid)
    .then(function (response) {
      logger.debug("getStringProfileStringValue: " + res + " / " + response);
    })
    .catch(function (response) {
      logger.error(response, "Exception in getStringProfileStringValue: " + res);
    });
};

module.exports.putStringProfileStringValue = function putStringProfileStringValue (req, res, next, body, uuid) {
  StringProfile.putStringProfileStringValue(body, uuid)
    .then(function (response) {
      logger.debug("putStringProfileStringValue: " + res + " / " + response);
    })
    .catch(function (response) {
      logger.error(response, "Exception in putStringProfileStringValue: " + res);
    });
};
